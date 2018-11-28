'use strict';
/*

Notes about proposals

Roles:
------
Membership in a proposal is defined by the user having various roles attached to their
user record. There are only three possible states: admin, member, or request.
When a user requests membership they get the request role only, once accepted that
simply gets changed to the member role. Roles are simply the proposal code with suffixes.

member  : <code>
admin   : <code>-admin
request : <code>-request

*/

/**
 * Module dependencies.
 */
const path 			= require('path'),
	mongoose 		= require('mongoose'),
	{ Proposal } 		= require('../models/proposal.server.model'),
	{ User } 			= require('../../../users/server/models/user.server.model'),
	{ CoreErrors } 	= require('../../../core/server/controllers/errors.server.controller'),
	{ CoreHelpers } = require('../../../core/server/controllers/core.server.helpers'),
	{ OpportunitiesController } 	= require('../../../opportunities/server/controllers/opportunities.server.controller'),
	_ 				= require('lodash'),
	multer 			= require('multer'),
	config 			= require(path.resolve('./config/config')),
	fileStream = require(path.resolve('./config/lib/filestream'));

const helpers = new CoreHelpers();
const errorHandler = new CoreErrors();

var userfields = '_id displayName firstName lastName email phone address username profileImageURL \
					businessName businessAddress businessContactName businessContactPhone businessContactEmail \
					roles provider';

const Opportunities = new OpportunitiesController();

var ensureProposalOwner = function(proposal, user) {
	if (!user) {
		return false;
	}

	return proposal.user._id === user._id;
}

const adminRole = opportunity => {
	return opportunity.code + '-admin';
};

const ensureAdmin = (opportunity, user, res) => {
	if (user.roles.indexOf(adminRole(opportunity)) === -1 && user.roles.indexOf('admin') === -1) {
		res.status(422).send({
			message: 'User Not Authorized'
		});
		return false;
	} else {
		return true;
	}
};

