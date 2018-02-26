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
	User = mongoose.model('User'),
	errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
	helpers = require(path.resolve('./modules/core/server/controllers/core.server.helpers')),
	multer = require('multer'),
	_ = require('lodash')
	;

// -------------------------------------------------------------------------
//
// save a user once membership has been updated
//
// -------------------------------------------------------------------------
var saveUser = function (user) {
	return new Promise (function (resolve, reject) {
		// console.log ('saving user', user);
		user.save (function (err, newuser) {
			if (err) {reject (err);}
			else {resolve (newuser);}
		});
	});
};
// -------------------------------------------------------------------------
//
// find a user give the passed in search
//
// -------------------------------------------------------------------------
var getUsers = function (terms) {
	return new Promise (function (resolve, reject) {
		User.find (terms).exec (function (err, user) {
			if (err) reject (err);
			else resolve (user);
		});
	});
};
// -------------------------------------------------------------------------
//
// add to one of the org member arrays, returns a function to be used in a
// promise chain
//
// -------------------------------------------------------------------------
var addUserTo = function (org, fieldName) {
	return function (user) {
		// console.log ('add user', user._id, 'to ', fieldName);
		org[fieldName].addToSet (user._id);
		if (fieldName === 'admins') {
			user.orgsAdmin.addToSet (org._id);
		} else {
			user.orgsMember.addToSet (org._id);
		}
		return user;
	};
};
// -------------------------------------------------------------------------
//
// remove from one of the org member arrays, returns a function to be used
// in a promise chain
//
// -------------------------------------------------------------------------
var removeUserFrom = function (org, fieldName) {
	return function (user) {
		// console.log ('removing user', user._id, 'from ', fieldName);
		org[fieldName].pull (user._id);
		if (fieldName === 'admins') {
			user.orgsAdmin.pull (org._id);
		} else {
			user.orgsMember.pull (org._id);
		}
		return user;
	};
};
// -------------------------------------------------------------------------
//
// just to make things easier to read later on
//
// -------------------------------------------------------------------------
var resolveOrg = function (org) {
	return function () {
		// console.log ('resolving org', org._id);
		return org;
	};
};
var saveOrg = function (req, res) {
	return function (org) {
		// console.log ('saving org');
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
};

// -------------------------------------------------------------------------
//
// given a user and an org, associate the two by updatying their respective
// ids on each other's member lists
//
// -------------------------------------------------------------------------
var addMember = function (user, org) {
	return Promise.resolve (user)
	.then (addUserTo (org, 'members'))
	.then (saveUser)
	.then (resolveOrg (org));
};
var addAdmin = function (user, org) {
	return Promise.resolve (user)
	.then (addUserTo (org, 'members'))
	.then (addUserTo (org, 'admins'))
	.then (saveUser)
	.then (resolveOrg (org));
};
//
// same as above but a list
//
var addMembers = function (org) {
	return function (users) {
		return Promise.all (users.map (function (user) {
			return addMember (user, org);
		}))
		.then (resolveOrg (org));
	};
};
var addAdmins = function (org) {
	return function (users) {
		return Promise.all (users.map (function (user) {
			return addAdmin (user, org);
		}))
		.then (resolveOrg (org));
	};
};
// -------------------------------------------------------------------------
//
// given a user and an org, dissociate the two by removing their respective
// ids from each other's member lists
//
// -------------------------------------------------------------------------
var removeMember = function (user, org) {
	console.log ('removing member:', user._id);
	return Promise.resolve (user)
	.then (removeUserFrom (org, 'members'))
	.then (saveUser)
	.then (function () {return org;});
};
var removeAdmin = function (user, org) {
	return Promise.resolve (user)
	.then (removeUserFrom (org, 'members'))
	.then (removeUserFrom (org, 'admins'))
	.then (saveUser)
	.then (resolveOrg (org));
};
// -------------------------------------------------------------------------
//
// given a list of emails, find the user accounts and add them to the member
// list of the org, also do the cross reference and add the org to the
// list of orgs the user is a member of
//
// -------------------------------------------------------------------------
var inviteMembers = function (emaillist, org) {
	return getUsers ({email : {$in : emaillist}})
	.then (addMembers (org));
};

exports.removeUserFromMemberList = function (req, res) {
	removeMember (req.profile, req.org)
	.then (saveOrg (req, res));
}

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
	//
	// set the owner and also add the owner to the list of admins
	//
	org.owner = req.user._id;
	addAdmin (req.user, org);
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
// if a field called additions exists on the request, that means we are to
// add those users to the membership list. this will be a list of email
// addresses only, so the users need to be located and invited
//
// -------------------------------------------------------------------------
exports.update = function (req, res) {
	var list = null;
	if (req.body.additions) {
		list = req.body.additions.split (/[ ,]+/);
		console.log ('users to be added:', list);
	}
	//
	// copy over everything passed in. This will overwrite the
	// audit fields, but they get updated in the following step
	//
	var org = _.assign (req.org, req.body);

	var p = (list) ? inviteMembers (list, org) : Promise.resolve ();

	p.then (function () {
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
	.populate ('owner', '_id lastName firstName displayName profileImageURL')
	.populate ('createdBy', 'displayName')
	.populate ('updatedBy', 'displayName')
	.populate ('members')
	.populate ('admins')
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
	.populate ('owner', '_id lastName firstName displayName profileImageURL')
	.populate ('createdBy', 'displayName')
	.populate ('updatedBy', 'displayName')
	.populate ('members')
	.populate ('admins')
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
