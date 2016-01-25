Template.SubscriptionsOverview.helpers({
    subscriptions: function(){
        var subscription_page = Session.get('subscription_cursor');
        var subscriptions = Subscriptions.find();
        Session.set("number_of_subscriptions", subscriptions.count());
        if(Session.get("number_of_subscriptions", subscriptions.count())){
            return Subscriptions.find({}, {sort: {status: 1, start: -1}, limit: 4, skip: subscription_page});
        } else {
            return;
        }
    },
    plan_name: function() {
        return this.plan.name;
    },
    lastFour: function () {
        var device = Devices.findOne({customer: this.customer});
        if(device){
            return " - " + device.last4;
        } else{
            return;
        }
    },
    type: function () {
        var device = Devices.findOne({customer: this.customer});
        if(device){
            if(device.brand){
                return ": " + device.brand;
            } else {
                return ": Bank Acct"
            }
        } else {
            return;
        }
    },
    frequency: function () {
        return this.plan.id;
    },
    number_of_subscriptions: function () {
        if(Session.get("number_of_subscriptions") > 4){
            return true;
        } else {
            return false;
        }
    },
    card_subscription: function () {
        // check to see if this subscription uses a bank account
        if(this.metadata && this.metadata.donateWith === 'Check'){
            return false;
        } else if(this.metadata && this.metadata.donateWith && this.metadata.donateWith.slice(0,2) == 'ba'){
            return false;
        } if(this.metadata && !this.metadata.donateWith){
            return false;
        } else {
            return true;
        }
    },
    show_donate_with: function () {
        if(this.metadata && this.metadata.donateWith === 'Check' || this.metadata && this.metadata.donateWith && this.metadata.donateWith.slice(0,2) === 'ba'){
            return 'Bank Account';
        } else if(this.metadata && this.metadata.donateWith === 'Card' || this.metadata && this.metadata.donateWith && this.metadata.donateWith.slice(0,2) === 'ca') {
            return 'Card';
        }
    },
    canceled_reason: function () {
        return this.metadata && this.metadata.canceled_reason;
    },
    bank: function () {
        var id = this._id;
        var subscription = Subscriptions.findOne({id: _id});
    }
});

Template.SubscriptionsOverview.events({
    'click .cancel_subscription': function (e) {
        e.preventDefault();
        var subscription_id = this.id;
        var customer_id = Subscriptions.findOne({_id: subscription_id}).customer;
        console.log("Got to cancel subscription call");
        console.log("subscription id: " + subscription_id);
        console.log("Customer id: " + customer_id);
        $(e.currentTarget).button('Working');


      swal({
            title: "Are you sure?",
            text: "Please let us know why you are stopping your gift. (optional)",
            type: "input",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, stop it!",
            cancelButtonText: "No",
            closeOnConfirm: false,
            closeOnCancel: false
        }, function(inputValue){

            if (inputValue === "") {
                inputValue = "Not specified";
            }

            if (inputValue === false){
                swal("Ok, we didn't do anything.", "Your recurring gift is still active :)",
                    "success");
              $(e.currentTarget).button('reset');
            } else if (inputValue) {
                console.log("Got to before method call with input of " + inputValue);
              var opts = {color: '#FFF', length: 60, width: 10, lines: 8};
                var target = document.getElementById('spinContainer');
                spinnerObject = new Spinner(opts).spin(target);
                $("#spinDiv").show();
                Meteor.call("stripeCancelSubscription", customer_id, subscription_id, inputValue, function(error, response){
                    if (error){
                        confirm.button("reset");
                        Bert.alert(error.message, "danger");
                        spinnerObject.stop();
                        $("#spinDiv").hide();
                      $(e.currentTarget).button('reset');
                    } else {
                        // If we're resubscribed, go ahead and confirm by returning to the
                        // subscriptions page and show the alert
                        console.log(response);
                        spinnerObject.stop();
                        $("#spinDiv").hide();
                        swal("Cancelled", "Your recurring gift has been stopped.", "error");
                    }
                });
            }
        });

    },
    'click .previous': function(evt, tmpl){
        evt.preventDefault();
        evt.stopPropagation();
        if(Number(Session.get('subscription_cursor')> 3)){
            Session.set('subscription_cursor', Number(Session.get('subscription_cursor')-4));
        }
    },
    'click .next': function(evt, tmpl){
        evt.preventDefault();
        evt.stopPropagation();
        Session.set('subscription_cursor', Number(Session.get('subscription_cursor')+4));
    },
  'click #btn_modal_for_add_new_bank_account': function () {
    $("#modal_for_add_new_bank_account").modal('show');
    Session.set('updateSubscription', this.id);
  }
});

Template.SubscriptionsOverview.onRendered(function() {
    Session.setDefault('paymentMethod', 'default');
    Session.setDefault('subscription_cursor', 0);
});
