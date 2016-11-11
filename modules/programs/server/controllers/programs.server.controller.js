'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Program = mongoose.model('Program'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create an program
 */
exports.create = function (req, res) {
  var program = new Program(req.body);
  program.user = req.user;

  program.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(program);
    }
  });
};

/**
 * Show the current program
 */
exports.read = function (req, res) {
  // convert mongoose document to JSON
  var program = req.program ? req.program.toJSON() : {};

  // Add a custom field to the Program, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Program model.
  program.isCurrentUserOwner = !!(req.user && program.user && program.user._id.toString() === req.user._id.toString());

  res.json(program);
};

/**
 * Update an program
 */
exports.update = function (req, res) {
  var program = req.program;

  program.title = req.body.title;
  program.content = req.body.content;

  program.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(program);
    }
  });
};

/**
 * Delete an program
 */
exports.delete = function (req, res) {
  var program = req.program;

  program.remove(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(program);
    }
  });
};

/**
 * List of Programs
 */
exports.list = function (req, res) {
  Program.find().sort('-created').populate('user', 'displayName').exec(function (err, programs) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(programs);
    }
  });
};

/**
 * Program middleware
 */
exports.programByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Program is invalid'
    });
  }

  Program.findById(id).populate('user', 'displayName').exec(function (err, program) {
    if (err) {
      return next(err);
    } else if (!program) {
      return res.status(404).send({
        message: 'No program with that identifier has been found'
      });
    }
    req.program = program;
    next();
  });
};
