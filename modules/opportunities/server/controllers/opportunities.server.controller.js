'use strict';
/*

Notes about opportunities

Roles:
------
Membership in a opportunity is defined by the user having various roles attached to their
user record. There are only three possible states: admin, member, or request.
When a user requests membership they get the request role only, once accepted that
simply gets changed to the member role. Roles are simply the opportunity code with suffixes.

member  : <code>
admin   : <code>-admin
request : <code>-request

*/

/**
 * Module dependencies.
 */
var path = require('path'),
	mongoose = require('mongoose'),
	Opportunity = mongoose.model('Opportunity'),
	Proposal = mongoose.model('Proposal'),
	errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
	helpers = require(path.resolve('./modules/core/server/controllers/core.server.helpers')),
	_ = require('lodash'),
	sendMessages = require(path.resolve('./modules/messages/server/controllers/messages.controller')).sendMessages,
	Proposals = require(path.resolve('./modules/proposals/server/controllers/proposals.server.controller')),
	github = require(path.resolve('./modules/core/server/controllers/core.server.github')),
	Nexmo = require('nexmo');

// -------------------------------------------------------------------------
//
// set a opportunity role on a user
//
// -------------------------------------------------------------------------
var adminRole = function(opportunity) {
	return opportunity.code + '-admin';
};
var memberRole = function(opportunity) {
	return opportunity.code;
};
var requestRole = function(opportunity) {
	return opportunity.code + '-request';
};
var setOpportunityMember = function(opportunity, user) {
	user.addRoles([memberRole(opportunity)]);
};
var setOpportunityAdmin = function(opportunity, user) {
	user.addRoles([memberRole(opportunity), adminRole(opportunity)]);
};
var setOpportunityRequest = function(opportunity, user) {
	user.addRoles([requestRole(opportunity)]);
};
var unsetOpportunityMember = function(opportunity, user) {
	user.removeRoles([memberRole(opportunity)]);
};
var unsetOpportunityAdmin = function(opportunity, user) {
	user.removeRoles([memberRole(opportunity), adminRole(opportunity)]);
};
var unsetOpportunityRequest = function(opportunity, user) {
	user.removeRoles([requestRole(opportunity)]);
};
var ensureAdmin = function(opportunity, user, res) {
	if (!~user.roles.indexOf(adminRole(opportunity)) && !~user.roles.indexOf('admin')) {
		res.status(422).send({
			message: 'User Not Authorized'
		});
		return false;
	} else {
		return true;
	}
};
var searchTerm = function(req, opts) {
	opts = opts || {};
	var me = helpers.myStuff(req.user && req.user.roles ? req.user.roles : null);
	if (!me.isAdmin) {
		opts['$or'] = [{ isPublished: true }, { code: { $in: me.opportunities.admin } }];
	}
	return opts;
};
// -------------------------------------------------------------------------
//
// this takes a opportunity model, serializes it, and decorates it with what
// relationship the user has to the opportunity, and returns the JSON
//
// -------------------------------------------------------------------------
var decorate = function(opportunityModel, roles) {
	var opportunity = opportunityModel ? opportunityModel.toJSON() : {};
	opportunity.userIs = {
		admin: !!~roles.indexOf(adminRole(opportunity)),
		member: !!~roles.indexOf(memberRole(opportunity)),
		request: !!~roles.indexOf(requestRole(opportunity)),
		gov: !!~roles.indexOf('gov')
	};
	return opportunity;
};
// -------------------------------------------------------------------------
//
// decorate an entire list of opportunities
//
// -------------------------------------------------------------------------
var decorateList = function(opportunityModels, roles) {
	return opportunityModels.map(function(opportunityModel) {
		return decorate(opportunityModel, roles);
	});
};
var opplist = function(query, req, callback) {
	Opportunity.find(query)
		.sort([['deadline', -1], ['name', 1]])
		.populate('createdBy', 'displayName')
		.populate('updatedBy', 'displayName')
		.populate('project', 'code name _id isPublished')
		.populate('program', 'code title _id logo isPublished')
		.populate('phases.implementation.capabilities', 'code name')
		.populate('phases.implementation.capabilitiesCore', 'code name')
		.populate('phases.implementation.capabilitySkills', 'code name')
		.populate('phases.inception.capabilities', 'code name')
		.populate('phases.inception.capabilitiesCore', 'code name')
		.populate('phases.inception.capabilitySkills', 'code name')
		.populate('phases.proto.capabilities', 'code name')
		.populate('phases.proto.capabilitiesCore', 'code name')
		.populate('phases.proto.capabilitySkills', 'code name')
		.populate('phases.aggregate.capabilities', 'code name')
		.populate('phases.aggregate.capabilitiesCore', 'code name')
		.populate('phases.aggregate.capabilitySkills', 'code name')
		.exec(function(err, opportunities) {
			if (err) {
				callback(err, null);
			} else {
				callback(null, decorateList(opportunities, req.user ? req.user.roles : []));
			}
		});
};
var forProgram = function(id) {
	return new Promise(function(resolve, reject) {
		Opportunity.find({ program: id })
			.exec()
			.then(resolve, reject);
	});
};
var forProject = function(id) {
	return new Promise(function(resolve, reject) {
		Opportunity.find({ project: id })
			.exec()
			.then(resolve, reject);
	});
};
// -------------------------------------------------------------------------
//
// increment the number of views of an opportunity
//
// -------------------------------------------------------------------------
var incrementViews = function(id) {
	Opportunity.update({ _id: id }, { $inc: { views: 1 } }).exec();
};
// -------------------------------------------------------------------------
//
// all the info we need for notification merging
//
// -------------------------------------------------------------------------
var setNotificationData = function(opportunity) {
	return {
		name: opportunity.name,
		short: opportunity.short,
		description: opportunity.description,
		earn_format_mnoney: helpers.formatMoney(opportunity.opportunityTypeCd === 'sprint-with-us' ? opportunity.phases.aggregate.target : opportunity.earn, 2),
		earn: helpers.formatMoney(opportunity.opportunityTypeCd === 'sprint-with-us' ? opportunity.phases.aggregate.target : opportunity.earn, 2),
		dateDeadline: helpers.formatDate(new Date(opportunity.deadline)),
		timeDeadline: helpers.formatTime(new Date(opportunity.deadline)),
		dateAssignment: helpers.formatDate(new Date(opportunity.assignment)),
		dateStart: helpers.formatDate(new Date(opportunity.start)),
		datePublished: helpers.formatDate(new Date(opportunity.lastPublished)),
		deadline_format_date: helpers.formatDate(new Date(opportunity.deadline)),
		deadline_format_time: helpers.formatTime(new Date(opportunity.deadline)),
		updatenotification: 'not-update-' + opportunity.code,
		code: opportunity.code,
		opptype: opportunity.opportunityTypeCd === 'sprint-with-us' ? 'swu' : 'cwu',
		skills: opportunity.skills.join(', ')
	};
};
var setMessageData = function(opportunity) {
	opportunity.path = '/opportunities/' + (opportunity.opportunityTypeCd === 'sprint-with-us' ? 'swu' : 'cwu') + '/' + opportunity.code;
	opportunity.earn_format_mnoney = helpers.formatMoney(opportunity.opportunityTypeCd === 'sprint-with-us' ? opportunity.phases.aggregate.target : opportunity.earn, 2);
	opportunity.earn = opportunity.opportunityTypeCd === 'sprint-with-us' ? opportunity.phases.aggregate.target : opportunity.earn;
	opportunity.dateDeadline = helpers.formatDate(new Date(opportunity.deadline));
	opportunity.timeDeadline = helpers.formatTime(new Date(opportunity.deadline));
	opportunity.dateAssignment = helpers.formatDate(new Date(opportunity.assignment));
	opportunity.dateStart = helpers.formatDate(new Date(opportunity.start));
	opportunity.datePublished = helpers.formatDate(new Date(opportunity.lastPublished));
	opportunity.deadline_format_date = helpers.formatDate(new Date(opportunity.deadline));
	opportunity.deadline_format_time = helpers.formatTime(new Date(opportunity.deadline));

	opportunity.contract.estimatedValue_formatted = helpers.formatMoney(opportunity.contract.estimatedValue);
	opportunity.contract.stobExpenditures_formatted = helpers.formatMoney(opportunity.contract.stobExpenditures);
	opportunity.contract.stobBudget_formatted = helpers.formatMoney(opportunity.contract.stobBudget);
	opportunity.contract.contractType_formatted = opportunity.contract.contractType.charAt(0).toUpperCase() + opportunity.contract.contractType.slice(1);
	opportunity.contract.legallyRequired_formatted = opportunity.contract.legallyRequired ? 'Yes' : 'No';
	opportunity.intermediateApproval.actioned_formatted = helpers.formatDate(new Date(opportunity.intermediateApproval.actioned));

	return opportunity;
};
// -------------------------------------------------------------------------
//
// get a list of all my opportunities, but only ones I have access to as a normal
// member or admin, just not as request
//
// -------------------------------------------------------------------------
exports.my = function(req, res) {
	Opportunity.find(searchTerm(req))
		.select('code name short')
		.exec(function(err, opportunities) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.json(opportunities);
			}
		});
};
// -------------------------------------------------------------------------
//
// return a list of all opportunity members. this means all members NOT
// including users who have requested access and are currently waiting
//
// -------------------------------------------------------------------------
exports.members = function(opportunity, cb) {
	mongoose
		.model('User')
		.find({ roles: memberRole(opportunity) })
		.select('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle')
		.exec(cb);
};

