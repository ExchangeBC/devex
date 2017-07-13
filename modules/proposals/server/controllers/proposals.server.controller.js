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
var path = require('path'),
	mongoose = require('mongoose'),
	Proposal = mongoose.model('Proposal'),
	errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
	helpers = require(path.resolve('./modules/core/server/controllers/core.server.helpers')),
	Opportunities = require(path.resolve('./modules/opportunities/server/controllers/opportunities.server.controller')),
	_ = require('lodash'),
	multer = require('multer'),
	config = require(path.resolve('./config/config')),
	Notifications = require(path.resolve('./modules/notifications/server/controllers/notifications.server.controller'))
	;

// -------------------------------------------------------------------------
//
// set a proposal role on a user
//
// -------------------------------------------------------------------------
var adminRole = function (proposal) {
	return proposal.code+'-admin';
};
var memberRole = function (proposal) {
	return proposal.code;
};
var requestRole = function (proposal) {
	return proposal.code+'-request';
};
var setProposalMember = function (proposal, user) {
	user.addRoles ([memberRole(proposal)]);
};
var setProposalAdmin = function (proposal, user) {
	user.addRoles ([memberRole(proposal), adminRole(proposal)]);
};
var setProposalRequest = function (proposal, user) {
	user.addRoles ([requestRole(proposal)]);
};
var unsetProposalMember = function (proposal, user) {
	user.removeRoles ([memberRole(proposal)]);
};
var unsetProposalAdmin = function (proposal, user) {
	user.removeRoles ([memberRole(proposal), adminRole(proposal)]);
};
var unsetProposalRequest = function (proposal, user) {
	// console.log ('remove role ', requestRole(proposal));
	user.removeRoles ([requestRole(proposal)]);
};
var ensureAdmin = function (proposal, user, res) {
	if (!~user.roles.indexOf (adminRole(proposal)) && !~user.roles.indexOf ('admin')) {
		// console.log ('NOT admin');
		res.status(422).send({
			message: 'User Not Authorized'
		});
		return false;
	} else {
		// console.log ('Is admin');
		return true;
	}
};
var forOpportunity = function (id) {
	return new Promise (function (resolve, reject) {
		Proposal.find ({opportunity:id}).exec ().then (resolve, reject);
	});
};
var searchTerm = function (req, opts) {
	opts = opts || {};
	var me = helpers.myStuff ((req.user && req.user.roles)? req.user.roles : null );
	if (!me.isAdmin) {
		opts['$or'] = [{isPublished:true}, {code: {$in: me.proposals.admin}}];
	}
	// console.log ('me = ', me);
	// console.log ('opts = ', opts);
	return opts;
};
// -------------------------------------------------------------------------
//
// this takes a proposal model, serializes it, and decorates it with what
// relationship the user has to the proposal, and returns the JSON
//
// -------------------------------------------------------------------------
var decorate = function (proposalModel, roles) {
	var proposal = proposalModel ? proposalModel.toJSON () : {};
	proposal.userIs = {
		admin   : !!~roles.indexOf (adminRole(proposal)),
		member  : !!~roles.indexOf (memberRole(proposal)),
		request : !!~roles.indexOf (requestRole(proposal)),
		gov     : !!~roles.indexOf ('gov')
	};
	return proposal;
};
// -------------------------------------------------------------------------
//
// decorate an entire list of proposals
//
// -------------------------------------------------------------------------
var decorateList = function (proposalModels, roles) {
	return proposalModels.map (function (proposalModel) {
		return decorate (proposalModel, roles);
	});
};
// -------------------------------------------------------------------------
//
// get a list of all my proposals, but only ones I have access to as a normal
// member or admin, just not as request
//
// -------------------------------------------------------------------------
exports.my = function (req, res) {
	var me = helpers.myStuff ((req.user && req.user.roles)? req.user.roles : null );
	var search = me.isAdmin ? {} : { code: { $in: me.proposals.member } };
	Proposal.find (search)
	.select ('code name short')
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
exports.myopp = function (req, res) {
	if (!req.user) return res.json ({});
	// var me = helpers.myStuff ((req.user && req.user.roles)? req.user.roles : null );
	// var search = me.isAdmin ? {} : { code: { $in: me.proposals.admin } };
	Proposal.findOne ({user:req.user._id, opportunity:req.opportunity._id})
	.populate('createdBy', 'displayName')
	.populate('updatedBy', 'displayName')
	.populate('opportunity', 'code name')
	.populate('user', 'displayName email phone address username')
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
// -------------------------------------------------------------------------
//
// return a list of all proposal members. this means all members NOT
// including users who have requested access and are currently waiting
//
// -------------------------------------------------------------------------
exports.members = function (proposal, cb) {
	mongoose.model ('User').find ({roles: memberRole(proposal)}).select ('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle').exec (cb);
};

// -------------------------------------------------------------------------
//
// return a list of all users who are currently waiting to be added to the
// proposal member list
//
// -------------------------------------------------------------------------
exports.requests = function (proposal, cb) {
	mongoose.model ('User').find ({roles: requestRole(proposal)}).select ('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle').exec (cb);
};

var saveProposal = function (proposal) {
	return new Promise (function (resolve, reject) {
		proposal.save(function (err, doc) {
			if (err) reject (err);
			else resolve (doc);
		});
	});
};
var saveProposalRequest = function (req, res, proposal) {
	return saveProposal (proposal)
	.then (function (p) { res.json (proposal); })
	.catch (function (e) { res.status(422).send ({ message: errorHandler.getErrorMessage(e) }); });
};
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
	proposal.user = req.user._id;
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
	var proposal = _.assign (req.proposal, req.body);
	//
	// set the audit fields so we know who did what when
	//
	helpers.applyAudit (proposal, req.user);
	//
	// save
	//
	saveProposalRequest (req, res, proposal);
};
exports.submit = function (req, res) {
	req.body.status = 'Submitted';
	return exports.update (req, res);
}
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

// -------------------------------------------------------------------------
//
// return a list of all proposals
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
	// var me = helpers.myStuff ((req.user && req.user.roles)? req.user.roles : null );
	// var search = me.isAdmin ? {} : {$or: [{isPublished:true}, {code: {$in: me.proposals.admin}}]}
	Proposal.find(searchTerm (req)).sort('name')
	.populate('createdBy', 'displayName')
	.populate('updatedBy', 'displayName')
	.populate('opportunity', 'code name')
	.populate('user', 'displayName email phone address username')
	.exec(function (err, proposals) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (decorateList (proposals, req.user ? req.user.roles : []));
			// res.json(proposals);
		}
	});
};