// -------------------------------------------------------------------------
//
// Get a proposal for the given opportunity and user
//
// -------------------------------------------------------------------------
exports.getUserProposalForOpp = function (req, res) {
	if (!req.user) {
		return res.json ({});
	}

	Proposal.findOne ({user:req.user._id, opportunity:req.opportunity._id})
	.populate('createdBy', 'displayName')
	.populate('updatedBy', 'displayName')
	.populate('opportunity')
	.populate('user')
	.exec (function (err, proposals) {
		if (err) {
			return res.status(422).send ({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (proposals);
		}
	});
};

var getUserCapabilities = function (users) {
	return new Promise (function (resolve, reject) {
		var userids = users.map (function (o) {if (o._id) return o._id; else return o;});
		User.find ({_id: {$in:userids}})
		.populate ('capabilities','name code')
		.populate ('capabilitySkills','name code')
		.exec (function (err, members) {
			var ret = {capabilities:{},capabilitySkills:{}}
			if (err) reject ({message:'Error getting members'});
			members.forEach (function (member) {
				if (member.capabilities) member.capabilities.forEach (function (capability) {
					ret.capabilities[capability.code] = capability;
				});
				if (member.capabilitySkills) member.capabilitySkills.forEach (function (capabilitySkill) {
					ret.capabilitySkills[capabilitySkill.code] = capabilitySkill;
				});
			});
			resolve (ret);
		});
	});
};
var getPhaseCapabilities = function (proposal) {
	return Promise.all ([
		getUserCapabilities (proposal.phases.inception.team),
		getUserCapabilities (proposal.phases.proto.team),
		getUserCapabilities (proposal.phases.implementation.team)
	]).then (function (results) {
		return results.reduce (function (accum, curr) {
			Object.keys (curr.capabilities).forEach (function (key) {
				accum.capabilities[key] = curr.capabilities[key];
			});
			Object.keys (curr.capabilitySkills).forEach (function (key) {
				accum.capabilitySkills[key] = curr.capabilitySkills[key];
			});
			return accum;
		});
	});
};

// -------------------------------------------------------------------------
//
// set up internal aggregate states for phase information
//
// -------------------------------------------------------------------------
var setPhases = function (proposal) {
	//
	// only for sprint with us
	//
	if (proposal.opportunity.opportunityTypeCd !== 'sprint-with-us') return Promise.resolve ();
	else return getPhaseCapabilities (proposal)
	.then (function (curr) {
		proposal.phases.aggregate.capabilities = [];
		proposal.phases.aggregate.capabilitySkills = [];
		Object.keys (curr.capabilities).forEach (function (key) {
			proposal.phases.aggregate.capabilities.push (curr.capabilities[key]);
		});
		Object.keys (curr.capabilitySkills).forEach (function (key) {
			proposal.phases.aggregate.capabilitySkills.push (curr.capabilitySkills[key]);
		});
		proposal.phases.aggregate.cost = proposal.phases.inception.cost + proposal.phases.proto.cost + proposal.phases.implementation.cost;
	});
}
var saveProposal = function (proposal) {
	return new Promise (function (resolve, reject) {
		setPhases (proposal)
		.then (function () {
			proposal.save(function (err, doc) {
				if (err) reject (err);
				else resolve (doc);
			});
		});
	});
};
exports.saveProposal = saveProposal;
var saveProposalRequest = function (req, res, proposal) {
	return saveProposal (proposal)
	.then (function () {
		res.json (proposal);
	})
	.catch (function (e) {
		res.status(422).send ({
			message: errorHandler.getErrorMessage(e)
		});
	});
};
// -------------------------------------------------------------------------
//
// remove a user from a proposal and save it
//
// -------------------------------------------------------------------------
exports.removeUserFromProposal = function (proposal, userid) {
	proposal.phases.implementation.team.pull (userid);
	proposal.phases.inception.team.pull (userid);
	proposal.phases.proto.team.pull (userid);
	return saveProposal (proposal);
}
/**
 * Create a Proposal
 */
// -------------------------------------------------------------------------
//
// create a new proposal. the user doing the creation will be set as the
// administrator
//
// -------------------------------------------------------------------------
exports.create = function(req, res) {
	var proposal = new Proposal(req.body);
	proposal.status = 'Draft';
	proposal.user = req.user;
	//
	// set the audit fields so we know who did what when
	//
	helpers.applyAudit (proposal, req.user);
	//
	// save and return
	//
	saveProposalRequest (req, res, proposal);
};

// -------------------------------------------------------------------------
//
// this just takes the already queried object and pass it back
//
// -------------------------------------------------------------------------
exports.read = function (req, res) {
	res.json (req.proposal);
};

// -------------------------------------------------------------------------
//
// update the document, make sure to apply audit. We don't mess with the
// code if they change the name as that would mean reworking all the roles
//
// -------------------------------------------------------------------------
exports.update = function (req, res) {
	//
	// copy over everything passed in. This will overwrite the
	// audit fields, but they get updated in the following step
	//
	// var proposal = _.assign (req.proposal, req.body);
	var proposal = _.mergeWith(req.proposal, req.body, (objValue, srcValue) => {
		if (_.isArray(objValue)) {
			return srcValue;
		}
	});
	//
	// set the audit fields so we know who did what when
	//
	helpers.applyAudit (proposal, req.user);
	//
	// save
	//
	saveProposalRequest (req, res, proposal);
};
// -------------------------------------------------------------------------
//
// Sets the specified proposal to 'Submitted' status
//
// -------------------------------------------------------------------------
exports.submit = function (req, res) {
	if (!ensureProposalOwner(req.proposal, req.user)) {
		return res.json ({ 'message': 'User is not authorized' });
	}
	req.body.status = 'Submitted';
	return exports.update (req, res);
};

// -------------------------------------------------------------------------
//
// Assigns the proposal to the given opportunity
//
// -------------------------------------------------------------------------
exports.assign = function (proposal, user) {
	return new Promise (function (resolve, reject) {
		proposal.status = 'Assigned';

		helpers.applyAudit (proposal, user);

		saveProposal (proposal)
		.then(function (p) {
			proposal = p;
			// return updateUserRole (proposal.user._id, proposal.opportunity.code);
		})
		.then(resolve, reject);
	});
};

exports.assignswu = function (req, res) {
	var proposal = req.proposal;
	proposal.status = 'Assigned';
	proposal.isAssigned = true;
	helpers.applyAudit (proposal, req.user);
	saveProposal (proposal)
	.then (function (updatedProposal) {
		Opportunities.assignswu (proposal.opportunity._id, proposal._id, proposal.user, req.user);
		return updatedProposal;
	})
	.then (function (updatedProposal) {
		res.json (updatedProposal);
	})
	.catch (function (e) {
		res.status(422).send ({ message: errorHandler.getErrorMessage(e) });
	});
};
// -------------------------------------------------------------------------
//
// unassign gets called from the opportunity side, so just do the work
// and return a promise
//
// -------------------------------------------------------------------------
exports.unassign = (proposal, user) => {
	return new Promise (function (resolve, reject) {
		proposal.status = 'Submitted';
		helpers.applyAudit (proposal, user);
		saveProposal (proposal)
		.then (function (p) {
			proposal = p;
		})
		.then (resolve, reject);
	});
};
// -------------------------------------------------------------------------
//
// delete the proposal
//
// -------------------------------------------------------------------------
exports.delete = function (req, res) {
	var proposal = req.proposal;
	proposal.remove(function (err) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(proposal);
		}
	});
};
exports.deleteForOrg = function (orgid) {
	return new Promise (function (resolve, reject) {
		Proposal.find ({org:orgid}, function (err, proposals) {
			if (err) reject (err);
			else {
				if (proposals) {
					Promise.all (proposals.map (function (proposal) {
						// return proposal.remove ();
						return Promise.resolve ();
					})).then (resolve, reject);
				}
				else resolve ();
			}
		});
	});
};
// -------------------------------------------------------------------------
//
// return a list of all proposals
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
	Proposal.find({}).sort('name')
	.populate('createdBy', 'displayName')
	.populate('updatedBy', 'displayName')
	.populate('opportunity')
	.populate('user', userfields)
	.exec(function (err, proposals) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(proposals);
		}
	});
};