// -------------------------------------------------------------------------
//
// return a list of all users who are currently waiting to be added to the
// opportunity member list
//
// -------------------------------------------------------------------------
exports.requests = function(opportunity, cb) {
	mongoose
		.model('User')
		.find({ roles: requestRole(opportunity) })
		.select('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle')
		.exec(cb);
};

var oppBody = function(opp) {
	var dt = opp.deadline;
	var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	var deadline = dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
	dt = opp.assignment;
	var assignment = dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
	dt = opp.start;
	var start = dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
	var earn = helpers.formatMoney(opp.earn, 2);
	var locs = {
		offsite: 'In-person work NOT required',
		onsite: 'In-person work required',
		mixed: 'Some in-person work required'
	};
	var opptype = 'cwu';
	if (opp.opportunityTypeCd === 'sprint-with-us') {
		opptype = 'swu';
		earn = helpers.formatMoney(opp.phases.aggregate.target, 2);
	}
	var ret = '';

	ret +=
		'<p>This issue has been auto-generated to facilitate questions about <a href="https://bcdevexchange.org/opportunities/' +
		opptype +
		'/' +
		opp.code +
		'">a paid opportunity</a> that has just been posted on the <a href="https://bcdevexchange.org">BCDevExchange</a>.</p>';
	ret +=
		'<p>To learn more or apply, <a href="https://bcdevexchange.org/opportunities/' +
		opptype +
		'/' +
		opp.code +
		'">visit the opportunity page</a>. The opportunity closes on <b>' +
		deadline +
		'</b>.</p>';
	return ret;
};
// -------------------------------------------------------------------------
//
// set up internal aggregate states for phase information
//
// -------------------------------------------------------------------------
var setPhases = function(opportunity) {
	//
	// only for sprint with us
	//
	if (opportunity.opportunityTypeCd !== 'sprint-with-us') return;
	var imp = opportunity.phases.implementation;
	var inp = opportunity.phases.inception;
	var prp = opportunity.phases.proto;
	var agg = opportunity.phases.aggregate;
	//
	// for sprint with us opportunities we may have arrays of phase capabilities
	// we need to copy those into the aggregate view, simplest using a little pivot
	//
	var capabilities = imp.capabilities.concat(inp.capabilities, prp.capabilities);
	var capabilitiesCore = imp.capabilitiesCore.concat(inp.capabilitiesCore, prp.capabilitiesCore);
	var capabilitySkills = imp.capabilitySkills.concat(inp.capabilitySkills, prp.capabilitySkills);

	agg.capabilities = capabilities;
	agg.capabilitiesCore = capabilitiesCore;
	agg.capabilitySkills = capabilitySkills;
	//
	// total up the targets
	//
	imp.target = helpers.numericOrZero(imp.target);
	inp.target = helpers.numericOrZero(inp.target);
	prp.target = helpers.numericOrZero(prp.target);
	agg.target = imp.target + inp.target + prp.target;
	//
	// if the budget was set it takes priority over the total targets
	//
	if (opportunity.budget && opportunity.budget > 0) agg.target = opportunity.budget;
	//
	// get the earliest and latest date
	//
	agg.startDate = [imp.startDate, inp.startDate, prp.startDate].sort()[0];
	agg.endDate = [imp.endDate, inp.endDate, prp.endDate].sort()[2];
};
/**
 * Create a Opportunity
 */
