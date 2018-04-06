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
	Capability = mongoose.model('Capability'),
	Notifications = require(path.resolve('./modules/notifications/server/controllers/notifications.server.controller')),
	errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
	helpers = require(path.resolve('./modules/core/server/controllers/core.server.helpers')),
	multer = require('multer'),
	_ = require('lodash')
	;

var popfields = '_id lastName firstName displayName profileImageURL capabilities capabilitySkills';
var getOrgById = function (id) {
	return new Promise (function (resolve, reject) {
		Org.findById (id)
		.populate ('owner', '_id lastName firstName displayName profileImageURL')
		.populate ('createdBy', 'displayName')
		.populate ('updatedBy', 'displayName')
		.populate ('admins', popfields)
		.populate ('capabilities', 'code name')
		.populate ('capabilitySkills', 'code name')
		.populate ({
			path: 'members',
			select: popfields,
			populate: [{
				path : 'capabilities',
				model: 'Capability',
				select: 'name code labelClass'
			},
			{
				path : 'capabilitySkills',
				model: 'CapabilitySkill',
				select: 'name code'
			}]
		})
		.exec (function (err, org) {
			if (err) {
				reject (err);
			} else if (!org) {
				resolve (null);
			} else {
				resolve (org);
			}
		});
	});
};
// -------------------------------------------------------------------------
//
// save a user once membership has been updated
//
// -------------------------------------------------------------------------
var saveUser = function (user) {
	return new Promise (function (resolve, reject) {
		user.save (function (err, newuser) {
			if (err) {reject (err);}
			else {resolve (newuser);}
		});
	});
};
var notifyUser = function (org) {
	return function (user) {
		return Notifications.notifyUserAdHoc ('user-added-to-company', {
			username    : user.displayName,
			useremail   : user.email,
			adminname   : org.adminName,
			adminemail  : org.adminEmail,
			companyname : org.name
		});
	};
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
		org[fieldName].addToSet (user._id);
		org.markModified (fieldName);
		if (fieldName === 'admins') {
			user.orgsAdmin.addToSet (org._id);
			user.markModified ('orgsAdmin');
		} else {
			user.orgsMember.addToSet (org._id);
			user.markModified ('orgsMember');
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
		org[fieldName].pull (user._id);
		org.markModified (fieldName);
		if (fieldName === 'admins') {
			user.orgsAdmin.pull (org._id);
			user.markModified ('orgsAdmin');
		} else {
			user.orgsMember.pull (org._id);
			user.markModified ('orgsMember');
		}
		return user;
	};
};
// -------------------------------------------------------------------------
//
// get required capabilities
//
// -------------------------------------------------------------------------
var getRequiredCapabilities = function () {
	return new Promise (function (resolve, reject) {
		Capability.find ({
			isRequired : true
		}, function (err, capabilities) {
			if (err) reject (err);
			else resolve (capabilities);
		});
	});
};
// -------------------------------------------------------------------------
//
// collapse all member capabilities into the org
//
// -------------------------------------------------------------------------
var collapseCapabilities = function (org) {
	return new Promise (function (resolve, reject) {
		var c = {};
		var s = {};
		var orgmembers = org.members.map (function (o) {if (o._id) return o._id; else return o;});
		User.find ({_id: {$in:orgmembers}})
		.populate ('capabilities','name code')
		.populate ('capabilitySkills','name code')
		.exec (function (err, members) {
			if (err) reject ({message:'Error getting members'});
			members.forEach (function (member) {
				if (member.capabilities) member.capabilities.forEach (function (capability) {
					if (capability._id) c[capability._id.toString()] = true;
					else c[capability.toString()] = true;
				});
				if (member.capabilitySkills) member.capabilitySkills.forEach (function (skill) {
					if (skill._id) s[skill._id.toString()] = true;
					else s[skill.toString()] = true;
				});
			});
			org.capabilities = Object.keys (c);
			org.capabilitySkills = Object.keys (s);
			resolve (org);
		});
	});
};
// -------------------------------------------------------------------------
//
// given an org that was selected using findById (with al users and their
// capabilities) go through and ensure that the org has everythihng it
// needs to satisfy the RFQ
//
// -------------------------------------------------------------------------
var checkCapabilities = function (org) {
	return collapseCapabilities (org)
	.then (getRequiredCapabilities)
	.then (function (capabilities) {
		var c = org.capabilities.map (function (c) {return c}).reduce (function (a, c) {a[c]=true;return a;}, {});
		org.metRFQ = capabilities.map (function (ca) {return c[ca._id.toString()] || false}).reduce (function (a, c) {return a && c;});
		return org;
	})
};
// -------------------------------------------------------------------------
//
// just to make things easier to read later on
//
// -------------------------------------------------------------------------
var resolveOrg = function (org) {
	return function () {
		return org;
	};
};
var saveOrg = function (req, res) {
	return function (org) {
		helpers.applyAudit (org, req.user);
		checkCapabilities (org)
		.then (function (org) {
			org.save (function (err, neworg) {
				if (err) {
					return res.status(422).send({
						message: errorHandler.getErrorMessage(err)
					});
				} else {
					//
					// TBD: the code following shoudl be nested in here and checked for
					// failure properly etc.
					//
					req.user.save (function (err, user) {
						req.login (user, function (err) {
							if (err) {
								res.status(422).send ({
									message: errorHandler.getErrorMessage (err)
								});
							}
						});
					});
					getOrgById (neworg._id)
					.then (function (o) {
						res.json (org);
					})
					.catch (function (err) {
						res.status (422).send ({
							message: 'Error popuilating organization'
						});
					});
				}
			});
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
	.then (notifyUser (org))
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
	return Promise.resolve (user)
	.then (removeUserFrom (org, 'members'))
	// .then (saveUser)
	.then (function () {return org;});
};
var removeAdmin = function (user, org) {
	return Promise.resolve (user)
	.then (removeUserFrom (org, 'members'))
	.then (removeUserFrom (org, 'admins'))
	// .then (saveUser)
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
	// set the owner and also add the owner to the list of admins
	//
	org.owner = req.user._id;
	addAdmin (req.user, org)
	.then (saveOrg (req, res));
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
	}
	//
	// copy over everything passed in. This will overwrite the
	// audit fields, but they get updated in the following step
	//
	var org = _.assign (req.org, req.body);
	org.adminName = req.user.displayName;
	org.adminEmail = req.user.email;

	var p = (list) ? inviteMembers (list, org) : Promise.resolve (org);

	p.then (saveOrg (req, res));
};

// -------------------------------------------------------------------------
//
// delete the org
//
// TBD : locate all members and admins and remove the org from thier
// orgsAdmin and orgsMember arrays. Not a problem if they stay as the populate
// will just ignore them, but it would be cleaner if it happens
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
	.populate ('members', popfields)
	.populate ('admins', popfields)
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
	getOrgById (id)
	.then (function (org) {
		if (!org) res.status(200).send ({});
		else {
			req.org = org;
			next ();
		}
	})
	.catch (function (err) {
		next (err);
	});
	// Org.findById (id)
	// .populate ('owner', '_id lastName firstName displayName profileImageURL')
	// .populate ('createdBy', 'displayName')
	// .populate ('updatedBy', 'displayName')
	// .populate ('admins', popfields)
	// .populate ('capabilities', 'code name')
	// .populate ('capabilitySkills', 'code name')
	// .populate ({
	// 	path: 'members',
	// 	select: popfields,
	// 	populate: [{
	// 		path : 'capabilities',
	// 		model: 'Capability',
	// 		select: 'name code labelClass'
	// 	},
	// 	{
	// 		path : 'capabilitySkills',
	// 		model: 'CapabilitySkill',
	// 		select: 'name code'
	// 	}]
	// })
	// .exec (function (err, org) {
	// 	if (err) {
	// 		return next(err);
	// 	} else if (!org) {
	// 		return res.status(200).send ({});
	// 		// return res.status(404).send({
	// 		// 	message: 'No org with that identifier has been found'
	// 		// });
	// 	}
	// 	req.org = org;
	// 	next();
	// });
};
exports.orgByIDSmall = function (req, res, next, id) {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).send({
			message: 'Org is invalid'
		});
	}
	Org.findById (id)
	.populate ('owner', '_id lastName firstName displayName profileImageURL')
	.exec (function (err, org) {
		if (err) {
			return next(err);
		} else if (!org) {
			return res.status(200).send ({});
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
