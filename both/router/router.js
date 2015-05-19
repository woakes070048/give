
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
        Router.go('subscriptions');
    }

    Session.set('params.donateTo', params.query.donateTo);
    Session.set('params.amount', params.query.amount);
    Session.set('params.donateWith', params.query.donateWith);
    Session.set('params.recurring', params.query.recurring);
    Session.set('params.exp_month', params.query.exp_month);
    Session.set('params.exp_year', params.query.exp_year);
    Session.set('params.writeIn', params.query.writeIn);
    Session.set('params.enteredWriteInValue', params.query.enteredWriteInValue);

    this.render('DonationForm');
}, {
    name: 'donation.form'
});

Router.route('/landing', function () {
    this.render('DonationLanding');
}, {
    name: 'donation.landing'
});

Router.route('/thanks', {
    name: 'donation.thanks',
    waitOn: function () {
        return  [
            //Meteor.subscribe('receipt_donations', this.params.query.don),
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

    this.subscribe('donate', params._id).wait();

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

    this.render('Dashboard');
}, {
    name: 'admin.dashboard'
});

Router.route('/transactions', {

    layoutTemplate: 'AdminLayout',

    subscriptions: function(){
        return Meteor.subscribe('donate_list')
    },
    action: function () {
        if (this.ready()) {
            this.render();
        } else {
            this.render('Loading');
        }
    },
    name: 'Transactions'
});

Router.route('/subscription/:_id', function () {
    this.layout('AdminLayout');


    this.subscribe('donate', this.params._id).wait();

    if (this.ready()) {
        this.render('Subscription', {
            data: function () {
                return Donate.findOne(this.params._id);
            }
        });
        this.next();
    }else {
        this.render('Loading');
        this.next();
    }
});

Router.route('/order/:_id', function () {
    this.layout('AdminLayout');


    this.subscribe('donate', this.params._id).wait();

    if (this.ready()) {
        this.render('Order', {
            data: function () {
                return Donate.findOne(this.params._id);
            }
        });
        this.next();
    }else {
        this.render('Loading');
        this.next();
    }
});

Router.route('/tables', {
    template: 'Tables',
    name: 'admin.tables',
    layoutTemplate: 'AdminLayout',
    action: function () {
        this.render('Tables')
    }
});

Router.route('/report', {
    name: 'admin.report',
    template: 'Report',
    layoutTemplate: 'AdminLayout',

    waitOn: function () {
        var query = this.params.query;
        Session.set('startDate', query.startDate);
        Session.set('endDate', query.endDate);
        return Meteor.subscribe('give_report', query.startDate, query.endDate);
    }
});

Router.route('/expiring', {
    name: 'admin.expiring',
    template: 'Expiring',
    layoutTemplate: 'AdminLayout',

    waitOn: function () {
        return Meteor.subscribe('card_expiring');
    }
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

Router.route('PaymentDevice', {
        layoutTemplate: 'UserLayout',
        path: '/user/paymentDevice',
        subscriptions: function() {
            return Meteor.subscribe('userStripeDataWithSubscriptions');
        },
        action: function () {
            if (this.ready()) {
                this.render();
            } else {
                this.render('Loading');
            }
        }
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

Router.route('FixSubscription', {
    layoutTemplate: 'UserLayout',
    path: '/user/subscriptions/resubscribe',
    template: 'FixSubscription',
    subscriptions: function(){
        return [
            Meteor.subscribe('subscription', this.params.query.sub),
            Meteor.subscribe('customer', this.params.query.sub)
        ]
    },
    action: function () {
        if (this.ready()) {
        var query = this.params.query;
        Session.set('sub', query.sub);
        this.render();
    } else {
            this.render('Loading');
        }
    }
});