// -------------------------------------------------------------------------
//
// create a new opportunity. the user doing the creation will be set as the
// administrator
//
// -------------------------------------------------------------------------
exports.create = function(req, res) {
	var opportunity = new Opportunity(req.body);
	//
	// set the code, this is used setting roles and other stuff
	//
	Opportunity.findUniqueCode(opportunity.name, null, function(newcode) {
		opportunity.code = newcode;
		//
		// set the audit fields so we know who did what when
		//
		helpers.applyAudit(opportunity, req.user);
		//
		// update phase information
		//
		setPhases(opportunity);
		//
		// save and return
		//
		opportunity.save(function(err) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				setOpportunityAdmin(opportunity, req.user);
				req.user.save();
				res.json(opportunity);
			}
		});
	});
};

// -------------------------------------------------------------------------
//
// this just takes the already queried object and pass it back
//
// -------------------------------------------------------------------------
exports.read = function(req, res) {
	res.json(decorate(req.opportunity, req.user ? req.user.roles : []));
	incrementViews(req.opportunity._id);
};

var updateSave = function(opportunity) {
	return new Promise(function(resolve, reject) {
		opportunity.save(function(err, updatedOpportunity) {
			if (err) {
				reject(err);
			} else {
				resolve(updatedOpportunity);
			}
		});
	});
};
// -------------------------------------------------------------------------
//
// update the document, make sure to apply audit. We don't mess with the
// code if they change the name as that would mean reworking all the roles
//
// CC: remove the doNotNotify confusion
//
// -------------------------------------------------------------------------
exports.update = function(req, res) {
	//
	// if we dont have permission to do this just return as a no-op
	//
	if (!ensureAdmin(req.opportunity, req.user, res)) {
		return res.json(decorate(req.opportunity, req.user ? req.user.roles : []));
	}
	//
	// copy over everything passed in. This will overwrite the
	// audit fields, but they get updated in the following step
	//
	// We use lodash mergeWith and a customizer to handle arrays.  By default lodash merge will concatenate arrays, which means that
	// items can never be removed.  The customizer defaults to also use the incoming array.
	// see https://lodash.com/docs/4.17.10#mergeWith
	var opportunity = _.mergeWith(req.opportunity, req.body, (objValue, srcValue) => {
		if (_.isArray(objValue)) {
			return srcValue;
		}
	});

	// manually transfer over skills, as the merge won't handle removals properly from the skills array
	// opportunity.skills = req.body.skills;
	//
	// set the audit fields so we know who did what when
	//
	helpers.applyAudit(opportunity, req.user);
	//
	// update phase information
	//
	setPhases(opportunity);
	//
	// save
	//
	updateSave(opportunity)
		.then(function() {
			// send out approval request messages as needed
			if (!opportunity.isApproved) {
				sendApprovalMessages(req.user, opportunity);
			}

			// send out opportunity update notifications on published opportunities that are still open
			if (opportunity.isPublished && opportunity.deadline - new Date() > 0) {
				sendMessages('opportunity-update', opportunity.watchers, { opportunity: setMessageData(opportunity) });
				github
					.createOrUpdateIssue({
						title: opportunity.name,
						body: oppBody(opportunity),
						repo: opportunity.github,
						number: opportunity.issueNumber
					})
					.then(function(result) {
						opportunity.issueUrl = result.html_url;
						opportunity.issueNumber = result.number;
						updateSave(opportunity).then(function(updatedOpportunity) {
							opportunity = updatedOpportunity;
							res.json(decorate(opportunity, req.user ? req.user.roles : []));
						});
					})
					.catch(function() {
						res.status(422).send({
							message: 'Opportunity saved, but there was an error updating the github issue. Please check your repo url and try again.'
						});
					});
			} else res.json(decorate(opportunity, req.user ? req.user.roles : []));
		})
		.catch(function(err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		});
};
// -------------------------------------------------------------------------
//
// get a list of all users who are listening to the add opp event
//
// -------------------------------------------------------------------------
var getSubscribedUsers = function() {
	return new Promise(function(resolve, reject) {
		var User = mongoose.model('User');
		User.find({ notifyOpportunities: true }, '_id email firstName lastName displayName').exec(function(err, users) {
			if (err) reject(err);
			else resolve(users);
		});
	});
};
// -------------------------------------------------------------------------
//
// publish or unpublish
//
// -------------------------------------------------------------------------
var pub = function(req, res, isToBePublished) {
	var opportunity = req.opportunity;
	//
	// if no change or we dont have permission to do this just return as a no-op
	//
	if (req.opportunity.isPublished === isToBePublished || !ensureAdmin(req.opportunity, req.user, res)) {
		return res.json(decorate(req.opportunity, req.user ? req.user.roles : []));
	}
	//
	// determine first time or not
	//
	var firstTime = isToBePublished && !opportunity.wasPublished;
	//
	// set the correct new state and set the publish date if being published
	//
	opportunity.isPublished = isToBePublished;
	if (isToBePublished) {
		opportunity.lastPublished = new Date();
		opportunity.wasPublished = true;
	}

	//
	// save and notify
	//
	updateSave(opportunity)
		.then(function() {
			var data = setNotificationData(opportunity);
			if (firstTime) {
				getSubscribedUsers().then(function(users) {
					var messageCode = opportunity.opportunityTypeCd === 'code-with-us' ? 'opportunity-add-cwu' : 'opportunity-add-swu';
					sendMessages(messageCode, users, { opportunity: setMessageData(opportunity) });
				});
			} else if (isToBePublished) {
				sendMessages('opportunity-update', opportunity.watchers, { opportunity: setMessageData(opportunity) });
			}
			github
				.createOrUpdateIssue({
					title: opportunity.name,
					body: oppBody(opportunity),
					repo: opportunity.github,
					number: opportunity.issueNumber
				})
				.then(function(result) {
					opportunity.issueUrl = result.html_url;
					opportunity.issueNumber = result.number;
					opportunity.save();
					res.json(decorate(opportunity, req.user ? req.user.roles : []));
				})
				.catch(function() {
					res.status(422).send({
						message: 'Opportunity saved, but there was an error creating the github issue. Please check your repo url and try again.'
					});
				});
			// res.json (decorate (opportunity, req.user ? req.user.roles : []));
		})
		.catch(function(err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		});
	// res.json (decorate (opportunity, req.user ? req.user.roles : []));
};

