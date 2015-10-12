var configurations = {
    dev:{
        db: 'mongodb://localhost:27017/test',

        sessionSecret: "Your Session Secret goes here",

        sendgrid: {
            user: 'Your SendGrid Username',
            password: 'Your SendGrid Password'
        },

        nyt: {
            key: 'Your New York Times API Key'
        },

        lastfm: {
            api_key: 'Your API Key',
            secret: 'Your API Secret'
        },

        facebook: {
            clientID: 'Your App ID',
            clientSecret: 'Your App Secret',
            callbackURL: '/auth/facebook/callback',
            passReqToCallback: true
        },

        github: {
            clientID: 'Your Client ID',
            clientSecret: 'Your Client Secret',
            callbackURL: '/auth/github/callback',
            passReqToCallback: true
        },

        twitter: {
            consumerKey: 'Your Consumer Key',
            consumerSecret: 'Your Consumer Secret',
            callbackURL: '/auth/twitter/callback',
            passReqToCallback: true
        },

        google: {
            clientID: 'Your Client ID',
            clientSecret: 'Your Client Secret',
            callbackURL: '/auth/google/callback',
            passReqToCallback: true
        },

        tumblr: {
            consumerKey: 'Your Consumer Key',
            consumerSecret: 'Your Consumer Secret',
            callbackURL: '/auth/tumblr/callback'
        },

        foursquare: {
            clientId: 'Your Client ID',
            clientSecret: 'Your Client Secret',
            redirectUrl: 'http://localhost:3000/auth/foursquare/callback'
        },

        paypal: {
            host: 'api.sandbox.paypal.com', // or api.paypal.com
            client_id: 'Your Client ID',
            client_secret: 'Your Client Secret',
            returnUrl: 'http://localhost:3000/api/paypal/success',
            cancelUrl: 'http://localhost:3000/api/paypal/cancel'
        },

        amazon: {
            awsId: 'AKIAJR3AXFFXUUMU2LZQ',
            awsSecret: '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'
        },

        ebay: {
            host: 'https://api.sandbox.ebay.com', // or api.paypal.com
            devId: '9eb4a6f9-97ef-4156-8284-ed5463e597ea',
            appId: 'EladLevy-67f2-47c8-b163-340d3e3a3f03',
            certId: '7e93c421-6599-41fe-93d1-7163cf3b29aa',
            ruName: 'Elad_Levy-EladLevy-67f2-4-ybevyf',
            returnUrl: 'https://signin.sandbox.ebay.com/ws/eBayISAPI.dll'
            //cancelUrl: 'http://localhost:3000/api/paypal/cancel'
        }
    },

    prod: {
        db: 'mongodb://localhost:27017/prod',
        shalom: 'Yo yo',
        sessionSecret: "Your Session Secret goes here",

        sendgrid: {
            user: 'Your SendGrid Username',
            password: 'Your SendGrid Password'
        },

        nyt: {
            key: 'Your New York Times API Key'
        },

        lastfm: {
            api_key: 'Your API Key',
            secret: 'Your API Secret'
        },

        facebook: {
            clientID: 'Your App ID',
            clientSecret: 'Your App Secret',
            callbackURL: '/auth/facebook/callback',
            passReqToCallback: true
        },

        github: {
            clientID: 'Your Client ID',
            clientSecret: 'Your Client Secret',
            callbackURL: '/auth/github/callback',
            passReqToCallback: true
        },

        twitter: {
            consumerKey: 'Your Consumer Key',
            consumerSecret: 'Your Consumer Secret',
            callbackURL: '/auth/twitter/callback',
            passReqToCallback: true
        },

        google: {
            clientID: 'Your Client ID',
            clientSecret: 'Your Client Secret',
            callbackURL: '/auth/google/callback',
            passReqToCallback: true
        },

        tumblr: {
            consumerKey: 'Your Consumer Key',
            consumerSecret: 'Your Consumer Secret',
            callbackURL: '/auth/tumblr/callback'
        },

        foursquare: {
            clientId: 'Your Client ID',
            clientSecret: 'Your Client Secret',
            redirectUrl: 'http://localhost:3000/auth/foursquare/callback'
        },

        paypal: {
            host: 'api.sandbox.paypal.com', // or api.paypal.com
            client_id: 'Your Client ID',
            client_secret: 'Your Client Secret',
            returnUrl: 'http://localhost:3000/api/paypal/success',
            cancelUrl: 'http://localhost:3000/api/paypal/cancel'
        },

        amazon: {
            awsId: 'AKIAJR3AXFFXUUMU2LZQ',
            awsSecret: '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'
        },

        ebay: {
            host: 'https://api.ebay.com',
            devId: '9eb4a6f9-97ef-4156-8284-ed5463e597ea',
            appId: 'EladLevy-eecf-4f7f-bf74-70c8ea5c035d',
            certId: 'd00a8a33-c0e4-417d-b123-0de2ddddf40d',
            ruName: 'Elad_Levy-EladLevy-eecf-4-nebemuuj',
            returnUrl: 'https://signin.ebay.com/ws/eBayISAPI.dll'
            //cancelUrl: 'http://localhost:3000/api/paypal/cancel'
        }
    }
};

module.exports = configurations[process.env.NODE_ENV] || configurations['dev'];
