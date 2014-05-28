/*****************************************************************************/
/* CheckForm: Event Handlers and Helpers */
/*****************************************************************************/
Template.CheckForm.events({
  'submit form': function (e, tmpl) {
    e.preventDefault();
    var recurringStatus =     $(e.target).find('[name=is_recurring]').is(':checked');
    var coverTheFeesStatus =  $(e.target).find('[name=coverTheFees]').is(':checked');
    var checkForm =           {
                                amount:         $(e.target).find('[name=amount]').val(),
                                fname:          $(e.target).find('[name=fname]').val(),
                                lname:          $(e.target).find('[name=lname]').val(),
                                address_line1:  $(e.target).find('[name=address_line1]').val(),
                                address_line2:  $(e.target).find('[name=address_line2]').val(),
                                region:         $(e.target).find('[name=region]').val(),
                                state:          $(e.target).find('[name=state]').val(),
                                postal_code:    $(e.target).find('[name=postal_code]').val(),
                                country:        $(e.target).find('[name=country]').val(),
                                account_number: $(e.target).find('[name=account_number]').val(),
                                routing_number: $(e.target).find('[name=routing_number]').val(),
                                recurring:      { is_recurring: recurringStatus },
                                created_at:     new Date
    }
    
    checkForm._id = Donate.insert(checkForm);
    Donate.update(checkForm._id, {$set: {sessionId: Meteor.default_connection._lastSessionId}});
  
    checkForm.type = check;
    console.log(checkForm._id);
    console.log(Meteor.default_connection._lastSessionId);

     //checkForm._id = Donate.insert(checkForm);
    Meteor.call("createCustomer", checkForm, function(error, result) {
            
            console.log("Error: " + error + "  Result: " + result); 
            //console.log(result.customers[0].href);
            
            // Successful tokenization
        if(result.status_code === 201 && result.href) {
            // Send to your backend
            jQuery.post(responseTarget, {
                uri: result.href
            }, function(r) {
                // Check your backend result
                if(r.status === 201) {
                    // Your successful logic here from backend
                } else {
                    // Your failure logic here from backend
                }
            });
        } else {
            // Failed to tokenize, your error logic here
        }
        
        // Debuging, just displays the tokenization result in a pretty div
        $('#response1 .panel-body pre').html(JSON.stringify(result, false, 4));
        $('#response1').slideDown(300);
        });
          
    var form = tmpl.find('form');
    //form.reset();
    //Will need to add route to receipt page here.
    //Something like this maybe - Router.go('receiptPage', checkForm);

    //Router.go('receipt');
  },
  'click [name=is_recurring]': function (e, tmpl) {
      var id = this._id;
      console.log(id);
      var isRecuring = tmpl.find('input').checked;

      Donations.update({_id: id}, {
        $set: { 'recurring.is_recurring': true }
        });
    }
});

Template.CheckForm.helpers({
  isRecurringChecked: function () {
    return this.is_recurring ? 'checked' : '';
    },
    coverTheFeesChecked: function () {
        return this.coverTheFees ? 'checked' : '';
    },
    attributes_Input_Amount: function () {
        return {
            type: "number",
            name: "amount",
            class: "form-control"
        }
    },
    attributes_Input_AccountNumber: function () {
      return {
        type: "text",
        name: "account_number",
        id: "account_number",
        class: "form-control",
        value: "9900000000"
      }
    },
    attributes_Input_RoutingNumber: function () {
      return {
        type: "text",
        name: "routing_number",
        id: "routing_number",
        class: "form-control",
        value: "321174851"
      }
    },
    attributes_Label_Amount: function () {
        return {
            class: "col-sm-3 control-label",
            for: "amount"
        }
    },
    attributes_Label_FName: function () {
      return {
        class: "control-label",
        for: "fname"
      }
    },
    attributes_Label_LName: function () {
      return {
        class: "control-label",
        for: "lname"
      }
    },
    attributes_Label_AccountNumber: function () {
      return {
        class: "col-sm-3 control-label",
        for: "account_number"
      }
    },
    attributes_Label_RoutingNumber: function () {
      return {
        class: "col-sm-3 control-label",
        for: "routing_number"
      }
    }
});

/*****************************************************************************/
/* CheckForm: Lifecycle Hooks */
/*****************************************************************************/
Template.CheckForm.created = function () {
};

Template.CheckForm.rendered = function () {
};

Template.CheckForm.destroyed = function () {
};