var countStatus = function(id) {
	return new Promise(function(resolve, reject) {
		var cursor = Proposal.aggregate([
			{
				$match: {
					opportunity: id
				}
			},
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 }
				}
			}
		])
			.cursor()
			.exec();

		resolve(cursor);
	});
};

exports.publish = function(req, res) {
	return pub(req, res, true);
};
exports.unpublish = function(req, res) {
	return pub(req, res, false);
};

// -------------------------------------------------------------------------
//
// unasasign the assigned proposal
//
// -------------------------------------------------------------------------
exports.unassign = function(req, res) {
	var opportunity;
	//
	// unassign the proposal
	//
	Proposals.unassign(req.opportunity.proposal, req.user)
		//
		// update the opportunity into pending status with no proposal
		//
		.then(function() {
			req.opportunity.status = 'Pending';
			req.opportunity.proposal = null;
			return updateSave(req.opportunity);
		})
		//
		// notify of changes
		// update the issue on github
		//
		.then(function(opp) {
			opportunity = opp;
			sendMessages('opportunity-update', opportunity.watchers, { opportunity: setMessageData(opportunity) });
			return github
				.unlockIssue({
					repo: opportunity.github,
					number: opportunity.issueNumber
				})
				.then(function() {
					return github.addCommentToIssue({
						comment: 'This opportunity has been un-assigned',
						repo: opportunity.github,
						number: opportunity.issueNumber
					});
				});
		})
		//
		// return the new opportunity or fail
		//
		.then(function() {
			res.json(decorate(opportunity, req.user ? req.user.roles : []));
		})
		.catch(function(err) {
			res.status(422).send({ message: errorHandler.getErrorMessage(err) });
		});
};