// -------------------------------------------------------------------------
//
// given an opportunity and an organization, return all members that are
// qualified to be assigned to each phase in the proposal
//
// -------------------------------------------------------------------------
exports.getPotentialResources = function (req, res) {
	//
	// gather up all the bits and peices
	//
	var user        = req.user;
	var org         = req.org;
	var opportunity = req.opportunity;
	var allMembers  = _.uniq (org.members.concat (org.admins));

	//
	// if the user is not an admin of the org then bail out
	//
	if (user._id.toString () !== org.owner._id.toString() && org.admins.indexOf (user._id) === -1) {
		return res.status (422).send ({
			message: 'User is not authorized'
		});
	}
	//
	// select all the users and start sifting them into buckets that match their capabilities
	//
	var ret = {
		inception      : [],
		proto          : [],
		implementation : []
	};
	User.find ({
		_id: {$in: allMembers}
	})
	.select ('capabilities capabilitySkills _id displayName firstName lastName email username profileImageURL')
	.populate ('capabilities', 'code name labelClass')
	.populate ('capabilitySkills', 'code name labelClass')
	.exec (function (err, users) {
		var i;
		var j;
		var c;
		for (i = 0; i < users.length; i++) {
			var user = users[i].toObject ();
			user.iCapabilities = {};
			user.iCapabilitySkills = {};
			user.capabilities.forEach (function (c) {
				user.iCapabilities[c.code] = true;
			});
			user.capabilitySkills.forEach (function (c) {
				user.iCapabilitySkills[c.code] = true;
			});
			users[i] = user;
			for (j=0; j<opportunity.phases.inception.capabilities.length; j++) {
				c = opportunity.phases.inception.capabilities[j].code;
				if (user.iCapabilities[c]) {
					ret.inception.push (user);
					break;
				}
			}
			for (j=0; j<opportunity.phases.proto.capabilities.length; j++) {
				c = opportunity.phases.proto.capabilities[j].code;
				if (user.iCapabilities[c]) {
					ret.proto.push (user);
					break;
				}
			}
			for (j=0; j<opportunity.phases.implementation.capabilities.length; j++) {
				c = opportunity.phases.implementation.capabilities[j].code;
				if (user.iCapabilities[c]) {
					ret.implementation.push (user);
					break;
				}
			}
		};
		ret.all = users;
		res.json (ret);
	});
}

// -------------------------------------------------------------------------
//
// new empty proposal
//
// -------------------------------------------------------------------------
exports.new = function (req, res) {
	var p = new Proposal ();
	res.json(p);
};

