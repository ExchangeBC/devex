'use strict';

var validator = require('validator'),
  path = require('path'),
  config = require(path.resolve('./config/config'));

/**
 * Render the main application page
 */
 // CC:  USERFIELDS
exports.renderIndex = function (req, res) {
  var safeUserObject = null;
  if (req.user) {
    safeUserObject = {
      displayName             : validator.escape(req.user.displayName),
      provider                : validator.escape(req.user.provider),
      username                : validator.escape(req.user.username),
      created                 : req.user.created.toString(),
      roles                   : req.user.roles,
      profileImageURL         : req.user.profileImageURL,
      email                   : validator.escape(req.user.email),
      lastName                : validator.escape(req.user.lastName),
      firstName               : validator.escape(req.user.firstName),
      additionalProvidersData : req.user.additionalProvidersData,
      government              : req.user.government,
      notifyOpportunities     : req.user.notifyOpportunities,
      notifyEvents            : req.user.notifyEvents,
      notifyBlogs             : req.user.notifyBlogs,
      userTitle               : req.user.userTitle,
      isDisplayEmail          : req.user.isDisplayEmail,
      isDeveloper      : req.user.isDeveloper, 
      paymentMethod    : req.user.paymentMethod, 
      businessName     : req.user.businessName, 
      businessAddress  : req.user.businessAddress, 
      businessAddress2 : req.user.businessAddress2, 
      businessCity     : req.user.businessCity, 
      businessProvince : req.user.businessProvince, 
      businessCode     : req.user.businessCode
    };
  }

  res.render('modules/core/server/views/index', {
    user: JSON.stringify(safeUserObject),
    sharedConfig: JSON.stringify(config.shared)
  });
};

/**
 * Render the server error page
 */
exports.renderServerError = function (req, res) {
  res.status(500).render('modules/core/server/views/500', {
    error: 'Oops! Something went wrong...'
  });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function (req, res) {

  res.status(404).format({
    'text/html': function () {
      res.render('modules/core/server/views/404', {
        url: req.originalUrl
      });
    },
    'application/json': function () {
      res.json({
        error: 'Path not found'
      });
    },
    'default': function () {
      res.send('Path not found');
    }
  });
};
