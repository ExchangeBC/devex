'use strict';
/*

Notes about orgs

Roles:
------
Membership in a org is defined by the user having various roles attached to their
user record. There are only three possible states: admin, member, or request.
When a user requests membership they get the request role only, once accepted that
simply gets changed to the member role. Roles are simply the org code with suffixes.

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
	Org = mongoose.model('Org'),
	errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
	helpers = require(path.resolve('./modules/core/server/controllers/core.server.helpers')),
	multer = require('multer'),
	_ = require('lodash')
	;

// -------------------------------------------------------------------------
//
// create a new org. the user doing the creation will be set as the
// administrator
//
// -------------------------------------------------------------------------
exports.create = function (req, res) {
	var org = new Org(req.body);
	//
	// set the audit fields so we know who did what when
	//
	helpers.applyAudit (org, req.user);
	org.owner = req.user;
	//
	// save and return
	//
	org.save (function (err) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			req.user.save ();
			res.json (org);
		}
	});
};

// -------------------------------------------------------------------------
//
// this just takes the already queried object and pass it back
//
// -------------------------------------------------------------------------
exports.read = function (req, res) {
	res.json (req.org);
};

// -------------------------------------------------------------------------
//
// update the document, make sure to apply audit. We don't mess with the
// code if they change the title as that would mean reworking all the roles
//
// -------------------------------------------------------------------------
exports.update = function (req, res) {
		//
		// copy over everything passed in. This will overwrite the
		// audit fields, but they get updated in the following step
		//
		var org = _.assign (req.org, req.body);
		//
		// set the audit fields so we know who did what when
		//
		helpers.applyAudit (org, req.user)
		//
		// save
		//
		org.save (function (err) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.json (org);
			}
		});
};

// -------------------------------------------------------------------------
//
// delete the org
//
// -------------------------------------------------------------------------
exports.delete = function (req, res) {
		var org = req.org;
		org.remove(function (err) {
			if (err) {
				return res.status(422).send ({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.json (org);
			}
		});
};

// -------------------------------------------------------------------------
//
// return a list of all orgs
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
	Org.find ().sort ('user.lastName')
	.populate ('user', 'lastName firstName displayName orgImageURL')
	.populate ('createdBy', 'displayName')
	.populate ('updatedBy', 'displayName')
	.populate ({
		path : 'endorsements.createdBy',
		model: 'User',
		select: 'displayName orgImageURL'
	})
	.exec (function (err, orgs) {
		if (err) {
			return res.status(422).send ({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (orgs);
		}
	});
};

// -------------------------------------------------------------------------
//
// magic that populates the org on the request
//
// -------------------------------------------------------------------------
exports.orgByID = function (req, res, next, id) {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).send({
			message: 'Org is invalid'
		});
	}
	Org.findById (id)
	.populate ('owner', 'lastName firstName displayName profileImageURL')
	.populate ('createdBy', 'displayName')
	.populate ('updatedBy', 'displayName')
	.exec (function (err, org) {
		if (err) {
			return next(err);
		} else if (!org) {
			return res.status(200).send ({});
			// return res.status(404).send({
			// 	message: 'No org with that identifier has been found'
			// });
		}
		req.org = org;
		next();
	});
};
// -------------------------------------------------------------------------
//
// Logo upload
//
// -------------------------------------------------------------------------
exports.logo = function (req, res) {
	var org       = req.org;
	var storage = multer.diskStorage (config.uploads.diskStorage);
	var upload = multer({storage: storage}).single('orgImageURL');
	upload.fileFilter = require(path.resolve('./config/lib/multer')).profileUploadFileFilter;
	var up            = helpers.fileUploadFunctions (org, Org, 'orgImageURL', req, res, upload, org.orgImageURL);

	if (org) {
		up.uploadImage ()
		.then (up.updateDocument)
		.then (up.deleteOldImage)
		.then (function () {
			res.json (org);
		})
		.catch (function (err) {
			res.status(422).send(err);
		});
	} else {
		res.status(401).send({
			message: 'invalid org or org not supplied'
		});
	}
};