// -------------------------------------------------------------------------
//
// Get proposals for a given opportunity
//
// -------------------------------------------------------------------------
exports.getProposals = function(req, res) {
	if (!req.opportunity) {
		return res.status(422).send({
			message: 'Valid opportunity not provided'
		});
	}

	if (!ensureAdmin(req.opportunity, req.user)) {
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
		.exec(function(err, proposals) {
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
// Get proposal statistics for the given opportunity in the request
//
// -------------------------------------------------------------------------
exports.getProposalStats = (req, res) => {
	if (!req.opportunity) {
		return res.status(422).send({
			message: 'Valid opportunity not provided'
		});
	}

	if (!ensureAdmin(req.opportunity, req.user)) {
		return res.json({ message: 'User is not authorized' });
	}

	var op = req.opportunity;
	var ret = {
		following: 0
	};

	Promise.resolve()
		.then(() => {
			if (op.watchers) {
				ret.following = op.watchers.length;
			}
			ret.submitted = 0;
			ret.draft = 0;
			return countStatus(op._id);
		})
		.then(result => {
			result
				.eachAsync(function(doc) {
					ret[doc._id.toLowerCase()] = doc.count;
				})
				.then(function() {
					res.json(ret);
				});
		})
		.catch(err => {
			res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		});
};

// -------------------------------------------------------------------------
//
// Create an archive of all proposals for the given opportunity in the request
//
// -------------------------------------------------------------------------
exports.getProposalArchive = (req, res) => {
	const zip = new (require('jszip'))();
	const fs = require('fs');

	// Make sure user has admin access
	if (!ensureAdmin(req.opportunity, req.user)) {
		return res.json([]);
	}

	// Make a zip archive with the opportunity name
	var opportunityName = req.opportunity.name.replace(/\W/g, '-').replace(/-+/, '-');
	var proponentName;
	var email;
	var files;
	var links;
	var proposalHtml;
	var header;
	var content;

	// Create the zip file;
	zip.folder(opportunityName);

	// Get all submitted and assigned proposals
	Proposal.find({ opportunity: req.opportunity._id, status: { $in: ['Submitted', 'Assigned'] } })
		.sort('status created')
		.populate('user')
		.populate('opportunity', 'opportunityTypeCd name code')
		.exec(function(err, proposals) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				proposals.forEach(function(proposal) {
					proponentName = proposal.user.displayName.replace(/\W/g, '-').replace(/-+/, '-');
					if (proposal.status === 'Assigned') proponentName += '-ASSIGNED';
					files = proposal.attachments;
					email = proposal.user.email;
					proposalHtml = proposal.detail;

					// Go through the files and build the internal links (reset links first)
					// also build the index.html content
					links = [];
					files.forEach(function(file) {
						links.push('<a href="docs/' + encodeURIComponent(file.name) + '" target="_blank">' + file.name + '</a>');
					});
					header = '<h2>Proponent</h2>' + proposal.user.displayName + '<br/>';
					header += email + '<br/>';
					if (!proposal.isCompany) {
						header += proposal.user.address + '<br/>';
						header += proposal.user.phone + '<br/>';
					} else {
						header += '<b><i>Company:</i></b>' + '<br/>';
						header += proposal.user.businessName + '<br/>';
						header += proposal.user.businessAddress + '<br/>';
						header += '<b><i>Contact:</i></b>' + '<br/>';
						header += proposal.user.businessContactName + '<br/>';
						header += proposal.user.businessContactPhone + '<br/>';
						header += proposal.user.businessContactEmail + '<br/>';
					}
					header += '<h2>Documents</h2><ul><li>' + links.join('</li><li>') + '</li></ul>';
					content = '<html><body>' + header + '<h2>Proposal</h2>' + proposalHtml + '</body></html>';

					// Add the directory, content and documents for this proposal
					zip.folder(opportunityName).folder(proponentName);
					zip.folder(opportunityName)
						.folder(proponentName)
						.file('index.html', content);
					files.forEach(function(file) {
						zip.folder(opportunityName)
							.folder(proponentName)
							.folder('docs')
							.file(file.name, fs.readFileSync(file.path), { binary: true });
					});
				});

				res.setHeader('Content-Type', 'application/zip');
				res.setHeader('Content-Type', 'application/octet-stream');
				res.setHeader('Content-Description', 'File Transfer');
				res.setHeader('Content-Transfer-Encoding', 'binary');
				res.setHeader('Content-Disposition', 'attachment; inline=false; filename="' + opportunityName + '.zip' + '"');

				zip.generateNodeStream({ base64: false, compression: 'DEFLATE', streamFiles: true }).pipe(res);
			}
		});
};

// -------------------------------------------------------------------------
//
// Create an archive of a single proposal for the given opportunity and belong to the given user
//
// -------------------------------------------------------------------------
exports.getMyProposalArchive = function(req, res) {
	var zip = new (require('jszip'))();
	var fs = require('fs');

	// Create a zip archive from the opportunity name
	var opportunityName = req.opportunity.name.replace(/\W/g, '-').replace(/-+/, '-');

	zip.folder(opportunityName);

	Proposal.findOne({ user: req.user._id, opportunity: req.opportunity._id })
		.populate('createdBy', 'displayName')
		.populate('updatedBy', 'displayName')
		.populate('opportunity')
		.populate('phases.inception.team')
		.populate('phases.proto.team')
		.populate('phases.implementation.team')
		.populate('user')
		.exec(function(err, proposal) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				var proponentName = proposal.user.displayName.replace(/\W/g, '-').replace(/-+/, '-');
				if (proposal.status === 'Assigned') proponentName += '-ASSIGNED';
				var files = proposal.attachments;
				var email = proposal.user.email;
				//
				// go through the files and build the internal links (reset links first)
				// also build the index.html content
				//
				var links = [];
				files.forEach(function(file) {
					links.push('<a href="docs/' + encodeURIComponent(file.name) + '" target="_blank">' + file.name + '</a>');
				});
				var questions = '<ol>';
				proposal.teamQuestionResponses.forEach(function(question) {
					questions += '<li style="margin: 10px 0;"><i>Question: ' + question.question + '</i><br/>Response: ' + question.response + '<br/>';
				});
				questions += '</ol>';
				var phases = '<h3>Inception</h3>';
				phases += 'Team:<ol>';
				proposal.phases.inception.team.forEach(function(teamMember) {
					phases += '<li>' + teamMember.displayName + '</li>';
				});
				phases += '</ol>';
				phases += 'Cost: ';
				phases += '$' + proposal.phases.inception.cost.toFixed(2);

				phases += '<h3>Prototype</h3>';
				phases += 'Team:<ol>';
				proposal.phases.proto.team.forEach(function(teamMember) {
					phases += '<li>' + teamMember.displayName + '</li>';
				});
				phases += '</ol>';
				phases += 'Cost: ';
				phases += '$' + proposal.phases.proto.cost.toFixed(2);

				phases += '<h3>Implementation</h3>';
				phases += 'Team:<ol>';
				proposal.phases.implementation.team.forEach(function(teamMember) {
					phases += '<li>' + teamMember.displayName + '</li>';
				});
				phases += '</ol>';
				phases += 'Cost: ';
				phases += '$' + proposal.phases.implementation.cost.toFixed(2);

				phases += '<br/><br/><b>Total Cost: ';
				phases += '$' + proposal.phases.aggregate.cost.toFixed(2);
				phases += '</b><br/>';

				var header = '<h2>Proposal</h2>';
				header += 'Status: ';
				header += proposal.status;
				header += '<br/>';
				header += 'Accepted Terms: ';
				header += proposal.isAcceptedTerms ? 'Yes' : 'No';
				header += '<br/>';
				header += 'Created on: ';
				header += new Date(proposal.created).toDateString();
				header += '<br/>';
				header += 'Lasted updated: ';
				header += new Date(proposal.updated).toDateString();
				header += '<h2>Proponent</h2>' + proposal.user.displayName + '<br/>';
				header += email + '<br/>';
				header += '<b><i>Company:</i></b>' + '<br/>';
				header += proposal.businessName + '<br/>';
				header += proposal.businessAddress + '<br/>';
				header += '<b><i>Contact:</i></b>' + '<br/>';
				header += proposal.businessContactName + '<br/>';
				header += proposal.businessContactPhone + '<br/>';
				header += proposal.businessContactEmail + '<br/>';
				if (links.length > 0) {
					header += '<h2>Attachments/References</h2><ul><li>' + links.join('</li><li>') + '</li></ul>';
				}
				var content = '<html><body>';
				content += header;
				content += '<h2>Phases</h2>' + phases;
				content += '<h2>Team Questions</h2>' + questions;
				content += '</body></html>';
				//
				// add the directory, content and documents for this proposal
				//
				zip.folder(opportunityName).folder(proponentName);
				zip.folder(opportunityName)
					.folder(proponentName)
					.file('proposal-summary.html', content);
				files.forEach(function(file) {
					zip.folder(opportunityName)
						.folder(proponentName)
						.folder('docs')
						.file(file.name, fs.readFileSync(file.path), { binary: true });
				});

				res.setHeader('Content-Type', 'application/zip');
				res.setHeader('Content-Type', 'application/octet-stream');
				res.setHeader('Content-Description', 'File Transfer');
				res.setHeader('Content-Transfer-Encoding', 'binary');
				res.setHeader('Content-Disposition', 'attachment; inline=false; filename="' + opportunityName + '.zip' + '"');

				zip.generateNodeStream({ base64: false, compression: 'DEFLATE', streamFiles: true }).pipe(res);
			}
		});
};

