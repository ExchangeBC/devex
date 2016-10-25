'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Opportunity = mongoose.model('Opportunity'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create an opportunity
 */
exports.create = function (req, res) {
  var opportunity = new Opportunity(req.body);
  opportunity.user = req.user;

  opportunity.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(opportunity);
    }
  });
};

/**
 * Show the current opportunity
 */
exports.read = function (req, res) {
  // convert mongoose document to JSON
  var opportunity = req.opportunity ? req.opportunity.toJSON() : {};

  // Add a custom field to the Opportunity, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Opportunity model.
  opportunity.isCurrentUserOwner = !!(req.user && opportunity.user && opportunity.user._id.toString() === req.user._id.toString());

  res.json(opportunity);
};

/**
 * Update an opportunity
 */
exports.update = function (req, res) {
  var opportunity = req.opportunity;

  opportunity.title = req.body.title;
  opportunity.content = req.body.content;

  opportunity.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(opportunity);
    }
  });
};

/**
 * Delete an opportunity
 */
exports.delete = function (req, res) {
  var opportunity = req.opportunity;

  opportunity.remove(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(opportunity);
    }
  });
};

/**
 * List of Opportunities
 */
exports.list = function (req, res) {
  Opportunity.find().sort('-created').populate('user', 'displayName').exec(function (err, opportunities) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(opportunities);
    }
  });
};

/**
 * Opportunity middleware
 */
exports.opportunityByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Opportunity is invalid'
    });
  }

  Opportunity.findById(id).populate('user', 'displayName').exec(function (err, opportunity) {
    if (err) {
      return next(err);
    } else if (!opportunity) {
      return res.status(404).send({
        message: 'No opportunity with that identifier has been found'
      });
    }
    req.opportunity = opportunity;
    next();
  });
};
