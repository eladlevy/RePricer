var secrets = require('../config/secrets');
var User = require('../models/User');
var ebayApi = require('../lib/ebayApiProvider');
var request = require('request');
var parseXML = require('xml2js').parseString;
var _ = require('underscore');


exports.authenticate = function(req, res, next) {
    ebayApi.getSessionId(function(err, data) {
        if (err) return next(err);
        var sessionId = data.SessionID;
        res.cookie('ebaySessionId', sessionId);
        var url = secrets.ebay.returnUrl + '?SignIn&RuName=' + secrets.ebay.ruName + '&SessID=' + sessionId;
        res.redirect(url)
    });
};

exports.handleSuccess = function(req, res, next) {
    ebayApi.getToken(req.cookies.ebaySessionId, function(err, data) {
        if (err) return next(err);
        var accessToken = data.eBayAuthToken;
        ebayApi.getUser(accessToken, function(err, data) {
            var userId = data.User.UserID;
            var ebayEmail = data.User.Email;
            if (req.user) {
                User.findOne({ebay: userId}, function(err, existingUser) {
                    if (existingUser) {
                        req.flash('errors', {msg: 'There is already a Ebay account that belongs to you. Sign in with that account or delete it, then link it with your current account.'});
                        req.logIn(existingUser, function(err) {
                            if (err) return next(err);
                            res.render('home', {});
                        });
                    }
                    else {
                        User.findById(req.user.id, function(err, user) {
                            user.ebay = userId;
                            user.tokens.push({ kind: 'ebay', accessToken: accessToken});
                            user.save(function(err) {
                                req.flash('info', { msg: 'Ebay account has been linked.' });
                                req.logIn(user, function(err) {
                                    if (err) return next(err);
                                    res.render('ebay_success', {});
                                });
                            });
                        });
                    }
                });
            } else {
                User.findOne({ ebay: userId }, function(err, existingUser) {
                    if (existingUser) {
                        req.logIn(existingUser, function(err) {
                            if (err) return next(err);
                            res.redirect('/');
                        });
                        return;
                    };
                    var user = new User();
                    user.email = ebayEmail;
                    user.ebay = userId;
                    user.tokens.push({ kind: 'ebay', accessToken: accessToken });
                    user.save(function(err) {
                        req.logIn(user, function(err) {
                            if (err) return next(err);
                            res.redirect('/');
                        });
                    });
                });
            }
        });
    });
};



