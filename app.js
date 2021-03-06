/**
 * Module dependencies.
 */

var express = require('express');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var compress = require('compression');
var errorHandler = require('errorhandler');
var logger = require('morgan');
var favicon = require('serve-favicon');
var MongoStore = require('connect-mongo')(session);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var exphbs = require('express-handlebars');
var helpers = require('./lib/helpers');
var monitor = require('./lib/monitor');

/**
 * Load controllers.
 */

var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var apiController = require('./controllers/api');
var contactController = require('./controllers/contact');
var ebayController = require('./controllers/ebay');
var listerController = require('./controllers/lister');
var monitorController = require('./controllers/monitor');
var adminController = require('./controllers/admin');

/**
 * API keys + Passport configuration.
 */

var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

/**
 * Create Express server.
 */
var https = require('https');
var app = express();

/**
 * Mongoose configuration.
 */

mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.error('✗ MongoDB Connection Error. Please make sure MongoDB is running.');
});

/**
 * Handlebars configuration.
 */

var hbs = exphbs.create({
  defaultLayout: 'layout',
  helpers: helpers
});

/**
 * Express configuration.
 */

var hour = 3600000;
var day = (hour * 24);
var week = (day * 7);
var month = (day * 30);

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(require('connect-assets')({
  src: 'public',
  helperContext: app.locals
}));
app.use(compress());
app.use(favicon(path.join(__dirname, 'public/favicon.png')));
app.use(logger('common'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressValidator());
app.use(methodOverride());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.sessionSecret,
  cookie : { httpOnly: true, maxAge: 2147483647  },
  store: new MongoStore({ url: secrets.db, autoReconnect: true })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(flash());;
app.use(express.static(path.join(__dirname, 'public'), { maxAge: week }));
app.use(errorHandler());

/**
 * Application routes.
 */

app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/lister',passportConf.isAuthenticated, listerController.getLister);
app.post('/lister',passportConf.isAuthenticated, listerController.postLister);
app.get('/listings',passportConf.isAuthenticated, listerController.getListings);
app.post('/listings',passportConf.isAuthenticated, listerController.postRelist);
app.get('/listings/:listingId',passportConf.isAuthenticated, listerController.getListingSettings);
app.post('/listings/:listingId',passportConf.isAuthenticated, listerController.postListingSettings);
app.get('/settings',passportConf.isAuthenticated, listerController.getSettings);
app.post('/settings',passportConf.isAuthenticated, listerController.postSettings);
app.get('/monitor',passportConf.isAuthenticated, monitorController.getMonitor);
app.get('/revisions',passportConf.isAuthenticated, monitorController.getRevisions);
app.get('/revisions/:runId',passportConf.isAuthenticated, monitorController.getRevisions);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);
app.get('/api/listings', passportConf.isAuthenticated, apiController.getListings);
app.get('/api/runs', passportConf.isAuthenticated, apiController.getMonitorRuns);
app.get('/api/revisions', passportConf.isAuthenticated, apiController.getDefaultRevisions);
app.get('/api/revisions/:runId', passportConf.isAuthenticated, apiController.getRunRevisions);
app.get('/admin/login/:userId', passportConf.isAuthenticated, adminController.logInAs);

//app.get('/api/foursquare', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFoursquare);
//app.get('/api/tumblr', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTumblr);
//app.get('/api/facebook', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFacebook);
//app.get('/api/scraping', apiController.getScraping);
//app.get('/api/github', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getGithub);
//app.get('/api/lastfm', apiController.getLastfm);
//app.get('/api/nyt', apiController.getNewYorkTimes);
//app.get('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTwitter);
//app.get('/api/aviary', apiController.getAviary);
//app.get('/api/paypal', apiController.getPayPal);
//app.get('/api/paypal/success', apiController.getPayPalSuccess);
//app.get('/api/paypal/cancel', apiController.getPayPalCancel);

/**
 * OAuth routes for sign-in.
 */

app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/auth/ebay', ebayController.authenticate);
app.get('/auth/ebay/callback', ebayController.handleSuccess);

/**
 * OAuth routes for API examples that require authorization.
 */

app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/tumblr');
});

app.listen(app.get('port'), function() {
  console.log("✔ Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
});
