'use strict';
/*

Notes about profiles

Roles:
------
Membership in a profile is defined by the user having various roles attached to their
user record. There are only three possible states: admin, member, or request.
When a user requests membership they get the request role only, once accepted that
simply gets changed to the member role. Roles are simply the profile code with suffixes.

member  : <code>
admin   : <code>-admin
request : <code>-request

*/

'use strict';


/**
 * Module dependencies
 */
var path = require('path'),
	config = require(path.resolve('./config/config')),
	mongoose = require('mongoose'),
	Profile = mongoose.model('Profile'),
	errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
	helpers = require(path.resolve('./modules/core/server/controllers/core.server.helpers')),
	_ = require('lodash')
	;

// -------------------------------------------------------------------------
//
// get a list of all my profiles, but only ones I have access to as a normal
// member or admin, just not as request
//
// -------------------------------------------------------------------------
exports.my = function (req, res) {
	var me = helpers.myStuff ((req.user && req.user.roles)? req.user.roles : null );
	var search = me.isAdmin ? {} : { code: { $in: me.profiles.member } };
	Profile.find (search)
	.select ('code title short')
	.exec (function (err, profiles) {
		if (err) {
			return res.status(422).send ({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (profiles);
		}
	});
};
// -------------------------------------------------------------------------
//
// create a new profile. the user doing the creation will be set as the
// administrator
//
// -------------------------------------------------------------------------
exports.create = function (req, res) {
	var profile = new Profile(req.body);
	//
	// set the audit fields so we know who did what when
	//
	helpers.applyAudit (profile, req.user);
	profile.user = req.user;
	profile._id = req.user._id;
	//
	// save and return
	//
	profile.save (function (err) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			req.user.save ();
			res.json (profile);
		}
	});
};

// -------------------------------------------------------------------------
//
// this just takes the already queried object and pass it back
//
// -------------------------------------------------------------------------
exports.read = function (req, res) {
	res.json (req.profile);
};

// -------------------------------------------------------------------------
//
// update the document, make sure to apply audit. We don't mess with the
// code if they change the title as that would mean reworking all the roles
//
// -------------------------------------------------------------------------
exports.update = function (req, res) {
	if (req.profile.user && req.user._id.toString() === req.profile.user._id.toString()) {
		//
		// copy over everything passed in. This will overwrite the
		// audit fields, but they get updated in the following step
		//
		var profile = _.assign (req.profile, req.body);
		//
		// set the audit fields so we know who did what when
		//
		helpers.applyAudit (profile, req.user)
		//
		// save
		//
		profile.save (function (err) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.json (profile);
			}
		});
	}
	else {
		return res.status(422).send({
			message: 'Not Authorized'
		});

	}
};

// -------------------------------------------------------------------------
//
// delete the profile
//
// -------------------------------------------------------------------------
exports.delete = function (req, res) {
	if (req.profile.user && req.user._id.toString() === req.profile.user._id.toString()) {
		var profile = req.profile;
		profile.remove(function (err) {
			if (err) {
				return res.status(422).send ({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.json (profile);
			}
		});
	}
};

// -------------------------------------------------------------------------
//
// return a list of all profiles
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
	Profile.find ().sort ('user.lastName')
	.populate ('user', 'lastName firstName displayName profileImageURL')
	.populate ('createdBy', 'displayName')
	.populate ('updatedBy', 'displayName')
	.populate ({
		path : 'endorsements.createdBy',
		model: 'User',
		select: 'displayName profileImageURL'
	})
	.exec (function (err, profiles) {
		if (err) {
			return res.status(422).send ({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (profiles);
		}
	});
};

// -------------------------------------------------------------------------
//
// magic that populates the profile on the request
//
// -------------------------------------------------------------------------
exports.profileByID = function (req, res, next, id) {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).send({
			message: 'Profile is invalid'
		});
	}
	Profile.findById (id)
	.populate ('user', 'lastName firstName displayName profileImageURL')
	.populate ('createdBy', 'displayName')
	.populate ('updatedBy', 'displayName')
	.populate ({
		path : 'endorsements.createdBy',
		model: 'User',
		select: 'displayName profileImageURL'

	})
	.exec (function (err, profile) {
		if (err) {
			return next(err);
		} else if (!profile) {
			return res.status(200).send ({});
			// return res.status(404).send({
			// 	message: 'No profile with that identifier has been found'
			// });
		}
		req.profile = profile;
		next();
	});
};
