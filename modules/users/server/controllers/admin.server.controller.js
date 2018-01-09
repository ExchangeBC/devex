'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  userController = require(path.resolve('./modules/users/server/controllers/users.server.controller.js')),
  Notifications = require(path.resolve('./modules/notifications/server/controllers/notifications.server.controller'));


/**
 * Show the current user
 */
exports.read = function (req, res) {
  res.json(req.model);
};

/**
 * Update a User
 */
exports.update = function (req, res) {
  var user = req.model;
  var prevState = _.cloneDeep(req.model);
  // CC:USERFIELDS
  // For security purposes only merge these parameters
  user.orgsAdmin                = req.user.orgsAdmin;
  user.orgsMember                = req.user.orgsMember;
  user.orgsPending                = req.user.orgsPending;
  user.phone                = req.user.phone;
  user.address              = req.user.address;
  user.businessContactName  = req.user.businessContactName;
  user.businessContactEmail = req.user.businessContactEmail;
  user.businessContactPhone = req.user.businessContactPhone;
  user.firstName            = req.body.firstName;
  user.lastName             = req.body.lastName;
  user.displayName          = user.firstName + ' ' + user.lastName;
  user.roles                = req.body.roles;
  user.government           = req.body.government;
  user.userTitle            = req.body.userTitle;
  user.notifyOpportunities  = req.body.notifyOpportunities;
  user.notifyEvents         = req.body.notifyEvents;
  user.notifyBlogs          = req.body.notifyBlogs;
  user.isDisplayEmail       = req.body.isDisplayEmail;
  user.isDeveloper          = req.body.isDeveloper;
  user.paymentMethod        = req.body.paymentMethod;
  user.businessName         = req.body.businessName;
  user.businessAddress      = req.body.businessAddress;
  user.businessAddress2     = req.body.businessAddress2;
  user.businessCity         = req.body.businessCity;
  user.businessProvince     = req.body.businessProvince;
  user.businessCode         = req.body.businessCode;
  user.location       = req.body.location;
  user.description    = req.body.description;
  user.website        = req.body.website;
  user.skills         = req.body.skills;
  user.skillsData     = req.body.skillsData;
  user.badges         = req.body.badges;
  user.capabilities   = req.body.capabilities;
  user.endorsements   = req.body.endorsements;
  user.github         = req.body.github;
  user.stackOverflow  = req.body.stackOverflow;
  user.stackExchange  = req.body.stackExchange;
  user.linkedIn       = req.body.linkedIn;
  user.isPublicProfile = req.user.isPublicProfile;
  user.isAutoAdd = req.user.isAutoAdd;
      user.c01_flag = req.body.c01_flag;
      user.c02_flag = req.body.c02_flag;
      user.c03_flag = req.body.c03_flag;
      user.c04_flag = req.body.c04_flag;
      user.c05_flag = req.body.c05_flag;
      user.c06_flag = req.body.c06_flag;
      user.c07_flag = req.body.c07_flag;
      user.c08_flag = req.body.c08_flag;
      user.c09_flag = req.body.c09_flag;
      user.c10_flag = req.body.c10_flag;
      user.c11_flag = req.body.c11_flag;
      user.c12_flag = req.body.c12_flag;
      user.c13_flag = req.body.c13_flag;
      user.c01_tags = req.body.c01_tags;
      user.c02_tags = req.body.c02_tags;
      user.c03_tags = req.body.c03_tags;
      user.c04_tags = req.body.c04_tags;
      user.c05_tags = req.body.c05_tags;
      user.c06_tags = req.body.c06_tags;
      user.c07_tags = req.body.c07_tags;
      user.c08_tags = req.body.c08_tags;
      user.c09_tags = req.body.c09_tags;
      user.c10_tags = req.body.c10_tags;
      user.c11_tags = req.body.c11_tags;
      user.c12_tags = req.body.c12_tags;
      user.c13_tags = req.body.c13_tags;
      user.c01_experience = req.body.c01_experience;
      user.c02_experience = req.body.c02_experience;
      user.c03_experience = req.body.c03_experience;
      user.c04_experience = req.body.c04_experience;
      user.c05_experience = req.body.c05_experience;
      user.c06_experience = req.body.c06_experience;
      user.c07_experience = req.body.c07_experience;
      user.c08_experience = req.body.c08_experience;
      user.c09_experience = req.body.c09_experience;
      user.c10_experience = req.body.c10_experience;
      user.c11_experience = req.body.c11_experience;
      user.c12_experience = req.body.c12_experience;
      user.c13_experience = req.body.c13_experience;
      user.c01_years = req.body.c01_years;
      user.c02_years = req.body.c02_years;
      user.c03_years = req.body.c03_years;
      user.c04_years = req.body.c04_years;
      user.c05_years = req.body.c05_years;
      user.c06_years = req.body.c06_years;
      user.c07_years = req.body.c07_years;
      user.c08_years = req.body.c08_years;
      user.c09_years = req.body.c09_years;
      user.c10_years = req.body.c10_years;
      user.c11_years = req.body.c11_years;
      user.c12_years = req.body.c12_years;
      user.c13_years = req.body.c13_years;






  userController.subscriptionHandler(user,prevState)
  .then(function() {
    user.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      res.json(user);
    });
  });
};

/**
 * Delete a user
 */
exports.delete = function (req, res) {
  var user = req.model;

  user.remove(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

      Notifications.unsubscribeUserNotification ('not-add-opportunity', user)
      .then(function() {
        res.json();
      });
  });
};

/**
 * List of Users
 */
exports.list = function (req, res) {
  User.find({}, '-salt -password -providerData').sort('-created').populate('user', 'displayName').exec(function (err, users) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(users);
  });
};

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  User.findById(id, '-salt -password -providerData').exec(function (err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      return next(new Error('Failed to load user ' + id));
    }
    req.model = user;
    next();
  });
};
/**
 * approve Gov. Request
 */
exports.approve = function (req, res, next) {
User.findOne({
    _id: req.body.user._id
  }).exec(function (err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      return next(new Error('Failed to load User ' + req.body.user._id));
    }
    if (req.body.flag === 1)
        user.roles=['gov','user'];
    else
      {
        user.roles=['user'];
      }

      user.save(function (err) {
                  if (err) {
            return res.status(422).send({
              message: errorHandler.getErrorMessage(err)
            });
          } else {
            res.send({
              message: 'done'
            });
          }
        });

    next();
  });
};
// -------------------------------------------------------------------------
//
// lists of emails and names for notifications
//
// -------------------------------------------------------------------------
exports.notifyOpportunities = function (req, res) {
    User.find ({notifyOpportunities:true}).select ('firstName lastName email')
    .exec (function (err, users) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      else return res.json (users);
    });
};
exports.notifyMeetings = function (req, res) {
    User.find ({notifyEvents:true}).select ('firstName lastName email')
    .exec (function (err, users) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      else return res.json (users);
    });
};
