function updateSearchVal(){
  let searchValue = $( ".search" ).val();

  if (searchValue) {
    // Remove punctuation and make it into an array of words
    searchValue = searchValue
      .replace( /[^\w\s]|_/g, "" )
      .replace( /\s+/g, " " );
    Session.set( "searchValue", searchValue );
    Session.delete("documentLimit");
  } else {
    Session.set("documentLimit", 100);
    Session.set( "searchValue", searchValue );
  }
};

function getDocHeight() {
  var D = document;
  return Math.max(
    D.body.scrollHeight, D.documentElement.scrollHeight,
    D.body.offsetHeight, D.documentElement.offsetHeight,
    D.body.clientHeight, D.documentElement.clientHeight
  );
};

AutoForm.hooks({
  'edit-user-form': {
    onSuccess: function (operation, result) {
      Session.set("addingNew", false);
      Bert.alert( result, 'success', 'growl-bottom-right' );
      Router.go("/dashboard/users");
    },

    onError: function(operation, error) {
      console.log(error);
      console.log(operation);

      Bert.alert( error.message, 'danger', 'growl-bottom-right' );
    },
    onSubmit: function () {
      return this.event.preventDefault();
    }
  }
});

Template.ManageUsers.helpers({
  users: function () {
    let searchValue = Session.get("searchValue");
    let matchingUsers;
    if(!searchValue){
      return Meteor.users.findFromPublication('all_users', {}, { sort: { createdAt: -1} });
    } else {
      matchingUsers = Meteor.users.findFromPublication('all_users', {}, { sort: { createdAt: -1} });
      if (matchingUsers.count()) {
        return matchingUsers;
      } else {
        return false;
      }
    }
  },
  schema: function () {
    return Schema.UpdateUserFormSchema;
  },
  roles: function () {
    return Meteor.roles.find();
  },
  user_roles: function () {
    return this.roles;
  },
  selected: function () {
    let editUserID = Session.get("params.userID");
    if(editUserID) {
      let thisUser = Meteor.users.findOne({_id: editUserID});
      if ( thisUser && thisUser.roles && thisUser.roles.indexOf( this.name ) > -1 ){
        return 'selected';
      }
    } else {
      return;
    }
  },
  disabledUserFA: function () {
    if(!this.state){
      return '<i class="fa fa-lock"></i>';
    }
    if(this.state && this.state.status && this.state.status === 'disabled'){
      return '<i class="fa fa-unlock"></i>';
    } else {
      return '<i class="fa fa-lock"></i>';
    }
  },
  toggleUserText: function () {
    if(this.state && this.state.status && this.state.status === 'disabled'){
      return "Enable User";
    } else {
      return "Disable User";
    }
  },
  disabledIfDisabled: function () {
    if(this.state && this.state.status && this.state.status === 'disabled'){
      return "disabled"
    } else {
      return "";
    }
  },
  showSingleUser: function () {
    return Session.equals("showSingleUserDashboard", true);
  },
  persona_info: function () {
    return Session.equals("persona_info_exists", true);
  },
  searchUsers: function() {
    if (Session.equals("searchValue", "")) {
      return false;
    } else if (!Session.get("searchValue")) {
      return false;
    } else if (Meteor.users.findFromPublication('all_users').count()) {
      return Meteor.users.findFromPublication('all_users');
    }
    return false;
  },
  showAdminModal(){
    return Session.get("gift_user_id");
  }
});

