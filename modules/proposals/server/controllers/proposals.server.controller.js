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
var ensureAdmin = function (opportunity, user) {
	return !(!~user.roles.indexOf (adminRole(opportunity)) && !~user.roles.indexOf ('admin'));
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
	Proposal.findOne ({user:req.user._id, opportunity:req.opportunity._id})
	.populate('createdBy', 'displayName')
	.populate('updatedBy', 'displayName')
	.populate('opportunity')
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
	.then (function () { res.json (proposal); })
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
// -------------------------------------------------------------------------
//
// assigns a proposal to the opportunity
//
// -------------------------------------------------------------------------
exports.assign = function (req, res) {
	var proposal = req.proposal;
	proposal.status = 'Assigned';
	helpers.applyAudit (proposal, req.user);
	saveProposal (proposal)
	.then (function (p) {
		proposal = p;
		return updateUserRole (proposal.user._id, proposal.opportunity.code);
	})
	.then (function () {
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
	return new Promise (function (resolve, reject) {
		proposal.status = 'Submitted';
		helpers.applyAudit (proposal, user);
		saveProposal (proposal)
		.then (function (p) {
			proposal = p;
			return removeUserRole (proposal.user._id, proposal.opportunity.code);
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
// get proposals under opportunity, but only submitted ones
//
// -------------------------------------------------------------------------
exports.forOpportunity = function (req, res) {
	if (!ensureAdmin (req.opportunity, req.user)) {
		return res.json ([]);
	}
	Proposal.find({opportunity:req.opportunity._id, status:'Submitted'}).sort('created')
	.populate('createdBy', 'displayName')
	.populate('updatedBy', 'displayName')
	.populate('opportunity')
	.populate('team')
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
	.populate('opportunity')
	.populate('user', userfields)
	.populate('team')
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
	return streamFile (res, fileobj.path, fileobj.name, fileobj.type);
};
exports.downloadTerms = function (req, res) {
	var version = req.params.version;
	var fileobj = config.terms[version];
	var home = config.home;
	if (fileobj) return streamFile (res, home+'/'+fileobj.path, fileobj.name, fileobj.type);
	else res.status (401).send ({message: 'No terms file found'});
}
// -------------------------------------------------------------------------
//
// create the archive format and stream it back to the user
//
// -------------------------------------------------------------------------
exports.downloadArchive = function (req, res) {
	var zip = new (require ('jszip')) ();
	var fs  = require('fs');
	//
	// make sure we are allowed to do this at all
	//
	if (!ensureAdmin (req.opportunity, req.user)) {
		return res.json ([]);
	}
	//
	// make the zip name from the opportunity name
	//
	var opportunityName = req.opportunity.name.replace(/\W/g,'-').replace(/-+/,'-');
	var proponentName;
	var email;
	var files;
	var links;
	var proposalHtml;
	var header;
	var content;
	//
	// start the zip file;
	//
	zip.folder (opportunityName);
	//
	// get all submitted and assigned proposals
	//
	Proposal.find({opportunity:req.opportunity._id, status:{$in:['Submitted','Assigned']}}).sort('status created')
	.populate('user', userfields)
	.exec(function (err, proposals) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			proposals.forEach (function (proposal) {
				proponentName = proposal.user.displayName.replace(/\W/g,'-').replace(/-+/,'-');
				if (proposal.status === 'Assigned') proponentName += '-ASSIGNED';
				files = proposal.attachments;
				email = proposal.user.email;
				proposalHtml = proposal.detail;
				//
				// go through the files and build the internal links (reset links first)
				// also build the index.html content
				//
				links = [];
				files.forEach (function (file) {
					links.push ('<a href="docs/'+encodeURIComponent(file.name)+'" target="_blank">'+file.name+'</a>');
				});
				header = '<h2>Proponent</h2>'+proposal.user.displayName+'<br/>';
				header += email+'<br/>';
				if (!proposal.isCompany) {
					header += proposal.user.address+'<br/>';
					header += proposal.user.phone+'<br/>';
				}
				else {
					header += '<b><i>Company:</i></b>'+'<br/>';
					header += proposal.user.businessName+'<br/>';
					header += proposal.user.businessAddress+'<br/>';
					header += '<b><i>Contact:</i></b>'+'<br/>';
					header += proposal.user.businessContactName+'<br/>';
					header += proposal.user.businessContactPhone+'<br/>';
					header += proposal.user.businessContactEmail+'<br/>';
				}
				header += '<h2>Documents</h2><ul><li>'+links.join('</li><li>')+'</li></ul>';
				content = '<html><body>'+header+'<h2>Proposal</h2>'+proposalHtml+'</body></html>';
				//
				// add the directory, content and documents for this proposal
				//
				zip.folder (opportunityName).folder (proponentName);
				zip.folder (opportunityName).folder (proponentName).file ('index.html', content);
				files.forEach (function (file) {
					zip.folder (opportunityName).folder (proponentName).folder ('docs').file (file.name, fs.readFileSync (file.path), {binary:true});
				});
			});

			res.setHeader ('Content-Type', 'application/zip');
			res.setHeader ('Content-Type', 'application/octet-stream');
			res.setHeader ('Content-Description', 'File Transfer');
			res.setHeader ('Content-Transfer-Encoding', 'binary');
			res.setHeader ('Content-Disposition', 'attachment; inline=false; filename="'+opportunityName+'.zip'+'"');

			zip.generateNodeStream({base64:false, compression:'DEFLATE',streamFiles:true}).pipe (res);
		}
	});

};