// -------------------------------------------------------------------------
//
// this is the service front to the members call
//
// -------------------------------------------------------------------------
exports.listMembers = function (req, res) {
	exports.members (req.proposal, function (err, users) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (users);
		}
	});
};

// -------------------------------------------------------------------------
//
// this is the service front to the members call
//
// -------------------------------------------------------------------------
exports.listRequests = function (req, res) {
	exports.requests (req.proposal, function (err, users) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (users);
		}
	});
};

// -------------------------------------------------------------------------
//
// have the current user request access
//
// -------------------------------------------------------------------------
exports.request = function (req, res) {
	setProposalRequest (req.proposal, req.user);
	req.user.save ();
	res.json ({ok:true});
}

// -------------------------------------------------------------------------
//
// deal with members
//
// -------------------------------------------------------------------------
exports.confirmMember = function (req, res) {
	var user = req.model;
	// console.log ('++++ confirm member ', user.username, user._id);
	unsetProposalRequest (req.proposal, user);
	setProposalMember (req.proposal, user);
	user.save (function (err, result) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			// console.log ('---- member roles ', result.roles);
			res.json (result);
		}
	});
};
exports.denyMember = function (req, res) {
	var user = req.model;
	// console.log ('++++ deny member ', user.username, user._id);
	unsetProposalRequest (req.proposal, user);
	unsetProposalMember (req.proposal, user);
	user.save (function (err, result) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			// console.log ('---- member roles ', result.roles);
			res.json (result);
		}
	});
};

// -------------------------------------------------------------------------
//
// get proposals under opportunity
//
// -------------------------------------------------------------------------
exports.forOpportunity = function (req, res) {
	Proposal.find(searchTerm (req, {opportunity:req.opportunity._id})).sort('name')
	.populate('createdBy', 'displayName')
	.populate('updatedBy', 'displayName')
	.populate('opportunity', 'code name')
	.populate('user', 'displayName email phone address username')
	.exec(function (err, proposals) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (decorateList (proposals, req.user ? req.user.roles : []));
			// res.json(proposals);
		}
	});
};

// -------------------------------------------------------------------------
//
// new empty proposal
//
// -------------------------------------------------------------------------
exports.new = function (req, res) {
	// console.log ('get a new proposal set up and return it');
	var p = new Proposal ();
	res.json(p);
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
	.populate('opportunity', 'code name')
	.populate('user', 'displayName email phone address username')
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

// -------------------------------------------------------------------------
//
// publish or unpublish whole sets of proposals by opportunity id
//
// -------------------------------------------------------------------------
exports.rePublishProposals = function (programId) {
	return forOpportunity (programId)
	.then (function (proposals) {
		return Promise.all (proposals.map (function (proposal) {
			proposal.isPublished = proposal.wasPublished;
			return proposal.save ();
		}));
	});
};
exports.unPublishProposals = function (programId) {
	return forOpportunity (programId)
	.then (function (proposals) {
		return Promise.all (proposals.map (function (proposal) {
			proposal.wasPublished = proposal.isPublished;
			proposal.isPublished = false;
			return proposal.save ();
		}));
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
// uploda an attachment to a proposal
//
// -------------------------------------------------------------------------
exports.uploaddoc = function (req, res) {
	var proposal = req.proposal;
	if (proposal) {
		var storage = multer.diskStorage (config.uploads.diskStorage);
		var upload = multer({storage: storage}).single('file');
		var fileUploadFileFilter = require(path.resolve('./config/lib/multer')).fileUploadFileFilter;
		upload.fileFilter = fileUploadFileFilter;
		upload (req, res, function (uploadError) {
			if (uploadError) {
				res.status(422).send(uploadError);
			} else {
				var storedname = config.uploads.fileUpload.dest ;
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
	req.proposal.attachments.id(req.params.documentId).remove();
	saveProposalRequest (req, res, req.proposal);
};
