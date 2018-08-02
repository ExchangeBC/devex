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
	Proposal = mongoose.model('Proposal'),
	// Notifications = require(path.resolve('./modules/notifications/server/controllers/notifications.server.controller')),
	sendMessages = require(path.resolve('./modules/messages/server/controllers/messages.controller')).sendMessages,
	Proposals = require(path.resolve('./modules/proposals/server/controllers/proposals.server.controller')),
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
exports.getOrgById = getOrgById;
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
// var notifyUser = function (org) {
// 	return function (user) {
// 		Notifications.notifyUserAdHoc ('user-added-to-company', {
// 			username    : user.displayName,
// 			useremail   : user.email,
// 			adminname   : org.adminName,
// 			adminemail  : org.adminEmail,
// 			companyname : org.name
// 		});
// 		return Promise.resolve ();
// 	};
// };
// -------------------------------------------------------------------------
//
// find a user give the passed in search
//
// -------------------------------------------------------------------------
var getUsers = function (terms) {
	return new Promise (function (resolve, reject) {
		User.find (terms, '_id email displayName firstName username profileImageURL orgsAdmin orgsMember orgsPending').exec (function (err, user) {
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
		if (fieldName === 'admins') {
			user.orgsAdmin.addToSet (org._id);
			user.markModified ('orgsAdmin');
			org.admins.addToSet (user._id);
			org.markModified ('admins');
		} else {
			user.orgsMember.addToSet (org._id);
			user.markModified ('orgsMember');
			org.members.addToSet (user._id);
			org.markModified ('members');
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
		if (fieldName === 'admins') {
			user.orgsAdmin.pull (org._id);
			user.markModified ('orgsAdmin');
			org.admins.pull (user._id);
			org.markModified ('admins');
		} else {
			user.orgsMember.pull (org._id);
			user.markModified ('orgsMember');
			org.members.pull (user._id);
			org.markModified ('members');
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
	// make sure an org was found
	if (!org) {
		return;
	}
	return collapseCapabilities (org)
	.then (getRequiredCapabilities)
	.then (function (capabilities) {
		var c = org.capabilities.map (function (c) {return c}).reduce (function (a, c) {a[c]=true;return a;}, {});
		org.isCapable = capabilities.map (function (ca) {return c[ca._id.toString()] || false}).reduce (function (a, c) {return a && c;}, true);
		org.metRFQ = org.isCapable && org.isAcceptedTerms && org.members.length >= 2;
		return org;
	})
};
var minisave = function (org) {
	// make sure an org was found
	if (!org) {
		return;
	}
	return new Promise (function (resolve, reject) {
		org.save (function (err, model) {
			if (err) reject (err);
			else resolve (model);
		});
	});
};
exports.updateOrgCapabilities = function (orgId) {
	return getOrgById (orgId)
	.then (checkCapabilities)
	.then (minisave);
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
		var additionsList = org.additionsList;
		if (additionsList && additionsList.found.length === 0 && additionsList.notFound.length === 0) additionsList = null;
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
						o = o.toObject ();
						o.emaillist = additionsList;
						res.json (o);
					})
					.catch (function (err) {
						res.status (422).send ({
							message: 'Error populating organization'
						});
					});
				}
			});
		});
	};
};
var saveOrgReturnMessage = function (req, res) {
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
						res.status(200).json ({
							message: '<h4>Success!</h4> You are now a member of '+org.name
						})
					})
					.catch (function (err) {
						res.status (422).send ({
							message: 'Error populating organization'
						});
					});
				}
			});
		});
	};
};
// -------------------------------------------------------------------------
//
// remove a user from all open proposals
//
// -------------------------------------------------------------------------
var removeUserFromProposals = function (user) {
	return function (org) {
		var rightNow = new Date ();
		var userid = user.id;
		return new Promise (function (resolve, reject) {
			Proposal.find ({org:org._id})
			.populate ('opportunity', 'opportunityTypeCd deadline')
			.exec (function (err, proposals) {
				Promise.all (proposals.map (function (proposal) {
					var deadline       = new Date (proposal.opportunity.deadline);
					var isSprintWithUs = (proposal.opportunity.opportunityTypeCd === 'sprint-with-us');
					//
					// if sprint with us and the opportunity is still open
					// remove the user and save the proposal
					//
					if (isSprintWithUs && 0 < (deadline - rightNow)) {
						return Proposals.removeUserFromProposal (proposal, userid);
					} else {
						return Promise.resolve ();
					}
				}))
				.then (resolve, reject);
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
	// .then (notifyUser (org))
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
	.then (removeUserFromProposals (user))
	.then (resolveOrg (org));
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
var inviteMembersWithMessages = function (emaillist, org) {
	var list = {
		found    : [],
		notFound : []
	};
	if (!emaillist) return Promise.resolve (list);
	return getUsers ({email : {$in : emaillist}})
	.then (function (users) {
		if (users) {
			list.found = users;
			var usersIndex = users.reduce (function (accum, curr) {accum[curr.email] = true; return accum;}, {});
			emaillist.forEach (function (email) {
				if (!usersIndex[email]) list.notFound.push ({email:email});
			});
		}
	})
	.then (function () {
		sendMessages ('add-user-to-company-request', list.found, {org:org});
		sendMessages ('invitation-from-company', list.notFound, {org:org});

		// record users so that they have 'permission' to self add
		if (!org.invited) {
			org.invited = [];
		}
		list.notFound.forEach(function(entry) {
			org.invited.push(entry.email);
		});

		list.found.forEach(function(entry) {
			org.invited.push(entry.email);
		});
	})
	.then (function () {
		return Promise.resolve (list);
	});
};

var inviteMembers = function (emaillist, org) {
	return inviteMembersWithMessages (emaillist, org);
}

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
	// We use lodash mergeWith and a customizer to handle arrays.  By default lodash merge will concatenate arrays, which means that
	// items can never be removed.  The customizer defaults to also use the incoming array.
	// see https://lodash.com/docs/4.17.10#mergeWith
	var org = _.mergeWith(req.org, req.body, (objValue, srcValue) => {
		if (_.isArray(objValue)) {
			return srcValue;
		}
	});
	org.adminName  = req.user.displayName;
	org.adminEmail = req.user.email;

	var additionsList = {
		found : [],
		notFound : []
	};
	inviteMembers (list, org)
	.then (function (newlist) {
		additionsList.found = newlist.found;
		additionsList.notFound = newlist.notFound;
		org.additionsList = additionsList;
		return org;
	})
	.then (saveOrg (req, res));
};

// -------------------------------------------------------------------------
//
// delete the org
//
// TBD : In future we should NOT allow deletion of companies that have
// submitted proposals as we may need the data and linkage for public record
//
// -------------------------------------------------------------------------
var getAllAffectedMembers = function (orgId) {
	return new Promise (function (resolve, reject) {
		User.find ({
			$or : [
				{orgsAdmin : {$in: [orgId]}},
				{orgsMember : {$in: [orgId]}},
				{orgsPending : {$in: [orgId]}}
			]
		}, function (err, users) {
			if (err) reject (err);
			else resolve (users);
		});
	});
};
var removeAllCompanyReferences = function (orgId) {
	return function (users) {
		return Promise.all (users.map (function (user) {
			user.orgsAdmin.pull (orgId);
			user.orgsMember.pull (orgId);
			user.orgsPending.pull (orgId);
			user.markModified ('orgsAdmin');
			user.markModified ('orgsMember');
			user.markModified ('orgsPending');
			return user.save ();
		}));
	};
};
var removeAllProposals = function (orgId) {
	//
	// this actually needs a bit of thinking. Do we want to delete all proposals, or are
	// some of them needed for a matter of public record ?
	//
	return function () {
		return Proposals.deleteForOrg ();
	};
}
exports.delete = function (req, res) {
	var org = req.org;
	var orgId = org._id;
	org.remove(function (err) {
		if (err) {
			return res.status(422).send ({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			getAllAffectedMembers (orgId)
			.then (removeAllCompanyReferences (orgId))
			// .then (removeAllProposals (orgId))
			.then (function () {
				res.json (org);
			})
			.catch (function (err) {
				res.status(422).send ({ message: errorHandler.getErrorMessage(err) });
			})
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
// get a list of orgs that the user is an Admin for
//
// -------------------------------------------------------------------------
exports.my = function (req, res) {
	Org.find ({
		members: {$in: [req.user._id]}
	})
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
exports.myadmin = function (req, res) {
	Org.find ({
		admins: {$in: [req.user._id]}
	})
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
// add the current user to the passed in org
//
// -------------------------------------------------------------------------
exports.addMeToOrg = function (req, res) {
	var org = req.org;
	var user = req.user;
	var orgO = org.toObject();
	var userO = user.toObject();
	if (orgO && orgO.invited && orgO.invited.indexOf(userO.email) !== -1) {
		Promise.resolve (user)
		.then (addUserTo (org, 'members'))
		.then (saveUser)
		.then (function () { return org; })
		.then (saveOrg (req, res));
	}
};
exports.addUserToOrg = function (req, res) {
	req.user = req.model;
	var org = req.org;
	var user = req.user;
	var orgO = org.toObject();
	var userO = user.toObject();
	if (req.params.actionCode === 'decline') {
		return res.status (200).json ({
			message: '<h4>Declined</h4>Thank you, you have not been added to company '+org.name
		});
	}
	else {
		// return res.status (200).json ({
		// 	message: '<h4>Accepted</h4>Thank you, you have been added to company '+org.name
		// });
		if (orgO && orgO.invited && orgO.invited.indexOf(userO.email) !== -1) {
			Promise.resolve (user)
			.then (addUserTo (org, 'members'))
			.then (saveUser)
			.then (function () { return org; })
			.then (saveOrgReturnMessage (req, res));
		}
	}
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