// Get proposals for a given opportunity
exports.getProposalsForOpp = (req, res) => {
	if (!req.opportunity) {
		return res.status(422).send({
			message: 'Valid opportunity not provided'
		});
	}

	if (!ensureAdmin(req.opportunity, req.user, res)) {
		return res.json({ message: 'User is not authorized' });
	}

	Proposal.find({ opportunity: req.opportunity._id, $or: [{ status: 'Submitted' }, { status: 'Assigned' }] })
		.sort('created')
		.populate('createdBy', 'displayName')
		.populate('updatedBy', 'displayName')
		.populate('opportunity')
		.populate('phases.proto.team')
		.populate('phases.inception.team')
		.populate('phases.implementation.team')
		.populate('user')
		.populate({
			path: 'phases.proto.team',
			populate: { path: 'capabilities capabilitySkills' }
		})
		.populate({
			path: 'phases.inception.team',
			populate: { path: 'capabilities capabilitySkills' }
		})
		.populate({
			path: 'phases.implementation.team',
			populate: { path: 'capabilities capabilitySkills' }
		})
		.exec((err, proposals) => {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.json(proposals);
			}
		});
};

// -------------------------------------------------------------------------
//
// magic that populates the proposal on the request
//
// -------------------------------------------------------------------------
exports.proposalByID = function (req, res, next, id) {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).send({
			message: 'Proposal is invalid'
		});
	}

	Proposal.findById(id)
	.populate('createdBy', 'displayName')
	.populate('updatedBy', 'displayName')
	.populate('opportunity')
	.populate('user', userfields)
	.populate('phases.implementation.team', '_id displayName firstName lastName email username profileImageURL')
	.populate('phases.inception.team', '_id displayName firstName lastName email username profileImageURL')
	.populate('phases.proto.team', '_id displayName firstName lastName email username profileImageURL')
	.populate('phases.aggregate.team', '_id displayName firstName lastName email username profileImageURL')
	.exec(function (err, proposal) {
		if (err) {
			return next(err);
		} else if (!proposal) {
			return res.status(404).send({
				message: 'No proposal with that identifier has been found'
			});
		}
		req.proposal = proposal;
		next();
	});
};

var addAttachment = function (req, res, proposal, name, path, type) {
	proposal.attachments.push ({
		name : name,
		path : path,
		type : type
	});
	return saveProposalRequest (req, res, proposal);
}

// -------------------------------------------------------------------------
//
// Upload an attachment to a proposal
//
// -------------------------------------------------------------------------
exports.uploaddoc = function (req, res) {
	var proposal = req.proposal;
	var user     = req.user;
	var isAdmin  = user && !!~user.roles.indexOf ('admin');
	var isOwner  = user && (proposal.user._id.toString() === user._id.toString());
	if ( ! (isOwner || isAdmin)) return res.status(401).send({message: 'Not permitted'});

	if (proposal) {
		var storage = multer.diskStorage (config.uploads.diskStorage);
		var upload = multer({storage: storage}).single('file');
		var fileUploadFileFilter = require(path.resolve('./config/lib/multer')).fileUploadFileFilter;
		upload.fileFilter = fileUploadFileFilter;
		upload (req, res, function (uploadError) {
			if (uploadError) {
				res.status(422).send(uploadError);
			} else {
				var storedname = req.file.path ;
				var originalname = req.file.originalname;
				addAttachment (req, res, proposal, originalname, storedname, req.file.mimetype)
			}
		});
	}
	else {
		res.status(401).send({
			message: 'No proposal provided'
		});
	}
};

exports.removedoc = function (req, res) {
	var proposal = req.proposal;
	var user     = req.user;
	var isAdmin  = user && !!~user.roles.indexOf ('admin');
	var isOwner  = user && (proposal.user._id.toString() === user._id.toString());
	if ( ! (isOwner || isAdmin)) return res.status(401).send({message: 'Not permitted'});
	req.proposal.attachments.id(req.params.documentId).remove();
	saveProposalRequest (req, res, req.proposal);
};

exports.downloaddoc = function (req, res) {
	var proposal = req.proposal;
	var user     = req.user;
	var isAdmin  = user && !!~user.roles.indexOf ('admin');
	var isGov    = user && !!~user.roles.indexOf ('gov');
	var isOwner  = user && (proposal.user._id.toString() === user._id.toString());
	if ( ! (user && (isAdmin || isGov || isOwner))) return res.status(401).send({message: 'Not permitted'});
	var fileobj = req.proposal.attachments.id(req.params.documentId);
	return fileStream(res, fileobj.path, fileobj.name, fileobj.type);
};

