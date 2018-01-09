'use strict';

var validator = require('validator'),
  path = require('path'),
  config = require(path.resolve('./config/config'));

/**
 * Render the main application page
 */
 // CC:USERFIELDS
exports.renderIndex = function (req, res) {
  var safeUserObject = null;
  if (req.user) {
    safeUserObject = {
      _id                     : req.user._id,
      orgsAdmin                     : req.user.orgsAdmin,
      orgsMember                     : req.user.orgsMember,
      orgsPending                     : req.user.orgsPending,
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
      isDeveloper             : req.user.isDeveloper,
      paymentMethod           : req.user.paymentMethod,
      phone                   : validator.escape(req.user.phone),
      address                 : validator.escape(req.user.address),
      businessContactName     : validator.escape(req.user.businessContactName),
      businessContactEmail    : validator.escape(req.user.businessContactEmail),
      businessContactPhone    : validator.escape(req.user.businessContactPhone),
      businessName            : validator.escape(req.user.businessName),
      businessAddress         : validator.escape(req.user.businessAddress),
      businessAddress2        : validator.escape(req.user.businessAddress2),
      businessCity            : validator.escape(req.user.businessCity),
      businessProvince        : req.user.businessProvince,
      businessCode            : validator.escape(req.user.businessCode),
      location                : req.user.location,
      description             : validator.escape(req.user.description),
      website                 : req.user.website,
      skills                  : req.user.skills,
      skillsData              : req.user.skillsData,
      badges                  : req.user.badges,
      capabilities            : req.user.capabilities,
      endorsements            : req.user.endorsements,
      github                  : req.user.github,
      stackOverflow           : req.user.stackOverflow,
      stackExchange           : req.user.stackExchange,
      linkedIn                : req.user.linkedIn,
      isPublicProfile         : req.user.isPublicProfile,
      isAutoAdd               : req.user.isAutoAdd,
      c01_flag : req.user.c01_flag,
      c02_flag : req.user.c02_flag,
      c03_flag : req.user.c03_flag,
      c04_flag : req.user.c04_flag,
      c05_flag : req.user.c05_flag,
      c06_flag : req.user.c06_flag,
      c07_flag : req.user.c07_flag,
      c08_flag : req.user.c08_flag,
      c09_flag : req.user.c09_flag,
      c10_flag : req.user.c10_flag,
      c11_flag : req.user.c11_flag,
      c12_flag : req.user.c12_flag,
      c13_flag : req.user.c13_flag,
      c01_tags : req.user.c01_tags,
      c02_tags : req.user.c02_tags,
      c03_tags : req.user.c03_tags,
      c04_tags : req.user.c04_tags,
      c05_tags : req.user.c05_tags,
      c06_tags : req.user.c06_tags,
      c07_tags : req.user.c07_tags,
      c08_tags : req.user.c08_tags,
      c09_tags : req.user.c09_tags,
      c10_tags : req.user.c10_tags,
      c11_tags : req.user.c11_tags,
      c12_tags : req.user.c12_tags,
      c13_tags : req.user.c13_tags,
      c01_experience : req.user.c01_experience,
      c02_experience : req.user.c02_experience,
      c03_experience : req.user.c03_experience,
      c04_experience : req.user.c04_experience,
      c05_experience : req.user.c05_experience,
      c06_experience : req.user.c06_experience,
      c07_experience : req.user.c07_experience,
      c08_experience : req.user.c08_experience,
      c09_experience : req.user.c09_experience,
      c10_experience : req.user.c10_experience,
      c11_experience : req.user.c11_experience,
      c12_experience : req.user.c12_experience,
      c13_experience : req.user.c13_experience,
      c01_years : req.user.c01_years,
      c02_years : req.user.c02_years,
      c03_years : req.user.c03_years,
      c04_years : req.user.c04_years,
      c05_years : req.user.c05_years,
      c06_years : req.user.c06_years,
      c07_years : req.user.c07_years,
      c08_years : req.user.c08_years,
      c09_years : req.user.c09_years,
      c10_years : req.user.c10_years,
      c11_years : req.user.c11_years,
      c12_years : req.user.c12_years,
      c13_years : req.user.c13_years
    };
  }
  var features = config.features.split ('-');
  var featureObject = {};
  features.forEach (function (el) {
    featureObject[el] = true;
  });

  res.render('modules/core/server/views/index', {
    user: JSON.stringify(safeUserObject),
    sharedConfig: JSON.stringify(config.shared),
    //
    // CC:FEATURES
    //
    // in prod, config.feature_hide will be true. in dev and test false
    // use this fact to hide and show features in the front end
    //
    // feature_hide: config.feature_hide
    features: JSON.stringify (featureObject)
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

exports.getFlags = function () {
  return {
    featureHide: config.feature_hide
  };
};