// -------------------------------------------------------------------------
//
// assign the passed in proposal
//
// -------------------------------------------------------------------------
exports.assign = function(opportunityId, proposalId, proposalUser, user) {
	return new Promise(function(resolve, reject) {
		Opportunity.findById(opportunityId).exec(function(err, opportunity) {
			if (err) {
				reject(err);
			} else if (!opportunity) {
				reject(
					new Error({
						message: 'No opportunity with that identifier has been found'
					})
				);
			} else {
				opportunity.status = 'Assigned';
				opportunity.proposal = proposalId;
				updateSave(opportunity)
					.then(function(opp) {
						opportunity = opp;
						// var data = setNotificationData (opportunity);
						sendMessages('opportunity-update', opportunity.watchers, {
							opportunity: setMessageData(opportunity)
						});
						// data.username = proposalUser.displayName;
						// data.useremail = proposalUser.email;
						//
						// in future, if we want to attach we can: data.filename = 'cwuterms.pdf';
						//
						// data.assignor = user.displayName;
						// data.assignoremail = opportunity.proposalEmail;
						opportunity.assignor = user.displayName;
						opportunity.assignoremail = opportunity.proposalEmail;
						sendMessages('opportunity-assign-cwu', [proposalUser], {
							opportunity: setMessageData(opportunity)
						});
						// Notifications.notifyUserAdHoc ('assignopp', data);
						return github
							.addCommentToIssue({
								comment: 'This opportunity has been assigned',
								repo: opportunity.github,
								number: opportunity.issueNumber
							})
							.then(function() {
								return github.lockIssue({
									repo: opportunity.github,
									number: opportunity.issueNumber
								});
							});
					})
					.then(resolve, reject);
			}
		});
	});
};
// -------------------------------------------------------------------------
//
// assign the passed in swu proposal
// TBD : in futre we should likely send an email to ALL the admins of the
// winning org, but for now, let's just do the one who created it.
//
// -------------------------------------------------------------------------
exports.assignswu = function(opportunityId, proposalId, proposalUser, user) {
	return new Promise(function(resolve, reject) {
		Opportunity.findById(opportunityId).exec(function(err, opportunity) {
			if (err) {
				reject(err);
			} else if (!opportunity) {
				reject(
					new Error({
						message: 'No opportunity with that identifier has been found'
					})
				);
			} else {
				opportunity.status = 'Assigned';
				opportunity.proposal = proposalId;
				opportunity.evaluationStage = 4; // TBD: this is terrible, how would we know this anyhow ?
				updateSave(opportunity)
					.then(function(opp) {
						opportunity = opp;
						// var data = setNotificationData (opportunity);
						sendMessages('opportunity-update', opportunity.watchers, {
							opportunity: setMessageData(opportunity)
						});
						// data.username = proposalUser.displayName;
						// data.useremail = proposalUser.email;
						//
						// in future, if we want to attach we can: data.filename = 'cwuterms.pdf';
						//
						// data.assignor = user.displayName;
						// data.assignoremail = opportunity.proposalEmail;
						opportunity.assignor = user.displayName;
						opportunity.assignoremail = opportunity.proposalEmail;
						sendMessages('opportunity-assign-swu', [proposalUser], {
							opportunity: setMessageData(opportunity)
						});
						// Notifications.notifyUserAdHoc ('assignopp', data);
						return github
							.addCommentToIssue({
								comment: 'This opportunity has been assigned',
								repo: opportunity.github,
								number: opportunity.issueNumber
							})
							.then(function() {
								return github.lockIssue({
									repo: opportunity.github,
									number: opportunity.issueNumber
								});
							});
					})
					.then(resolve, reject);
			}
		});
	});
};
// -------------------------------------------------------------------------
//
// delete the opportunity
//
// -------------------------------------------------------------------------
exports.delete = function(req, res) {
	if (ensureAdmin(req.opportunity, req.user, res)) {
		var opportunity = req.opportunity;
		opportunity.remove(function(err) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.json(opportunity);
			}
		});
	}
};
// -------------------------------------------------------------------------
//
// return a list of all opportunities
//
// -------------------------------------------------------------------------
exports.list = function(req, res) {
	opplist(searchTerm(req), req, function(err, opportunities) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(opportunities);
		}
	});
};

// -------------------------------------------------------------------------
//
// this is the service front to the members call
//
// -------------------------------------------------------------------------
exports.listMembers = function(req, res) {
	exports.members(req.opportunity, function(err, users) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(users);
		}
	});
};

// -------------------------------------------------------------------------
//
// this is the service front to the members call
//
// -------------------------------------------------------------------------
exports.listRequests = function(req, res) {
	exports.requests(req.opportunity, function(err, users) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(users);
		}
	});
};

// -------------------------------------------------------------------------
//
// have the current user request access
//
// -------------------------------------------------------------------------
exports.request = function(req, res) {
	setOpportunityRequest(req.opportunity, req.user);
	req.user.save();
	res.json({ ok: true });
};

