var secrets = require('../config/secrets');
var User = require('../models/User');
var querystring = require('querystring');
var async = require('async');
var request = require('request');
var _ = require('underscore');
var graph = require('fbgraph');
var paypal = require('paypal-rest-sdk');

/**
 * GET /api
 * List of API examples.
 */

exports.getApi = function(req, res) {
  res.render('api/index', {
    title: 'API Browser'
  });
};

/**
 * GET /api/foursquare
 * Foursquare API example.
 */

exports.getFoursquare = function(req, res, next) {
  var token = _.findWhere(req.user.tokens, { kind: 'foursquare' });
  async.parallel({
    trendingVenues: function(callback) {
      foursquare.Venues.getTrending('40.7222756', '-74.0022724', { limit: 50 }, token.accessToken, function(err, results) {
        callback(err, results);
      });
    },
    venueDetail: function(callback) {
      foursquare.Venues.getVenue('49da74aef964a5208b5e1fe3', token.accessToken, function(err, results) {
        callback(err, results);
      });
    },
    userCheckins: function(callback) {
      foursquare.Users.getCheckins('self', null, token.accessToken, function(err, results) {
        callback(err, results);
      });
    }
  },
  function(err, results) {
    if (err) return next(err);
    res.render('api/foursquare', {
      title: 'Foursquare API',
      trendingVenues: results.trendingVenues,
      venueDetail: results.venueDetail,
      userCheckins: results.userCheckins
    });
  });
};

/**
 * GET /api/tumblr
 * Tumblr API example.
 */

exports.getTumblr = function(req, res) {
  var token = _.findWhere(req.user.tokens, { kind: 'tumblr' });
  var client = tumblr.createClient({
    consumer_key: secrets.tumblr.consumerKey,
    consumer_secret: secrets.tumblr.consumerSecret,
    token: token.accessToken,
    token_secret: token.tokenSecret
  });
  client.posts('goddess-of-imaginary-light.tumblr.com', { type: 'photo' }, function(err, data) {
    res.render('api/tumblr', {
      title: 'Tumblr API',
      blog: data.blog,
      photoset: data.posts[0].photos
    });
  });
};

/**
 * GET /api/facebook
 * Facebook API example.
 */

exports.getFacebook = function(req, res, next) {
  var token = _.findWhere(req.user.tokens, { kind: 'facebook' });
  graph.setAccessToken(token.accessToken);
  async.parallel({
    getMe: function(done) {
      graph.get(req.user.facebook, function(err, me) {
        done(err, me);
      });
    },
    getMyFriends: function(done) {
      graph.get(req.user.facebook + '/friends', function(err, friends) {
        done(err, friends.data);
      });
    }
  },
  function(err, results) {
    if (err) return next(err);
    res.render('api/facebook', {
      title: 'Facebook API',
      me: results.getMe,
      friends: results.getMyFriends
    });
  });
};


/**
 * GET /api/paypal
 * PayPal SDK example
 */

exports.getPayPal = function(req, res, next) {
  paypal.configure(secrets.paypal);
  var payment_details = {
    'intent': 'sale',
    'payer': {
      'payment_method': 'paypal'
    },
    'redirect_urls': {
      'return_url': secrets.paypal.returnUrl,
      'cancel_url': secrets.paypal.cancelUrl
    },
    'transactions': [{
      'description': 'Node.js Boilerplate',
      'amount': {
        'currency': 'USD',
        'total': '2.99'
      }
    }]
  };
  paypal.payment.create(payment_details, function (error, payment) {
    if(error){
      console.log(error);
    } else {
      req.session.payment_id = payment.id;
      var links = payment.links;
      for (var i = 0; i < links.length; i++) {
        if (links[i].rel === 'approval_url') {
          res.render('api/paypal', {
            approval_url: links[i].href
          });
        }
      }
    }
  });
};

/**
 * GET /api/paypal/success
 * PayPal SDK example
 */

exports.getPayPalSuccess = function(req, res, next) {
  var payment_id = req.session.payment_id;
  var payment_details = { 'payer_id': req.query.PayerID };
  paypal.payment.execute(payment_id, payment_details, function(error, payment){
    if(error){
      res.render('api/paypal', {
        result: true,
        success: false
      });
    } else {
      res.render('api/paypal', {
        result: true,
        success: true
      });
    }
  });
};

/**
 * GET /api/paypal/cancel
 * PayPal SDK example
 */

exports.getPayPalCancel = function(req, res, next) {
  req.session.payment_id = null;
  res.render('api/paypal', {
    result: true,
    canceled: true
  });
};