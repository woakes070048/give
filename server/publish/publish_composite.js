Meteor.publishComposite('transactions', function (transfer_id) {
  check(transfer_id, Match.Optional(String));
  if (Roles.userIsInRole(this.userId, ['admin', 'manager'])) {
    return {
      find: function () {
        return Transactions.find( {
          $and: [{ transfer_id: transfer_id }, { type: { $ne: 'transfer' } }]
        } );
      },
      children: [
        {
          find: function ( transactions ) {
            if(transactions.source.slice(0,3) === 'pyr' || transactions.source.slice(0,3) === 're_'){
              return Refunds.find(
                { _id: transactions.source },
                {
                  limit:  1,
                  fields: {
                    id: 1,
                    object: 1,
                    created: 1,
                    charge: 1,
                    'charge.id': 1,
                    'charge.metadata': 1,
                    'charge.customer': 1,
                    'charge.created': 1,
                    'charge.payment_source': 1,
                    'charge.source': 1,
                    'charge.refunded': 1,
                    'charge.refunds': 1,
                    description: 1
                  }
                } );
            } else {
              return Charges.find(
                { _id: transactions.source },
                {
                  limit:  1,
                  fields: {
                    id: 1,
                    object: 1,
                    metadata: 1,
                    customer: 1,
                    created: 1,
                    payment_source: 1,
                    source: 1,
                    refunded: 1,
                    refunds: 1,
                    status: 1
                  }
                } );
            }
          },
          children: [
            {
              find: function ( charges ) {
                if (charges.object === 'refund') {
                  return Customers.find(
                    { _id: charges.charge.customer },
                    {
                      limit:  1,
                      fields: {
                        id: 1,
                        email:    1,
                        metadata: 1
                      }
                    } );
                } else {
                  return Customers.find(
                    { _id: charges.customer },
                    {
                      limit:  1,
                      fields: {
                        id: 1,
                        email:    1,
                        metadata: 1
                      }
                    } );
                }
              }
            },
            {
              find: function ( charges ) {
                return DT_donations.find(
                  { transaction_id: charges._id },
                  {
                    limit:  1,
                    fields: {
                      persona_id:       1,
                      transaction_id:   1
                    }
                  } );
              }
            }
          ]
        }
      ]
    }
  } else {
    this.stop();
    return;
  }
});

Meteor.publishComposite('subscriptions_and_customers', function (searchValue, limit) {
  check(searchValue, Match.Maybe(String));
  check(limit, Match.Maybe(Number));

  // Publish the nearly expired or expired card data to the admin dashboard
  if (Roles.userIsInRole(this.userId, ['super-admin', 'admin', 'manager'])) {
    const limitValue = limit ? limit : 0;
    const options = {
      sort: {created: -1},
      limit: limitValue
    };

    return {
      find: function () {
        // Find posts made by user. Note arguments for callback function
        // being used in query.
        return Subscriptions.find( {
          $and: [{
            $or: [
              { status: 'active' },
              { status: 'trialing' },
              { status: 'past_due' }
            ]
          }, {
            $or: [
              {
                'metadata.fname': {
                $regex: searchValue, $options: 'i'
                }
              },
              {
                'metadata.lname': {
                  $regex: searchValue, $options: 'i'
                }
              },
              {
                'metadata.business_name': {
                  $regex:   searchValue,
                  $options: 'i'
                }
              },
              {
                'metadata.email': {
                  $regex:   searchValue,
                  $options: 'i'
                }
              }
            ]
          }]
        }, options );
      },
      children: [
        {
          find: function ( subscriptions ) {
            // Find post author. Even though we only want to return
            // one record here, we use "find" instead of "findOne"
            // since this function should return a cursor.
            return Customers.find(
              { _id: subscriptions.customer },
              {
                limit:  1,
                fields: {
                  metadata:       1,
                  default_source: 1,
                  default_source_type: 1,
                  sources: 1,
                  subscriptions: 1
                }
              } );
          }
        }
      ]
    }
  } else {
    this.stop();
    return;
  }
});


Meteor.publishComposite("publish_for_admin_give_form", function(id) {
  check(id, String);
  if (Roles.userIsInRole(this.userId, ['admin'])) {
    return {
      find:     function () {
        return Customers.find( { 'metadata.user_id': id } );
      },
      children: [
        {
          find: function ( customers ) {
            // Find post author. Even though we only want to return
            // one record here, we use "find" instead of "findOne"
            // since this function should return a cursor.
            return Devices.find( { customer: customers._id, 'metadata.saved': 'true' } );
          }
        }
      ]
    }
  } else {
    // user not authorized. do not publish
    this.ready();
  }
});