// -------------------------------------------------------------------------
//
// deal with members
//
// in the context of opportunities, confirming a member is assigning them
// to the opportunity. so, all others are rejected upon this action
//
// -------------------------------------------------------------------------
var assignMember = function(opportunity, user) {
	return new Promise(function(resolve, reject) {
		unsetOpportunityRequest(opportunity, user);
		setOpportunityMember(opportunity, user);
		user.save().then(resolve, reject);
	});
};
var unassignMember = function(opportunity, user) {
	return new Promise(function(resolve, reject) {
		unsetOpportunityRequest(opportunity, user);
		unsetOpportunityMember(opportunity, user);
		user.save().then(resolve, reject);
	});
};
exports.assignMember = assignMember;
exports.unassignMember = unassignMember;
exports.confirmMember = function(req, res) {
	var user = req.model;
	var assignedMember;
	//
	// assign the member
	//
	assignMember(req.opportunity, user)
		//
		// get the list of remaining applicants
		//
		.then(function(result) {
			assignedMember = result;
			return mongoose
				.model('User')
				.find({ roles: requestRole(req.opportunity) })
				.exec();
		})
		//
		// make a promise array of those by running them through the
		// unassign method
		//
		.then(function(list) {
			return Promise.all(
				list.map(function(member) {
					return unassignMember(req.opportunity, member);
				})
			);
		})
		//
		// all OK, return the assigned user
		//
		.then(function() {
			res.json(assignedMember);
		})
		//
		// not going very well, figure out the error
		//
		.catch(function(err) {
			res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		});
};
exports.denyMember = function(req, res) {
	var user = req.model;
	unassignMember(req.opportunity, user)
		.then(function(result) {
			res.json(result);
		})
		.catch(function(err) {
			res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		});
};

// -------------------------------------------------------------------------
//
// get opportunities under project
//
// -------------------------------------------------------------------------
exports.forProject = function(req, res) {
	opplist(searchTerm(req, { project: req.project._id }), req, function(err, opportunities) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(opportunities);
		}
	});
};
// -------------------------------------------------------------------------
//
// get opportunities under program
//
// -------------------------------------------------------------------------
exports.forProgram = function(req, res) {
	opplist(searchTerm(req, { program: req.program._id }), req, function(err, opportunities) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(opportunities);
		}
	});
};

// -------------------------------------------------------------------------
//
// new empty opportunity
//
// -------------------------------------------------------------------------
exports.new = function(req, res) {
	var p = new Opportunity();
	res.json(p);
};

// -------------------------------------------------------------------------
//
// Add ro remove watches for the current user
//
// -------------------------------------------------------------------------
exports.addWatch = function(req, res) {
	req.opportunity.watchers.addToSet(req.user._id);
	req.opportunity.save();
	res.json({ ok: true });
};
exports.removeWatch = function(req, res) {
	req.opportunity.watchers.pull(req.user._id);
	req.opportunity.save();
	res.json({ ok: true });
};

exports.deadlineStatus = function(req, res) {
	var deadlineStatus = new Date(req.opportunity.deadline) - new Date() <= 0 ? 'CLOSED' : 'OPEN';
	res.json({ deadlineStatus: deadlineStatus });
};
// -------------------------------------------------------------------------
//
// magic that populates the opportunity on the request
//
// -------------------------------------------------------------------------
exports.opportunityByID = function(req, res, next, id) {
	if (id.substr(0, 3) === 'opp') {
		Opportunity.findOne({ code: id })
			.populate('createdBy', 'displayName email')
			.populate('updatedBy', 'displayName')
			.populate('project', 'code name _id isPublished')
			.populate('program', 'code title _id logo isPublished')
			.populate('phases.implementation.capabilities', 'code name')
			.populate('phases.implementation.capabilitiesCore', 'code name')
			.populate('phases.implementation.capabilitySkills', 'code name')
			.populate('phases.inception.capabilities', 'code name')
			.populate('phases.inception.capabilitiesCore', 'code name')
			.populate('phases.inception.capabilitySkills', 'code name')
			.populate('phases.proto.capabilities', 'code name')
			.populate('phases.proto.capabilitiesCore', 'code name')
			.populate('phases.proto.capabilitySkills', 'code name')
			.populate('phases.aggregate.capabilities', 'code name')
			.populate('phases.aggregate.capabilitiesCore', 'code name')
			.populate('phases.aggregate.capabilitySkills', 'code name')
			.populate('intermediateApproval.requestor', 'displayName email')
			.populate('finalApproval.requestor', 'displayName email')
			.populate({
				path: 'proposal',
				model: 'Proposal',
				populate: [
					{
						path: 'user',
						model: 'User'
					},
					{
						path: 'org',
						model: 'Org'
					}
				]
			})
			.populate('addenda.createdBy', 'displayName')
			// .populate({path:'proposal.user', model:'User'}) //'displayName firstName lastName email phone address username profileImageURL businessName businessAddress businessContactName businessContactPhone businessContactEmail')
			.exec(function(err, opportunity) {
				if (err) {
					return next(err);
				} else if (!opportunity) {
					return res.status(404).send({
						message: 'No opportunity with that identifier has been found'
					});
				}
				req.opportunity = opportunity;
				next();
			});
	} else {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).send({
				message: 'Opportunity is invalid'
			});
		}

		Opportunity.findById(id)
			.populate('createdBy', 'displayName')
			.populate('updatedBy', 'displayName')
			.populate('project', 'code name _id isPublished')
			.populate('program', 'code title _id logo isPublished')
			.populate('phases.implementation.capabilities', 'code name')
			.populate('phases.implementation.capabilitiesCore', 'code name')
			.populate('phases.implementation.capabilitySkills', 'code name')
			.populate('phases.inception.capabilities', 'code name')
			.populate('phases.inception.capabilitiesCore', 'code name')
			.populate('phases.inception.capabilitySkills', 'code name')
			.populate('phases.proto.capabilities', 'code name')
			.populate('phases.proto.capabilitiesCore', 'code name')
			.populate('phases.proto.capabilitySkills', 'code name')
			.populate('phases.aggregate.capabilities', 'code name')
			.populate('phases.aggregate.capabilitiesCore', 'code name')
			.populate('phases.aggregate.capabilitySkills', 'code name')
			.populate('intermediateApproval.requestor', 'displayName email')
			.populate('finalApproval.requestor', 'displayName email')
			.populate({
				path: 'proposal',
				model: 'Proposal',
				populate: {
					path: 'user',
					model: 'User'
				}
			})
			.exec(function(err, opportunity) {
				if (err) {
					return next(err);
				} else if (!opportunity) {
					return res.status(404).send({
						message: 'No opportunity with that identifier has been found'
					});
				}
				req.opportunity = opportunity;
				next();
			});
	}
};
// -------------------------------------------------------------------------
//
// publish or unpublish whole sets of opportunities by either program or
// project
//
// -------------------------------------------------------------------------
exports.rePublishOpportunities = function(programId, projectId) {
	return (projectId ? forProject(projectId) : forProgram(programId)).then(function(opportunities) {
		return Promise.all(
			opportunities.map(function(opportunity) {
				opportunity.isPublished = opportunity.wasPublished;
				return opportunity.save();
			})
		);
	});
};
exports.unPublishOpportunities = function(programId, projectId) {
	return (projectId ? forProject(projectId) : forProgram(programId)).then(function(opportunities) {
		return Promise.all(
			opportunities.map(function(opportunity) {
				opportunity.wasPublished = opportunity.isPublished;
				opportunity.isPublished = false;
				return opportunity.save();
			})
		);
	});
};

