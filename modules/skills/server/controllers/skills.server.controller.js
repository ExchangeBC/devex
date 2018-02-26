'use strict';
/*

Notes about skills

Roles:
------
Membership in a skill is defined by the user having various roles attached to their
user record. There are only three possible states: admin, member, or request.
When a user requests membership they get the request role only, once accepted that
simply gets changed to the member role. Roles are simply the skill code with suffixes.

member  : <code>
admin   : <code>-admin
request : <code>-request

*/

/**
 * Module dependencies.
 */
var path = require('path'),
	mongoose = require('mongoose'),
	Skill = mongoose.model('Skill'),
	errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
	helpers = require(path.resolve('./modules/core/server/controllers/core.server.helpers')),
	Opportunities = require(path.resolve('./modules/opportunities/server/controllers/opportunities.server.controller')),
	_ = require('lodash'),
	Notifications = require(path.resolve('./modules/notifications/server/controllers/notifications.server.controller'))
	;

// -------------------------------------------------------------------------
//
// this just takes the already queried object and pass it back
//
// -------------------------------------------------------------------------
exports.read = function (req, res) {
	res.json (req.skill);
};

// -------------------------------------------------------------------------
//
// update the document, make sure to apply audit. We don't mess with the
// code if they change the name as that would mean reworking all the roles
//
// -------------------------------------------------------------------------
exports.update = function (req, res) {
	//
	// copy over everything passed in.
	//
	var skill = _.assign (req.skill, req.body);
	//
	// save
	//
	skill.save(function (err, result) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (result);
		}
	});
};

// -------------------------------------------------------------------------
//
// return a list of all skills
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
	Skill.find({}).sort('key')
	.exec(function (err, skills) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (skills);
		}
	});
};

// -------------------------------------------------------------------------
//
// return a list of all skills
//
// -------------------------------------------------------------------------
exports.objectlist = function (req, res) {
	Skill.find({}).sort('key')
	.exec(function (err, skills) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json ({
				list  : skills,
				bykey : skills.reduce (function (accum, current) {accum[current.key]=current;return accum;}, {})
			});
		}
	});
};

// -------------------------------------------------------------------------
//
// magic that populates the skill on the request
//
// -------------------------------------------------------------------------
exports.skillByID = function (req, res, next, id) {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).send({
			message: 'Skill is invalid'
		});
	}
	Skill.findById(id)
	.exec(function (err, skill) {
		if (err) {
			return next(err);
		} else if (!skill) {
			return res.status(404).send({
				message: 'No skill with that identifier has been found'
			});
		}
		req.skill = skill;
		next();
	});
};

