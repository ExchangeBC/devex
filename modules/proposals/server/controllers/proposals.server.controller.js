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
	User = mongoose.model('User'),
	Opportunity = mongoose.model('Opportunity'),
	errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
	helpers = require(path.resolve('./modules/core/server/controllers/core.server.helpers')),
	Opportunities = require(path.resolve('./modules/opportunities/server/controllers/opportunities.server.controller')),
	_ = require('lodash'),
	multer = require('multer'),
	config = require(path.resolve('./config/config')),
	Notifications = require(path.resolve('./modules/notifications/server/controllers/notifications.server.controller')),
	github = require(path.resolve('./modules/core/server/controllers/core.server.github'))
	;

var userfields = 'displayName firstName lastName email phone address username profileImageURL businessName businessAddress businessContactName businessContactPhone businessContactEmail roles provider';
var streamFile = function (res, file, name, mime) {
	// console.log ('stream file ',file, name, mime);
	var fs = require ('fs');
	fs.exists (file, function (yes) {
		if (!yes) {
			return res.status(404).send ({
				message: 'Not Found'
			});
		}
		else {
			res.setHeader ('Content-Type', mime);
			res.setHeader ('Content-Type', 'application/octet-stream');
			res.setHeader ('Content-Description', 'File Transfer');
			res.setHeader ('Content-Transfer-Encoding', 'binary');
			res.setHeader ('Content-Disposition', 'attachment; inline=false; filename="'+name+'"');
			fs.createReadStream (file).pipe (res);
		}
	});
};
// -------------------------------------------------------------------------
//
// set a proposal role on a user
//
// -------------------------------------------------------------------------
var adminRole = function (opportunity) {
	return opportunity.code+'-admin';
};
var memberRole = function (opportunity) {
	return opportunity.code;
};
var requestRole = function (opportunity) {
	return opportunity.code+'-request';
};
var ensureAdmin = function (opportunity, user, res) {
	if (!~user.roles.indexOf (adminRole(opportunity)) && !~user.roles.indexOf ('admin')) {
		// res.status(422).send({
		// 	message: 'User Not Authorized'
		// });
		return false;
	} else {
		// console.log ('Is admin');
		return true;
	}
};
var countStatus = function (id) {
	return new Promise (function (resolve, reject) {
		Proposal.aggregate ([
			{
				$match: {
					opportunity: id
				}
			},
			{
				$group: {
					_id: '$status',
					count: {$sum: 1}
				}
			}
		], function (err, result) {
			if (err) reject (err);
			else resolve (result);
		});
	});
};
// -------------------------------------------------------------------------
//
// stats
//
// -------------------------------------------------------------------------
exports.stats = function (req, res) {
	var op = req.opportunity;
	var ret = {
		following: 0
	};
	Notifications.countFollowingOpportunity (op.code)
	.then (function (result) {
		ret.following = result;
		return countStatus (op._id);
	})
	.then (function (result) {
		for (var i=0; i<result.length; i++) {
			ret[result[i]._id.toLowerCase()] = result[i].count;
		}
	})
	.then (function () {
		res.json (ret);
	})
	.catch (function (err) {
		res.status(422).send ({
			message: errorHandler.getErrorMessage(err)
		});
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
	.populate('user', userfields)
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
// -------------------------------------------------------------------------
//
// updatyes a proposal into submitted status
//
// -------------------------------------------------------------------------
exports.submit = function (req, res) {
	req.body.status = 'Submitted';
	return exports.update (req, res);
};
var updateUserRole = function (userid, oppcode) {
	return new Promise (function (resolve, reject) {
		User.findByIdAndUpdate (userid,
		    { '$push': { 'roles':  oppcode} },
		    { 'new': true, 'upsert': true },
		    function (err, m) {
		        if (err) reject (err);
		        else resolve (m);
		    }
		);
	});
};
var removeUserRole = function (userid, oppcode) {
	return new Promise (function (resolve, reject) {
		User.findByIdAndUpdate (userid,
		    { '$pop': { 'roles':  oppcode} },
		    { 'new': true, 'upsert': true },
		    function (err, m) {
		        if (err) reject (err);
		        else resolve (m);
		    }
		);
	});
};
// var updateOpportunityStatus = function (oppid, proposalid) {
// 	return Opportunities.assign (oppid, proposalid);
// 	// return new Promise (function (resolve, reject) {
// 	// 	Opportunity.findByIdAndUpdate (oppid,
// 	// 	    { '$set': { 'status':  'Assigned', 'proposal': proposalid} },
// 	// 	    function (err, m) {
// 	// 	        if (err) reject (err);
// 	// 	        else resolve (m);
// 	// 	    }
// 	// 	);
// 	// });
// };
// -------------------------------------------------------------------------
//
// assigns a proposal to the opportunity
//
// -------------------------------------------------------------------------
exports.assign = function (req, res) {
	// console.log ('assigning');
	var proposal = req.proposal;
	proposal.status = 'Assigned';
	helpers.applyAudit (proposal, req.user);
	saveProposal (proposal)
	.then (function (p) {
		// console.log ('saved now setting user as member', p);
		proposal = p;
		return updateUserRole (proposal.user._id, proposal.opportunity.code);
	})
	.then (function () {
		// console.log ('proposal', proposal);
		return Opportunities.assign (proposal.opportunity._id, proposal._id, proposal.user, req.user);
	})
	.then (function () {res.json (proposal); })
	.catch (function (e) {res.status(422).send ({ message: errorHandler.getErrorMessage(e) }); });
};
// -------------------------------------------------------------------------
//
// unassign gets called from the opportunity side, so jusy do the work
// and return a promise
//
// -------------------------------------------------------------------------
exports.unassign = function (proposal, user) {
	// console.log ('unassigning');
	return new Promise (function (resolve, reject) {
		proposal.status = 'Submitted';
		helpers.applyAudit (proposal, user);
		saveProposal (proposal)
		.then (function (p) {
			proposal = p;
			// return updateUserRole (proposal.user._id, proposal.opportunity.code);
			return removeUserRole (proposal.user._id, proposal.opportunity.code);
			// return Opportunities.assignMember (proposal.opportunity, proposal.user);
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

// -------------------------------------------------------------------------
//
// return a list of all proposals
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
	// var me = helpers.myStuff ((req.user && req.user.roles)? req.user.roles : null );
	// var search = me.isAdmin ? {} : {$or: [{isPublished:true}, {code: {$in: me.proposals.admin}}]}
	Proposal.find({}).sort('name')
	.populate('createdBy', 'displayName')
	.populate('updatedBy', 'displayName')
	.populate('opportunity', 'code name')
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
// get proposals under opportunity, but only submitted ones
//
// -------------------------------------------------------------------------
exports.forOpportunity = function (req, res) {
	if (!ensureAdmin (req.opportunity, req.user, res)) {
	// console.log ('NOT ALLOWED');
		return res.json ([]);
	}
	Proposal.find({opportunity:req.opportunity._id, status:'Submitted'}).sort('created')
	.populate('createdBy', 'displayName')
	.populate('updatedBy', 'displayName')
	.populate('opportunity', 'code name')
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
	.populate('opportunity', 'code name issueNumber github')
	.populate('user', userfields)
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
				var storedname = req.file.path ;
	// console.log ('req.file:', req.file);
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
exports.downloaddoc = function (req, res) {
	var fileobj = req.proposal.attachments.id(req.params.documentId);
	return streamFile (res, fileobj.path, fileobj.name, fileobj.type);
}
// -------------------------------------------------------------------------
//
// create the archive format and stream it back to the user
//
// -------------------------------------------------------------------------
exports.downloadArchive = function (req, res) {

}