Template.ManageUsers.events({
  'click .disable-enable-user': function () {
    console.log("got remove");

    let self = this;

    let toggleState;

    if (self.state && self.state.status && self.state.status === 'disabled') {
      toggleState = 'enabled';
    } else {
      toggleState = 'disabled';
    }

    swal({
      title: "Are you sure?",
      text: "Are you sure you want to " +  toggleState.slice(0, -1) + " this user?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes",
      cancelButtonText: "Nevermind",
      closeOnConfirm: false,
      closeOnCancel: true,
      showLoaderOnConfirm: true
    }, function(isConfirm) {
      if (isConfirm) {

        Meteor.call( 'set_user_state', self._id, toggleState, function( error, response ) {
          if ( error ) {
            console.log(error);
            swal("Error", "Something went wrong", "error");
          } else {
            console.log(response);
            swal({title: "Done", text: "The user was " + toggleState + ".", type: 'success'}, function(){
              // self.state.status === 'enabled' because self is a copy of the
              // data that was set when we started this call
              if(self.state.status === 'enabled' &&
                Session.equals("showSingleUserDashboard", true)){
                $(".cancel-button").click();
              }
            });
          }
        });
      }
    });
  },
  'click .addingNewUser': function ( e ){
    e.preventDefault();
    let addingNew = $(".addingNewUser").data("add");
    Session.set("addingNew", addingNew);
  },
  'click .addingNewRole': function ( e ){
    e.preventDefault();
    let addingNew = $(".addingNewRole").data("add");
    Session.set("addingNew", addingNew);
  },
  'click .edit-user': function () {
    //setup modal for entering give toward information
    Session.set('params.userID', this._id);
  },
  'click .forgot-password': function (e) {
    let resetButton = $(e.currentTarget).button('loading');
    let self = this;

    swal({
        title: "Are you sure?",
        text: "Are you sure you want to send a password reset to this user?",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, send it!",
        cancelButtonText: "Nevermind",
        closeOnConfirm: false,
        closeOnCancel: true,
        showLoaderOnConfirm: true
      }, function(isConfirm) {
      if (isConfirm) {
        Accounts.forgotPassword(
          {
            email: self.emails[0].address
          }, function ( err, res ) {
            swal("Sent", "The user was sent a password reset email.", 'success');
            resetButton.button( 'reset' );
          } );
      } else {
        resetButton.button( 'reset' );
      }
    });
  },
  'click .cancel-button': function () {
    console.log("Clicked cancel");
    Session.delete("activeTab");

    if(Router.current().params.query && Router.current().params.query.userID){
      Router.go('ManageUsers');
    }
    Session.set("addingNew", false);
    Session.delete("params.userID");
    Session.delete("showSingleUserDashboard");
    Session.delete("got_all_donations");
    Session.delete("NotDTUser");
    Session.delete("persona_info_exists");
  },
  'click .clear-button': function () {
    $(".search").val("").change();
  },
  'keyup, change .search': _.debounce(function () {
    updateSearchVal();
  }, 300),
  'click .new-gift'(e){
    e.preventDefault();
    Session.set("gift_user_id", this._id);
    Meteor.setTimeout(function(){
      $('#modal_for_admin_give_form').modal({
        show: true,
        backdrop: 'static'
      });
    }, 0);
  }
});

Template.ManageUsers.onCreated(function () {
  Session.set("documentLimit", 10);

  this.autorun(()=> {

    if(Session.get("params.userID")) {
      if( Meteor.users.findOne( { _id: Session.get( "params.userID" ) } ) &&
        Meteor.users.findOne( { _id: Session.get( "params.userID" ) } ).persona_info ) {
        Session.set( "persona_info_exists", true );
      } else {
        Session.set( "persona_info_exists", false );
      }
      Session.set("showSingleUserDashboard", true);
      return [Meteor.subscribe( 'all_users', Session.get('params.userID') ),
              Meteor.subscribe('roles'),
              Meteor.subscribe('userStripeData', Session.get('params.userID')),
              Meteor.subscribe('userDT', Session.get('params.userID')),
              Meteor.subscribe('userDTFunds')];
    } else {
      Session.set('params.userID', '');
      Session.set("showSingleUserDashboard", false);

      return [
        Meteor.subscribe( 'all_users', null, Session.get("searchValue"), Session.get("documentLimit") ),
        Meteor.subscribe('roles')
      ];
    }
  });

});

Template.ManageUsers.onRendered(function () {
  $(window).scroll(function() {
    if(($(window).scrollTop() + $(window).height() == getDocHeight()) ||
      ($(window).scrollTop() + window.innerHeight == getDocHeight())) {
      console.log("bottom!");
      let documentLimit = Session.get("documentLimit");
      Session.set("documentLimit", documentLimit += 10);
    }
  });
});

Template.ManageUsers.onDestroyed(function() {
  Session.delete("gift_user_id");
  Session.delete("searchValue");
  $(window).unbind('scroll');
});
