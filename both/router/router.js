
Router.configure({
    layoutTemplate: 'MasterLayout',
    loadingTemplate: 'Loading',
    notFoundTemplate: 'NotFound',
    templateNameConverter: 'upperCamelCase',
    routeControllerNameConverter: 'upperCamelCase'
});

Router.plugin('ensureSignedIn', {
    except: ['donation.form', 'donation.landing', 'donation.thanks', 'donation.gift', 'donation.scheduled', 'enrollAccount', 'forgotPwd', 'resetPwd', 'stripe_webhooks', 'signIn']
});

Router.route('', function () {

    var params = this.params;
    if(Meteor.user()){
        Session.set('params.give', "Yes");
        Router.go('user.give');
    }

    Session.set('params.donateTo', params.query.donateTo);
    Session.set('params.amount', params.query.amount);
    Session.set('params.donateWith', params.query.donateWith);
    Session.set('params.recurring', params.query.recurring);
    Session.set('params.exp_month', params.query.exp_month);
    Session.set('params.exp_year', params.query.exp_year);
    Session.set('params.writeIn', params.query.writeIn);
    Session.set('params.enteredWriteInValue', params.query.enteredWriteInValue);
    if(params.query.donateTo === 'Aquaponics Marketplace - Rhiza' || params.query.donateTo === 'Aquaponics Marketplace - Karpos'){
        Session.set('params.marketplace', params.query.donateTo);
    } else {
        Session.set('params.marketplace', '');
    }

    this.render('DonationForm');
}, {
    name: 'donation.form'
});

Router.route('/landing', function () {
    var params = this.params;
    if(Meteor.user()){
        Session.set('params.give', "Yes");
        Router.go('subscriptions');
    }

    this.render('DonationLanding');
}, {
    name: 'donation.landing'
});

Router.route('/thanks', {
    name: 'donation.thanks',
    waitOn: function () {
        return  [
            Meteor.subscribe('receipt_customers', this.params.query.c),
            Meteor.subscribe('receipt_charges', this.params.query.charge)
        ];
    },
    data: function () {

    },
    action: function () {
        this.render('Thanks', {
            data: function () {
                Session.set('print', this.params.query.print);
            }
        });
    }
});

Router.route('/gift/:_id', function () {

    var params = this.params;

    this.subscribe('donate', params._id);

    if (this.ready()) {
        this.render('Gift', {
            data: function () {
                Session.set('print', params.query.print);
                Session.set('transaction_guid', params.query.transaction_guid);
                return Donate.findOne(params._id);
            }
        });
        this.next();
    }else {
        this.render('Loading');
        this.next();
    }
}, {
    name: 'donation.gift'
});

Router.route('/dashboard', function () {
    this.layout('AdminLayout');

    this.wait(Meteor.subscribe('publish_for_admin_give_form'));
    this.render('Dashboard');
}, {
    name: 'admin.dashboard'
});


Router.route('/user',{
    layoutTemplate: 'UserLayout',

    subscriptions: function(){
        return [
            Meteor.subscribe('userStripeData'),
            Meteor.subscribe('userDT'),
            Meteor.subscribe('userDTFunds')
        ]
    },
    action: function () {
        if (this.ready()) {
            this.render();
        } else {
            this.render('Loading');
        }
    },
    name: 'user.profile'
});


Router.route('/user/give',{
    layoutTemplate: 'UserLayout',

    subscriptions: function(){
        return [
            Meteor.subscribe('userStripeData'),
            Meteor.subscribe('userDT'),
            Meteor.subscribe('userDTFunds'),
            Meteor.subscribe('devices')
        ]
    },
    action: function () {
        if (this.ready()) {
            this.render();
        } else {
            this.render('Loading');
        }
    },
    name: 'user.give'
});

Router.route('Subscriptions', function() {
        var params = this.params;
        var fix_it = this.params.fix_it;
        Session.set('fix_it', params.query.fix_it);

        this.wait(Meteor.subscribe('user_date_and_subscriptions_with_only_4'));
        if (this.ready()) {
            this.render();
        } else {
            this.render('Loading');
        }
    }, {
        name: 'subscriptions',
        layoutTemplate: 'UserLayout',
        path: '/user/subscriptions'
    }
);

Router.route('/scheduled', {
    name: 'donation.scheduled',

    data: function () {
        Session.set('params.frequency', this.params.query.frequency);
        Session.set('params.amount', this.params.query.amount);
        Session.set('params.start_date', moment(this.params.query.start_date * 1000).format('DD MMM, YYYY'));
    }
});

Router.route('/webhooks/stripe', function () {

    // Receive an event, check that it contains a data.object object and send along to appropriate function
    var request = this.request.body;
    if(request.data && request.data.object){
        console.dir(request.data.object);
        var event = Stripe_Events[request.type](request);
        this.response.statusCode = 200;
        this.response.end('Oh hai Stripe!\n');
    } else {
        this.response.statusCode = 400;
        this.response.end('Oh hai Stripe!\n\n');
    }
}, {where: 'server',
    name: 'stripe_webhooks'
});

Router.route('FixCardSubscription', {
    layoutTemplate: 'UserLayout',
    path: '/user/subscriptions/card/resubscribe',
    template: 'FixCardSubscription',
    subscriptions: function(){
        return [
            Meteor.subscribe('subscription', this.params.query.s),
            Meteor.subscribe('customer', this.params.query.c)
        ]
    },
    action: function () {
        if (this.ready()) {
        var query = this.params.query;
        Session.set('sub', query.s);
        this.render();
    } else {
            this.render('Loading');
        }
    }
});

Router.route('FixBankSubscription', {
    layoutTemplate: 'UserLayout',
    path: '/user/subscriptions/bank/resubscribe',
    template: 'FixBankSubscription',
    subscriptions: function(){
        return [
            Meteor.subscribe('subscription', this.params.query.s),
            Meteor.subscribe('customer', this.params.query.c)
        ]
    },
    action: function () {
        if (this.ready()) {
        var query = this.params.query;
        Session.set('sub', query.s);
        this.render();
    } else {
            this.render('Loading');
        }
    }
});
