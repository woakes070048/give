function removeParam(key, sourceURL) {
  // check that the query string contains a '?', if it doesn't then the router
  // will try to take the user to a different page.
  if (Session.get("params.donateTo"))
    if (sourceURL.split("?").length < 2) {
      sourceURL = sourceURL + '?placeholder=';
    }
  console.log(key, sourceURL);
  var rtn = sourceURL.split("?")[0],
    param,
    params_arr = [],
    queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
  if (queryString !== "") {
    params_arr = queryString.split("&");
    for (var i = params_arr.length - 1; i >= 0; i -= 1) {
      param = params_arr[i].split("=")[0];
      if (param === key) {
        params_arr.splice(i, 1);
      }
    }
    rtn = rtn + "?" + params_arr.join("&");
  }
  return rtn;
}

Template.Modals.onCreated(function () {
  this.autorun(()=> {
    this.subscribe("trips");
    this.subscribe("fundraisersPublic");
  });
});

Template.Modals.events({
  'click #write_in_save': function() {
    let config = ConfigDoc();
    let writeInDonationTypeId = config.Settings.DonorTools.writeInDonationTypeId.toString();
    
    $('#modal_for_write_in').modal('hide');

    removeParam('note', window.location.href);
    var goHere = removeParam('donateTo', window.location.href);
    console.log(goHere);
    Session.set('showWriteIn', 'no');
    goHere = goHere + '&note=' + Give.getCleanValue("#writeIn") + '&donateTo=' + writeInDonationTypeId;
    Router.go(goHere);
    $('#giftNoteText').show();
    
    $('[name="donateTo"]').val(writeInDonationTypeId);
  },
  'click #tripsSave'() {
    if ($('#tripSelect').val() === "" || $('#participantSelect').val() === "") {
      return;
    }
    $("#donateTo").val($("#tripSelect").val());

    let urlText = '?note=' + $('#participantSelect').val() +
    '&donateTo=' + $("#tripSelect").val();
    $('#modal_for_trips').modal('hide');
    Meteor.setTimeout(()=>{
      Router.go(Meteor.absoluteUrl() + urlText);
    },500);
  },
  'change #tripSelect'(){
    let trip = Trips.findOne({fundId: $("#tripSelect").val()});
    if (trip && trip._id) {
      Session.set("selectedTripId", trip._id);
      $('#participantSelect').chosen({width: "95%"});
      Meteor.setTimeout(function () {
        $("#participantSelect").trigger("chosen:updated");
      }, 1000);
    }
    return;
  }
});

Template.Modals.helpers({
  participants(){
    let trip_id = Session.get("selectedTripId");
    if (trip_id) {
      let fundraisers = Fundraisers.find({'trips.id': trip_id});
      if (fundraisers) {
        return fundraisers;
      }
    }
    return;
  },
  trips(){
    return Trips.find();
  },
  name(){
    let fundId = this.fundId;
    if (fundId) {
      return DT_funds.findOne( { _id: fundId } ) && DT_funds.findOne( { _id: fundId } ).name;
    }
    return;
  },
  churchSources: function() {
    return [
      {
        "name": "Fellowship Bible Church",
        "city": "Topeka, KS"
      },
      {
        "name": "Topeka Bible Church",
        "city": "Topeka, KS"
      },
      {
        "name": "Fountain Springs Church",
        "city": "Rapid City, SD"
      },
      {
        "name": "Gracepoint Church",
        "city": "Topeka, KS"
      },
      {
        "name": "Gracepoint Church North",
        "city": "Topeka, KS"
      },
      {
        "name": "Journey Church",
        "city": "Topeka, KS"
      },
      {
        "name": "Western Hills Church",
        "city": "Topeka, KS"
      },
      {
        "name": "Church On The Hill",
        "city": "Dundee, FL"
      },
      {
        "name": "Ridgepoint Church Winter",
        "city": "Haven, FL"
      },
      {
        "name": "A Mailer"
      },
      {
        "name": "Other"
      }
    ];
  }
});

Template.Modals.onRendered( function() {
  $('select').select2({dropdownCssClass: 'dropdown-inverse'});
  Meteor.setTimeout(function(){
    $('#tripSelect').select2('destroy');
    $('#participantSelect').select2('destroy');
    $('#options').select2('destroy');
    Meteor.setTimeout(function () {
      $('#tripSelect').chosen({width: "95%"});
      $("#participantSelect").hide();
      $('#options').chosen({width: "95%"});
    }, 250);
  }, 250);
});