//
// Action an opportunity approval request (pre-approval or final approval)
// Upon actioning, the appropriate follow up notifications are dispatched
//
exports.action = function(req, res) {
	var code = Number(req.body.code);
	var action = req.body.action;
	var isPreApproval = req.body.preapproval === 'true';
	var opportunity = req.opportunity;

	var approvalInfo = isPreApproval ? opportunity.intermediateApproval : opportunity.finalApproval;

	// if code matches, action and then return 200
	if (approvalInfo.twoFACode === code) {
		// mark as approved
		if (action === 'approve') {
			approvalInfo.state = 'actioned';
			approvalInfo.action = 'approved';
			approvalInfo.actioned = Date.now();

			if (isPreApproval === false) {
				opportunity.isApproved = true;
				updateSave(opportunity).then(function() {
					// send a notification message to original requestor notifying of approval
					sendMessages('opportunity-approved-notification', [opportunity.finalApproval.requestor], { opportunity: setMessageData(opportunity) });
					res.status(200).json({ message: 'Opportunity approved!', succeed: true });
				});
			} else {
				// now that pre-approval is done, initiate the final approval process
				opportunity.finalApproval.routeCode = new Date().valueOf();
				opportunity.finalApproval.state = 'sent';
				opportunity.finalApproval.initiated = Date.now();
				updateSave(opportunity).then(function(savedOpportunity) {
					opportunity = savedOpportunity;
					sendMessages('opportunity-approval-request', [{ email: opportunity.finalApproval.email }], { opportunity: setMessageData(opportunity) });
					res.status(200).json({ message: 'Opportunity pre-approved!', succeed: true });
				});
			}
		}
		// mark as rejected
		else {
			approvalInfo.state = 'actioned';
			approvalInfo.action = 'denied';
			approvalInfo.actioned = Date.now();

			updateSave(opportunity).then(function() {
				// send a notification message to original requestor notifying of rejection
				sendMessages('opportunity-denied-notification', [opportunity.finalApproval.requestor], { opportunity: setMessageData(opportunity) });
				res.status(200).json({ message: 'Opportunity rejected', succeed: true });
			});
		}
	} else {
		approvalInfo.twoFAAttemptCount++;
		updateSave(opportunity).then(function() {
			res.status(200).json({ message: 'Invalid code', succeed: false });
		});
	}
};

//
// Sends a 2FA code using the opportunity and approval info in the request
//
exports.send2FA = function(req, res) {
	var opportunity = req.opportunity;
	var intermediateApproval = opportunity.intermediateApproval;
	var finalApproval = opportunity.finalApproval;

	var approvalToAction = intermediateApproval.state === 'sent' ? intermediateApproval : finalApproval;

	// generate a new 2FA code and save to opportunity
	var twoFA = Math.floor(100000 + Math.random() * 900000);
	approvalToAction.twoFACode = twoFA;
	approvalToAction.twoFASendCount++;
	updateSave(opportunity).then(function(savedOpportunity) {
		opportunity = savedOpportunity;
		if (approvalToAction.twoFAMethod === 'email') {
			send2FAviaEmail(approvalToAction);
		} else {
			send2FAviaSMS(approvalToAction);
		}

		res.status(200).send();
	});
};

//
// Initiate the opportunity approval workflow by sending the initial pre-approval email and configuring the opportunity as required
//
function sendApprovalMessages(requestingUser, opportunity) {
	if (opportunity.intermediateApproval.state === 'ready-to-send') {
		// send intermediate approval request
		sendMessages('opportunity-pre-approval-request', [{ email: opportunity.intermediateApproval.email }], { opportunity: setMessageData(opportunity) });
		opportunity.intermediateApproval.state = 'sent';
		opportunity.intermediateApproval.twoFASendCount = 0;
		opportunity.intermediateApproval.twoFAAttemptCount = 0;
		opportunity.finalApproval.state = 'draft';
		opportunity.finalApproval.twoFASendCount = 0;
		opportunity.finalApproval.twoFAAttemptCount = 0;
		updateSave(opportunity);
	}
}

//
// Send a 2FA token via SMS using the passed approval info
//
function send2FAviaSMS(approvalInfo) {
	const nexmo = new Nexmo({
		apiKey: process.env.NEXMO_API_KEY,
		apiSecret: process.env.NEXMO_API_SECRET
	});

	const from = process.env.NEXMO_FROM_NUMBER;
	const to = approvalInfo.mobileNumber;
	const msg = approvalInfo.twoFACode;

	nexmo.message.sendSms(from, to, msg);
}

//
// Send a 2FA token via email using the passed approval info
//
function send2FAviaEmail(approvalInfo) {
	sendMessages('opportunity-approval-2FA', [{ email: approvalInfo.email }], { approvalInfo: approvalInfo });
}
