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
       },

        ebay: {
            host: 'https://api.ebay.com',
            returnUrl: 'https://signin.ebay.com/ws/eBayISAPI.dll'
            //cancelUrl: 'http://localhost:3000/api/paypal/cancel'
        } 
    }
};

module.exports = configurations[process.env.NODE_ENV] || configurations['dev'];
