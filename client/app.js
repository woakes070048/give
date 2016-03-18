/* Client App Namespace  */

_.extend(App, {
  getCleanValue: function(id) {
    var jqueryObjectVal = $(id).val();
    return App.cleanupString(jqueryObjectVal);
  },
  cleanupString: function(string) {
    var cleanString = s(string).stripTags().trim().value();
    return cleanString;
  },
  get_fee: function(amount) {
    var r = (100 - 2.9) / 100;
    var i = (parseFloat(amount) + 0.3) / r;
    var s = i - amount;
    return {
      fee: i,
      total: s
    };
  },
  process_give_form: function(quickForm, customer) {
    var form = {};
    var userCursor;
    var customerCursor;
    var businessName;
    var addressLine2;

    if (quickForm) {
      if (customer) {
        customerCursor = Customers.findOne({_id: customer});
        if (!customerCursor.metadata) {
          throw new Meteor.Error("402", "Can't find the metadata inside this customer");
        }
        if (customerCursor.metadata.org) {
          businessName = customerCursor.metadata.org;
        } else {
          businessName = '';
        }
        if (customerCursor.metadata.address_line2) {
          addressLine2 = customerCursor.metadata.address_line2;
        } else {
          addressLine2 = '';
        }
        form = {
          "paymentInformation": {
            "amount": parseInt(((App.getCleanValue('#amount').replace(/[^\d\.\-\ ]/g, '')) * 100).toFixed(0), 10),
            "total_amount": parseInt((App.getCleanValue('#total_amount') * 100).toFixed(0), 10),
            "donateTo": App.getCleanValue("#donateTo"),
            "writeIn": App.getCleanValue("#enteredWriteInValue"),
            "donateWith": App.getCleanValue('#donateWith'),
            "is_recurring": App.getCleanValue('#is_recurring'),
            "coverTheFees": $('#coverTheFees').is(":checked"),
            "created_at": moment().format('MM/DD/YYYY, hh:mma'),
            "start_date": moment(new Date(App.getCleanValue('#start_date'))).format('X'),
            "saved": $('#save_payment').is(":checked"),
            "send_scheduled_email": "no"
          },
          "customer": {
            "fname": customerCursor.metadata.fname,
            "lname": customerCursor.metadata.lname,
            "org": businessName,
            "email_address": customerCursor.metadata.email,
            "phone_number": customerCursor.metadata.phone,
            "address_line1": customerCursor.metadata.address_line1,
            "address_line2": addressLine2,
            "region": customerCursor.metadata.state,
            "city": customerCursor.metadata.city,
            "postal_code": customerCursor.metadata.postal_code,
            "country": customerCursor.metadata.country
          },
          sessionId: Meteor.default_connection._lastSessionId
        };
      } else {
        userCursor = Meteor.user();
        if (userCursor.profile.business_name) {
          businessName = userCursor.profile.business_name;
        } else {
          businessName = '';
        }

        if (userCursor.profile.address.address_line2) {
          addressLine2 = userCursor.profile.address.address_line2;
        } else {
          addressLine2 = '';
        }

        form = {
          "paymentInformation": {
            "amount": parseInt(((App.getCleanValue('#amount').replace(/[^\d\.\-\ ]/g, '')) * 100).toFixed(0), 10),
            "total_amount": parseInt((App.getCleanValue('#total_amount') * 100).toFixed(0), 10),
            "donateTo": App.getCleanValue("#donateTo"),
            "writeIn": App.getCleanValue("#enteredWriteInValue"),
            "donateWith": App.getCleanValue('#donateWith'),
            "is_recurring": App.getCleanValue('#is_recurring'),
            "coverTheFees": $('#coverTheFees').is(":checked"),
            "created_at": moment().format('MM/DD/YYYY, hh:mma'),
            "dt_source": App.getCleanValue('#dt_source'),
            "note": App.getCleanValue('#donation_note'),
            "start_date": moment(new Date(App.getCleanValue('#start_date'))).format('X'),
            "saved": $('#save_payment').is(":checked")
          },
          "customer": {
            "fname": userCursor.profile.fname,
            "lname": userCursor.profile.lname,
            "org": businessName,
            "email_address": userCursor.emails[0].address,
            "phone_number": userCursor.profile.phone,
            "address_line1": userCursor.profile.address.address_line1,
            "address_line2": addressLine2,
            "region": userCursor.profile.address.state,
            "city": userCursor.profile.address.city,
            "postal_code": userCursor.profile.address.postal_code,
            "country": userCursor.profile.address.country
          },
          sessionId: Meteor.default_connection._lastSessionId
        };
      }
    } else {
      form = {
        "paymentInformation": {
          "amount": parseInt(((App.getCleanValue('#amount').replace(/[^\d\.\-\ ]/g, '')) * 100).toFixed(0), 10),
          "campaign": App.getCleanValue('#dt_source'),
          "coverTheFees": $('#coverTheFees').is(":checked"),
          "created_at": moment().format('MM/DD/YYYY, hh:mma'),
          "donateTo": App.getCleanValue("#donateTo"),
          "donateWith": App.getCleanValue("#donateWith"),
          "dt_source": App.getCleanValue('#dt_source'),
          "note": App.getCleanValue('#donation_note'),
          "is_recurring": App.getCleanValue('#is_recurring'),
          "saved": $('#save_payment').is(":checked"),
          "start_date": moment(new Date(App.getCleanValue('#start_date'))).format('X'),
          "total_amount": parseInt((App.getCleanValue('#total_amount') * 100).toFixed(0), 10),
          "writeIn": App.getCleanValue("#enteredWriteInValue")
        },
        "customer": {
          "fname": App.getCleanValue('#fname'),
          "lname": App.getCleanValue('#lname'),
          "org": App.getCleanValue('#org'),
          "email_address": App.getCleanValue('#email_address'),
          "phone_number": App.getCleanValue('#phone'),
          "address_line1": App.getCleanValue('#address_line1'),
          "address_line2": App.getCleanValue('#address_line2'),
          "region": App.getCleanValue('#region'),
          "city": App.getCleanValue('#city'),
          "postal_code": App.getCleanValue('#postal_code'),
          "country": App.getCleanValue('#country'),
          "created_at": moment().format('MM/DD/YYYY, hh:mma')
        },
        sessionId: Meteor.default_connection._lastSessionId
      };
    }


    form.paymentInformation.later = (!moment(new Date(App.getCleanValue('#start_date'))).isSame(Date.now(), 'day'));
    if (!form.paymentInformation.later) {
      form.paymentInformation.start_date = 'today';
    }

    if (form.paymentInformation.total_amount !== form.paymentInformation.amount) {
      form.paymentInformation.fees = (form.paymentInformation.total_amount - form.paymentInformation.amount);
    }

    if (form.paymentInformation.donateWith === "Card") {
      form.paymentInformation.type = "card";
      form.customer.created_at = moment().format('MM/DD/YYYY, hh:mma');
      var cardInfo = {};
      if (quickForm) {
        cardInfo = {
          name: userCursor.profile.fname + ' ' + userCursor.profile.lname,
          number: App.getCleanValue('#card_number'),
          cvc: App.getCleanValue('#cvv'),
          exp_month: App.getCleanValue('#expiry_month'),
          exp_year: App.getCleanValue('#expiry_year'),
          address_line1: userCursor.profile.address.address_line1,
          address_line2: userCursor.profile.address.address_line2,
          address_city: userCursor.profile.address.city,
          address_state: userCursor.profile.address.state,
          address_country: userCursor.profile.address.country,
          address_zip: userCursor.profile.address.postal_code
        };
      } else {
        cardInfo = {
          name: App.getCleanValue('#fname') + ' ' + App.getCleanValue('#lname'),
          number: App.getCleanValue('#card_number'),
          cvc: App.getCleanValue('#cvv'),
          exp_month: App.getCleanValue('#expiry_month'),
          exp_year: App.getCleanValue('#expiry_year'),
          address_line1: App.getCleanValue('#address_line1'),
          address_line2: App.getCleanValue('#address_line2'),
          address_city: App.getCleanValue('#city'),
          address_state: App.getCleanValue('#region'),
          address_zip: App.getCleanValue('#postal_code'),
          address_country: App.getCleanValue('#country')
        };
      }

      App.process_card(cardInfo, form);
    } else if (form.paymentInformation.donateWith === "Check") {
      form.paymentInformation.type = "check";
      form.customer.created_at = moment().format('MM/DD/YYYY, hh:mma');
      var bankInfo = {};
      if (quickForm) {
        bankInfo = {
          name: userCursor.profile.fname + ' ' + userCursor.profile.lname,
          account_number: App.getCleanValue('#account_number'),
          routing_number: App.getCleanValue('#routing_number'),
          address_line1: userCursor.profile.address.address_line1,
          address_line2: userCursor.profile.address.address_line2,
          address_city: userCursor.profile.address.city,
          address_state: userCursor.profile.address.state,
          address_zip: userCursor.profile.address.postal_code,
          country: userCursor.profile.address.country
        };
      } else{
        bankInfo = {
          name: App.getCleanValue('#fname') + ' ' + App.getCleanValue('#lname'),
          account_number: App.getCleanValue('#account_number'),
          routing_number: App.getCleanValue('#routing_number'),
          address_line1: App.getCleanValue('#address_line1'),
          address_line2: App.getCleanValue('#address_line2'),
          address_city: App.getCleanValue('#city'),
          address_state: App.getCleanValue('#region'),
          address_zip: App.getCleanValue('#postal_code'),
          country: App.getCleanValue('#country')
        };
      }
      App.process_bank(bankInfo, form);
    } else {
      // TODO: process the gift with a saved device
      form.paymentInformation.saved = true;
      var payment = {id: form.paymentInformation.donateWith};
      if (form.paymentInformation.donateWith.slice(0, 3) === 'car') {
        form.paymentInformation.type = 'card';
      } else if (form.paymentInformation.donateWith.slice(0, 2) === 'ba') {
        form.paymentInformation.type = 'check';
      }
      form.paymentInformation.source_id = form.paymentInformation.donateWith;
      form.customer.id = Devices.findOne({_id: form.paymentInformation.donateWith}).customer;
      var createdAt = Customers.findOne({_id: form.customer.id}).created;

      form.customer.created_at = moment(createdAt * 1000).format('MM/DD/YYYY, hh:mma');
      App.handleCalls(payment, form);
    }
  },
  // This is the callback for the client side tokenization of cards and bank_accounts.
  handleCalls: function(payment, form) {
    // payment is the token returned from Stripe
    form.paymentInformation.token_id = payment.id;
    Meteor.call('stripeDonation', form, function(error, result) {
      if (error) {
        // App.handleErrors is used to check the returned error and the display a user friendly message about what happened that caused
        // the error.
        App.handleErrors(error);
        // run App.updateTotal so that when the user resubmits the form the total_amount field won't be blank.
        App.updateTotal();
      } else {
        if ( result.error ) {
          var sendError = {code: result.error, message: result.message};
          App.handleErrors(sendError);
          // run App.updateTotal so that when the user resubmits the form the total_amount field won't be blank.
          App.updateTotal();
        } else if (result.charge === 'scheduled') {
          // Send the user to the scheduled page and include the frequency and the amount in the url for displaying to them
          Router.go('/scheduled/?frequency=' + form.paymentInformation.is_recurring + '&amount=' + form.paymentInformation.total_amount/100 + '&start_date=' + form.paymentInformation.start_date );
        } else {
          Router.go('/thanks?c=' + result.c + "&don=" + result.don + "&charge=" + result.charge);
        }
      }
    });
  },
  // this function is used to update the displayed total
  // since we can take payment with card fees added in this is needed to update the
  // amount that is shown to the user and passed as total_amount through the form
  // display error modal if there is an error while initially submitting data from the form.
  handleErrors: function(error) {
    if (typeof spinnerObject !== "undefined") {
      spinnerObject.stop();
    }
    $("#spinDiv").hide();
    $(':submit').button('reset');
    console.dir(error);

    var gatherInfo = {};
    Session.set("loaded", true);
    if (error.type === "invalid_request_error" || error.code === "invalid_expiry_month") {
      gatherInfo.browser = navigator.userAgent;

      $('#modal_for_initial_donation_error').modal({show: true});
      $(".modal-dialog").css("z-index", "1500");
      $('#errorCategory').html(error.type ? error.type : 'General');
      $('#errorDescription').html(error.message ? error.message : '' + " " +
      error.reason ? error.reason : '');
      return;
    }
    if (error.message === "Your card's security code is invalid.") {

      gatherInfo.browser = navigator.userAgent;

      $('#modal_for_initial_donation_error').modal({show: true});
      $(".modal-dialog").css("z-index", "1500");
      $('#errorCategory').html(error.code ? error.code : error.error ? error.error : 'General');
      $('#errorDescription').html(error.message ? error.message : '' + " " +
      error.reason ? error.reason : '');
      return;
    } else {
      $('#modal_for_initial_donation_error').modal({show: true});
      $(".modal-dialog").css("z-index", "1500");
      $('#errorCategory').html(error.code ? error.code : error.error ? error.error : 'General');
      $('#errorDescription').html(error.message ? error.message : '' + " " +
      error.reason ? error.reason : '');
      return;
    }
  },
  process_card: function(cardInfo, form) {
    Stripe.card.createToken(cardInfo, function(status, response) {
      if (response.error) {
        App.handleErrors(response.error);
      } else {
        // Call your backend
        if (form) {
          form.paymentInformation.source_id = response.card.id;
          App.handleCalls(response, form);
        } else {
          return response;
        }
      }
    });
  },
  process_bank: function(bankInfo, form) {
    Stripe.bankAccount.createToken(bankInfo, function(status, response) {
      if (response.error) {
        App.handleErrors(response.error);
      } else {
        // Call your backend
        if (form) {
          form.paymentInformation.source_id = response.bank_account.id;
          App.handleCalls(response, form);
        } else {
          return response;
        }
      }
    });
  },
  updateTotal: function() {
    var data = Session.get('paymentMethod');
    var donationAmount = $('#amount').val();
    donationAmount = donationAmount.replace(/[^\d\.\-\ ]/g, '');
    donationAmount = donationAmount.replace(/^0+/, '');
    if (data === 'Check') {
      if ($.isNumeric(donationAmount)) {
        $("#total_amount").val(donationAmount);
        $("#show_total").hide();
        $("#total_amount_display").text("$" + donationAmount).css({
          'color': '#34495e'
        });
        return Session.set("total_amount", $("#total_amount").val());
      }
      return $("#total_amount_display").text("Please enter a number in the amount field.").css({
        'color': 'red'
      });
    } else {
      if (donationAmount < 1 && $.isNumeric(donationAmount)) {
        return $("#total_amount_display").text("Amount cannot be lower than $1.").css({
          'color': 'red'
        });
      } else {
        if ($.isNumeric(donationAmount)) {
          if ($('#coverTheFees').prop('checked')) {
            $("#show_total").show();
            Session.set("coverTheFees", true);
            var feeAndTotal = App.get_fee(donationAmount);
            var fee = feeAndTotal.fee - donationAmount;
            var roundedAmount = (+donationAmount + (+fee)).toFixed(2);
            $("#total_amount_display").text(" + $" + fee.toFixed(2) + " = $" + roundedAmount).css({
              'color': '#34495e'
            });
            $("#total_amount").val(roundedAmount);
            return Session.set("amount", roundedAmount);
          } else {
            Session.set("coverTheFees", false);
            $("#total_amount").val(donationAmount);
            $("#show_total").hide();
            return $("#total_amount_display").text("").css({
              'color': '#34495e'
            });
          }
        } else {
          return $("#total_amount_display").text("Please enter a number in the amount field").css({
            'color': 'red'
          });
        }
      }
    }
  },
  fillForm: function(form) {
    if (form === 'main') {
      if (Session.get("paymentMethod") === "Check") {
        $('#routing_number').val("111000025"); // Invalid test =  fail after initial screen =  valid test = 111000025
        $('#account_number').val("000123456789"); // Invalid test =  fail after initial screen =  valid test = 000123456789
      } else {
        $('#card_number').val("4242424242424242");
        // Succeeded = 4242424242424242 Failed = 4242111111111111 AMEX = 378282246310005
        // Fail after connection to customer succeeds = 4000000000000341
        $('#expiry_month option').prop('selected', false).filter('[value=12]').prop('selected', true);
        $('select#expiry_month').change();
        $('#expiry_year option').prop('selected', false).filter('[value=2017]').prop('selected', true);
        $('select#expiry_year').change();
        $('#cvv').val("123"); // CVV mismatch = 200
      }
      $('#fname').val("Test");
      $('#lname').val("Bechard");
      $('#org').val("");
      $('#email_address').val("josh.bechard@gmail.com");
      $('#email_address_verify').val('josh.bechard@gmail.com');
      $('#phone').val("(785) 246-6845");
      $('#address_line1').val("Address Line 1");
      $('#address_line2').val("Address Line 2");
      $('#city').val("Topeka");
      $('#region').val("KS");
      $('#postal_code').val("66618");
      $('#amount').val("1.03");
    } else {
      if (Session.get("paymentMethod") === "Check") {
        $('#routing_number').val("111000025"); // Invalid test =  fail after initial screen =  valid test = 111000025
        $('#account_number').val("000123456789"); // Invalid test =  fail after initial screen =  valid test = 000123456789
      } else {
        $('#card_number').val("4242424242424242"); // Succeeded = 4242424242424242 Failed = 4242111111111111 AMEX = 378282246310005
        $('#expiry_month option').prop('selected', false).filter('[value=12]').prop('selected', true);
        $('select#expiry_month').change();
        $('#expiry_year option').prop('selected', false).filter('[value=2017]').prop('selected', true);
        $('select#expiry_year').change();
        $('#cvv').val("123"); // CVV mismatch = 200
      }
      $('#amount').val("1.03");
    }
  }
});
