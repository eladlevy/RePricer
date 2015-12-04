var secrets = require('../config/secrets');
var User = require('../models/User');

exports.logInAs = function(req, res, next) {
  if (!req.user.admin) return next();
  var userId = req.params.userId;
  if (userId) {
    User.findById(userId, function (err, user) {
      if(err) return next(err);
      req.logIn(user, function(err) {
        if (err) return next(err);
        res.redirect('/');
      });
    });
  } else {
    res.redirect('/');
  }
};