Meteor.publishComposite('ach', function () {

  // Publish the nearly expired or expired card data to the admin dashboard
  if (Roles.userIsInRole(this.userId, ['admin'])) {

    return {
      find: function () {
        return Donations.find({
          $and: [
            {
              method: "manualACH"
            }, {
              $or: [
                { status: 'pending' },
                { status: 'failed' }
              ]
            }
          ]
        });
      },
      children: [
        {
          find: function ( donations ) {
            // Find post author. Even though we only want to return
            // one record here, we use "find" instead of "findOne"
            // since this function should return a cursor.
            return Customers.find({ _id: donations.customer_id});
          }
        },
        {
          find: function ( donations ) {
            // Find post author. Even though we only want to return
            // one record here, we use "find" instead of "findOne"
            // since this function should return a cursor.
            return BankAccounts.find({ _id: donations.source_id});
          }
        }
      ]
    }
  } else {
    this.stop();
    return;
  }
});

Meteor.publishComposite("travelDTSplits", function (tripId) {
  check(tripId, Match.Optional(String));

  if (Roles.userIsInRole(this.userId, ['admin', 'trips-manager', 'trips-member'])) {
    var funds = [];
    if (tripId) {
      let fundId = Trips.findOne({_id: tripId}) && Trips.findOne({_id: tripId}).fundId;
      console.log(fundId);
      funds[0] = Number(fundId);
    } else {
      funds = Trips.find().map(function ( item ) {
        return Number(item.fundId);
      });  
    }
    console.log(funds);

    return {
      find: function () {
        return DT_splits.find({
          fund_id: {
            $in: funds
          }
        });
      },
      children: [
        {
          find: function ( split ) {
            return DT_donations.find({ _id: split.donation_id });
          },
          children: [
            {
              find: function ( donation ) {
                // Find the person associated with this donation
                return DT_personas.find(
                  { _id: donation.persona_id }, {
                    limit:  1,
                    fields: {
                      persona_id: 1,
                      recognition_name: 1
                    }
                  } );
              }
            }
          ]
        }
      ]
    }
  } else {
    this.ready();
  }
});

Meteor.publishComposite("subscriptions", function () {
  logger.info("Started publish function, subscriptions");
  if (this.userId) {
    return {
      find: function () {
        return Customers.find({'metadata.user_id': this.userId});
      },
      children: [
        {
          find: function ( customers ) {
            // Find the charges associated with this customer
            return Charges.find( { 'customer': customers._id } );
          }
        }, {
            find: function ( customers ) {
              // Find the subscriptions associated with this customer
              return Subscriptions.find({$and: [{'customer': customers._id}, {'metadata.replaced': {$ne: true}}]});
            }
        }, {
          find: function ( customers ) {
            // Find the devices used (payment methods) and saved with this customer
            return Devices.find({ $and: [{
                'customer': customers._id
                }, {
                'metadata.saved': 'true'
              }]
            }, {
              fields: {
                fingerprint: 0,
                routing_number: 0,
                account_holder_type: 0,
                currency: 0
              }
            });
          }
        }, {
          find: function ( customers ) {
            // Find the donation document for any manualACH transactions
            // only show the pending status since that is what shows the next months gift
            return Donations.find({ $and: [{
                'customer_id': customers._id
                }, {
                'method': 'manualACH'
                }, {
                'status': 'pending'
            }]
            });
          }
        }
      ]
    }
  } else {
    this.ready();
  }
});

Meteor.publishComposite("tripsMember", function (id) {
  logger.info( "Started publish function, tripsMember" );
  check(id, Match.Optional(String));

  if( this.userId ) {
    console.log(this.userId);
    let user = Meteor.users.findOne({_id: this.userId});
    return {
      find: function () {
        return Fundraisers.find( { email: user.emails[0].address } );
      },
      children: [
        {
          find: function (fundraiser) {
            if (fundraiser && fundraiser.trips) {
              // Find the person associated with this donation
              return Trips.find( { _id: {$in: fundraiser.trips.map(function(item){return item.id}) }} );
            }
            return;
          }
        }
      ]
    }
  } else if (id && Roles.userIsInRole(this.userId, ['admin', 'trips-manager'])) {
    console.log(id);
    let user = Meteor.users.findOne({_id: id});
    return {
      find: function () {
        return Fundraisers.find( { email: user.emails[0].address } );
      },
      children: [
        {
          find: function (fundraiser) {
            if (fundraiser && fundraiser.trips) {
              // Find the person associated with this donation
              return Trips.find( { _id: {$in: fundraiser.trips.map(function(item){return item.id}) }} );
            }
            return;
          }
        }
      ]
    }
  }
});
