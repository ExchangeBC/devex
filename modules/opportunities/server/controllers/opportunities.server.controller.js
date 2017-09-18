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
	errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
	helpers = require(path.resolve('./modules/core/server/controllers/core.server.helpers')),
	_ = require('lodash'),
	Notifications = require(path.resolve('./modules/notifications/server/controllers/notifications.server.controller')),
	Proposals = require(path.resolve('./modules/proposals/server/controllers/proposals.server.controller')),
	github = require(path.resolve('./modules/core/server/controllers/core.server.github'))
	;



// -------------------------------------------------------------------------
//
// set a opportunity role on a user
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
var setOpportunityMember = function (opportunity, user) {
	user.addRoles ([memberRole(opportunity)]);
};
var setOpportunityAdmin = function (opportunity, user) {
	user.addRoles ([memberRole(opportunity), adminRole(opportunity)]);
};
var setOpportunityRequest = function (opportunity, user) {
	user.addRoles ([requestRole(opportunity)]);
};
var unsetOpportunityMember = function (opportunity, user) {
	user.removeRoles ([memberRole(opportunity)]);
};
var unsetOpportunityAdmin = function (opportunity, user) {
	user.removeRoles ([memberRole(opportunity), adminRole(opportunity)]);
};
var unsetOpportunityRequest = function (opportunity, user) {
	user.removeRoles ([requestRole(opportunity)]);
};
var ensureAdmin = function (opportunity, user, res) {
	if (!~user.roles.indexOf (adminRole(opportunity)) && !~user.roles.indexOf ('admin')) {
		res.status(422).send({
			message: 'User Not Authorized'
		});
		return false;
	} else {
		return true;
	}
};
var searchTerm = function (req, opts) {
	opts = opts || {};
	var me = helpers.myStuff ((req.user && req.user.roles)? req.user.roles : null );
	if (!me.isAdmin) {
		opts['$or'] = [{isPublished:true}, {code: {$in: me.opportunities.admin}}];
	}
	return opts;
};
// -------------------------------------------------------------------------
//
// this takes a opportunity model, serializes it, and decorates it with what
// relationship the user has to the opportunity, and returns the JSON
//
// -------------------------------------------------------------------------
var decorate = function (opportunityModel, roles) {
	var opportunity = opportunityModel ? opportunityModel.toJSON () : {};
	opportunity.userIs = {
		admin   : !!~roles.indexOf (adminRole(opportunity)),
		member  : !!~roles.indexOf (memberRole(opportunity)),
		request : !!~roles.indexOf (requestRole(opportunity)),
		gov     : !!~roles.indexOf ('gov')
	};
	return opportunity;
};
// -------------------------------------------------------------------------
//
// decorate an entire list of opportunities
//
// -------------------------------------------------------------------------
var decorateList = function (opportunityModels, roles) {
	return opportunityModels.map (function (opportunityModel) {
		return decorate (opportunityModel, roles);
	});
};
var opplist = function (query, req, callback) {
	Opportunity.find (query)
	.sort([['deadline', -1],['name', 1]])
	.populate('createdBy', 'displayName')
	.populate('updatedBy', 'displayName')
	.populate('project', 'code name _id isPublished')
	.populate('program', 'code title _id logo isPublished')
	.exec(function (err, opportunities) {
		if (err) {
			callback (err, null);
		} else {
			callback (null, decorateList (opportunities, req.user ? req.user.roles : []));
		}
	});
}
var forProgram = function (id) {
	return new Promise (function (resolve, reject) {
		Opportunity.find ({program:id}).exec ().then (resolve, reject);
	});
};
var forProject = function (id) {
	return new Promise (function (resolve, reject) {
		Opportunity.find ({project:id}).exec ().then (resolve, reject);
	});
};
// -------------------------------------------------------------------------
//
// increment the number of views of an opportunity
//
// -------------------------------------------------------------------------
var incrementViews = function (id) {
	Opportunity.update ({ _id: id }, { $inc: { views: 1 }}).exec ();
};
// -------------------------------------------------------------------------
//
// all the info we need for notification merging
//
// -------------------------------------------------------------------------
var setNotificationData = function (opportunity) {
	return {
		name                 : opportunity.name,
		short                : opportunity.short,
		description          : opportunity.description,
		earn_format_mnoney   : helpers.formatMoney (opportunity.earn, 2),
		earn                 : helpers.formatMoney (opportunity.earn, 2),
		dateDeadline         : helpers.formatDate (new Date(opportunity.deadline)),
		timeDeadline         : helpers.formatTime (new Date(opportunity.deadline)),
		dateAssignment       : helpers.formatDate (new Date(opportunity.assignment)),
		dateStart            : helpers.formatDate (new Date(opportunity.start)),
		datePublished        : helpers.formatDate (new Date(opportunity.lastPublished)),
		deadline_format_date : helpers.formatDate (new Date(opportunity.deadline)),
		deadline_format_time : helpers.formatTime (new Date(opportunity.deadline)),
		updatenotification   : 'not-update-'+opportunity.code,
		code                 : opportunity.code,
		skills               : opportunity.skills.join (', ')
	};
};
// -------------------------------------------------------------------------
//
// get a list of all my opportunities, but only ones I have access to as a normal
// member or admin, just not as request
//
// -------------------------------------------------------------------------
exports.my = function (req, res) {
	Opportunity.find (searchTerm (req))
	.select ('code name short')
	.exec (function (err, opportunities) {
		if (err) {
			return res.status(422).send ({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (opportunities);
		}
	});
};
// -------------------------------------------------------------------------
//
// return a list of all opportunity members. this means all members NOT
// including users who have requested access and are currently waiting
//
// -------------------------------------------------------------------------
exports.members = function (opportunity, cb) {
	mongoose.model ('User')
	.find ({roles: memberRole(opportunity)})
	.select ('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle')
	.exec (cb);
};

// -------------------------------------------------------------------------
//
// return a list of all users who are currently waiting to be added to the
// opportunity member list
//
// -------------------------------------------------------------------------
exports.requests = function (opportunity, cb) {
	mongoose.model ('User')
	.find ({roles: requestRole(opportunity)})
	.select ('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle')
	.exec (cb);
};

var oppBody = function (opp) {
	var dt = opp.deadline;
	var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	var deadline = dt.getHours()+':00 PST, '+dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
	dt = opp.assignment;
	var assignment = dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
	dt = opp.start;
	var start = dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
	var earn = helpers.formatMoney (opp.earn, 2);
	var locs = {
		offsite : 'In-person work NOT required',
		onsite  : 'In-person work required',
		mixed   : 'Some in-person work required'
	}
	var ret = '';
	ret += 'Value: '+earn;
	ret += 'Closes: '+deadline;
	ret += 'Location: '+opp.location+' '+locs[opp.onsite];
	ret += '<h2>Opportunity Description</h2>';
	ret += opp.description;
	ret += '<h2>Acceptance Criteria</h2>';
	ret += opp.criteria;
	ret += '<h2>How to Apply</h2>';
	ret += '<p>Go to the <a href="https://bcdevexchange.org/opportunities/'+opp.code+'">Opportunity Page</a>, click the Apply button above and submit your proposal by 16:00 PST on '+deadline+'</b>.</p>';
	ret += '<p>We plan to assign this opportunity by <b>'+assignment+'</b> with work to start on <b>'+start+'</b>.</p>';
	ret += '<p>If your proposal is accepted and you are assigned to the opportunity, you will be notified by email and asked to confirm your agreement to the <a href="https://github.com/BCDevExchange/devex/raw/master/Code-with-Us%20Terms_BC%20Developers%20Exchange.pdf"><i>Code With Us</i> terms and contract.</a></p>';
	ret += '<h2>Proposal Evaluation Criteria</h2>';
	ret += opp.evaluation;
	return ret;
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
	Opportunity.findUniqueCode (opportunity.name, null, function (newcode) {
		opportunity.code = newcode;
		//
		// set the audit fields so we know who did what when
		//
		helpers.applyAudit (opportunity, req.user)
		//
		// save and return
		//
		opportunity.save(function (err) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				setOpportunityAdmin (opportunity, req.user);
				req.user.save ();
				Notifications.addNotification ({
					code: 'not-update-'+opportunity.code,
					name: 'Update of Opportunity '+opportunity.name,
					// description: 'Update of Opportunity '+opportunity.name,
					target: 'Opportunity',
					event: 'Update'
				});
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
exports.read = function (req, res) {
	res.json (decorate (req.opportunity, req.user ? req.user.roles : []));
	incrementViews (req.opportunity._id);
};


var updateSave = function (opportunity) {
	return new Promise (function (resolve, reject) {
		opportunity.save (function (err) {
			if (err) reject (err);
			else resolve (opportunity);
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
exports.update = function (req, res) {

	//
	// if we dont have permission to do this just return as a no-op
	//
	if (!ensureAdmin (req.opportunity, req.user, res)) {
		return res.json (decorate (req.opportunity, req.user ? req.user.roles : []));
	}
	//
	// copy over everything passed in. This will overwrite the
	// audit fields, but they get updated in the following step
	//
	var opportunity = _.assign (req.opportunity, req.body);
	//
	// set the audit fields so we know who did what when
	//
	helpers.applyAudit (opportunity, req.user);

	//
	// save
	//
	updateSave (opportunity)
	.then (function () {
		var data = setNotificationData (opportunity);
		if (opportunity.isPublished) {
			Notifications.notifyObject ('not-updateany-opportunity', data);
			Notifications.notifyObject ('not-update-'+opportunity.code, data);
			github.createOrUpdateIssue ({
				title  : opportunity.name,
				body   : oppBody (opportunity),
				repo   : opportunity.github,
				number : opportunity.issueNumber
			})
			.then (function (result) {
				opportunity.issueUrl    = result.html_url;
				opportunity.issueNumber = result.number;
				opportunity.save ();
				res.json (decorate (opportunity, req.user ? req.user.roles : []));
			})
			.catch (function () {
				res.status(422).send({
					message: 'Opportunity saved, but there was an error creating the github issue. Please check your repo url and try again.'
				});
			});
		}
		else res.json (decorate (opportunity, req.user ? req.user.roles : []));
	})
	.catch (function (err) {
		return res.status(422).send({
			message: errorHandler.getErrorMessage(err)
		});
	});
};
// -------------------------------------------------------------------------
//
// publish or unpublish
//
// -------------------------------------------------------------------------
var pub = function (req, res, isToBePublished) {
	var opportunity = req.opportunity;
	//
	// if no change or we dont have permission to do this just return as a no-op
	//
	if (req.opportunity.isPublished === isToBePublished || !ensureAdmin (req.opportunity, req.user, res)) {
		return res.json (decorate (req.opportunity, req.user ? req.user.roles : []));
	}
	//
	// determine first time or not
	//
	var firstTime = (isToBePublished && !opportunity.wasPublished);
	//
	// set the correct new state and set the publish date if being published
	//
	opportunity.isPublished = isToBePublished;
	if (isToBePublished) {
		opportunity.lastPublished = new Date ();
		opportunity.wasPublished = true;
	}

	//
	// save and notify
	//
	updateSave (opportunity)
	.then (function () {
		var data = setNotificationData (opportunity);
		if (firstTime) Notifications.notifyObject ('not-add-opportunity', data);
		else if (isToBePublished) {
			Notifications.notifyObject ('not-update-'+opportunity.code, data);
			Notifications.notifyObject ('not-updateany-opportunity', data);
		}
		res.json (decorate (opportunity, req.user ? req.user.roles : []));
	})
	.catch (function (err) {
		return res.status(422).send({
			message: errorHandler.getErrorMessage(err)
		});
	});
}
exports.publish = function (req, res) { return pub (req, res, true); }
exports.unpublish = function (req, res) { return pub (req, res, false); }

// -------------------------------------------------------------------------
//
// unasasign the assigned proposal
//
// -------------------------------------------------------------------------
exports.unassign = function (req, res) {
	var opportunity;
	//
	// unassign the proposal
	//
	Proposals.unassign (req.opportunity.proposal, req.user)
	//
	// update the opportunity into pending status with no proposal
	//
	.then (function () {
		req.opportunity.status = 'Pending';
		req.opportunity.proposal = null;
		return updateSave (req.opportunity);
	})
	//
	// notify of changes
	// update the issue on github
	//
	.then (function (opp) {
		opportunity = opp;
		var data = setNotificationData (opportunity);
		Notifications.notifyObject ('not-updateany-opportunity', data);
		Notifications.notifyObject ('not-update-'+opportunity.code, data);
		return github.unlockIssue ({
			repo   : opportunity.github,
			number : opportunity.issueNumber
		})
		.then (function () {
			return github.addCommentToIssue ({
				comment : 'This opportunity has been un-assigned',
				repo    : opportunity.github,
				number  : opportunity.issueNumber
			});
		});
	})
	//
	// return the new opportunity or fail
	//
	.then (function () {res.json (decorate (opportunity, req.user ? req.user.roles : [])); })
	.catch (function (err) {res.status(422).send ({message: errorHandler.getErrorMessage(err)}); });
};
// -------------------------------------------------------------------------
//
// assign the passed in proposal
//
// -------------------------------------------------------------------------
exports.assign = function (opportunityId, proposalId, proposalUser, user) {
	return new Promise (function (resolve, reject) {
		Opportunity.findById (opportunityId)
		.exec (function (err, opportunity) {
			if (err) {
				reject (err);
			}
			else if (!opportunity) {
				reject (new Error ({
					message: 'No opportunity with that identifier has been found'
				}));
			}
			else {
				opportunity.status = 'Assigned';
				opportunity.proposal = proposalId;
				updateSave (opportunity)
				.then (function (opp) {
					opportunity = opp;
					var data = setNotificationData (opportunity);
					Notifications.notifyObject ('not-updateany-opportunity', data);
					Notifications.notifyObject ('not-update-'+opportunity.code, data);
					data.username = proposalUser.displayName;
					data.useremail = proposalUser.email;
					//
					// in future, if we want to attach we can: data.filename = 'cwuterms.pdf';
					//
					data.assignor = user.displayName;
					data.assignoremail = opportunity.proposalEmail;
					Notifications.notifyUserAdHoc ('assignopp', data);
					return github.addCommentToIssue ({
						comment : 'This opportunity has been assigned',
						repo    : opportunity.github,
						number  : opportunity.issueNumber
					})
					.then (function () {
						return github.lockIssue ({
							repo   : opportunity.github,
							number : opportunity.issueNumber
						});
					});
				})
				.then (resolve, reject);
			}
		});
	});
};
// -------------------------------------------------------------------------
//
// delete the opportunity
//
// -------------------------------------------------------------------------
exports.delete = function (req, res) {
	if (ensureAdmin (req.opportunity, req.user, res)) {

		var opportunity = req.opportunity;
		opportunity.remove(function (err) {
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
exports.list = function (req, res) {
	opplist (searchTerm (req), req, function (err, opportunities) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (opportunities);
		}
	});
};

// -------------------------------------------------------------------------
//
// this is the service front to the members call
//
// -------------------------------------------------------------------------
exports.listMembers = function (req, res) {
	exports.members (req.opportunity, function (err, users) {
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
	exports.requests (req.opportunity, function (err, users) {
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
	setOpportunityRequest (req.opportunity, req.user);
	req.user.save ();
	res.json ({ok:true});
}

// -------------------------------------------------------------------------
//
// deal with members
//
// in the context of opportunities, confirming a member is assigning them
// to the opportunity. so, all others are rejected upon this action
//
// -------------------------------------------------------------------------
var assignMember = function (opportunity, user) {
	return new Promise (function (resolve, reject) {
		unsetOpportunityRequest (opportunity, user);
		setOpportunityMember (opportunity, user);
		user.save ().then (resolve, reject);
	});
};
var unassignMember = function (opportunity, user) {
	return new Promise (function (resolve, reject) {
		unsetOpportunityRequest (opportunity, user);
		unsetOpportunityMember (opportunity, user);
		user.save ().then (resolve, reject);
	});
};
exports.assignMember = assignMember;
exports.unassignMember = unassignMember;
exports.confirmMember = function (req, res) {
	var user = req.model;
	var assignedMember;
	//
	// assign the member
	//
	assignMember (req.opportunity, user)
	//
	// get the list of remaining applicants
	//
	.then (function (result) {
		assignedMember = result;
		return mongoose.model ('User').find ({roles: requestRole(req.opportunity)}).exec();
	})
	//
	// make a promise array of those by running them through the
	// unassign method
	//
	.then (function (list) {
		return Promise.all (list.map (function (member) {
			return unassignMember (req.opportunity, member);
		}));
	})
	//
	// all OK, return the assigned user
	//
	.then (function () {
		res.json (assignedMember);
	})
	//
	// not going very well, figure out the error
	//
	.catch (function (err) {
		res.status (422).send ({
			message: errorHandler.getErrorMessage (err)
		});
	});
};
exports.denyMember = function (req, res) {
	var user = req.model;
	unassignMember (req.opportunity, user)
	.then (function (result) {
		res.json (result);
	})
	.catch (function (err) {
		res.status (422).send ({
			message: errorHandler.getErrorMessage (err)
		});
	});
};

// -------------------------------------------------------------------------
//
// get opportunities under project
//
// -------------------------------------------------------------------------
exports.forProject = function (req, res) {
	opplist (searchTerm (req, {project:req.project._id}), req, function (err, opportunities) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (opportunities);
		}
	});
};
// -------------------------------------------------------------------------
//
// get opportunities under program
//
// -------------------------------------------------------------------------
exports.forProgram = function (req, res) {
	opplist (searchTerm (req, {program:req.program._id}), req, function (err, opportunities) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (opportunities);
		}
	});
};

// -------------------------------------------------------------------------
//
// new empty opportunity
//
// -------------------------------------------------------------------------
exports.new = function (req, res) {
	var p = new Opportunity ();
	res.json(p);
};

// -------------------------------------------------------------------------
//
// magic that populates the opportunity on the request
//
// -------------------------------------------------------------------------
exports.opportunityByID = function (req, res, next, id) {
	if (id.substr (0, 3) === 'opp' ) {
		Opportunity.findOne({code:id})
		.populate('createdBy', 'displayName')
		.populate('updatedBy', 'displayName')
		.populate('project', 'code name _id isPublished')
		.populate('program', 'code title _id logo isPublished')
		.populate({
			path: 'proposal',
			model: 'Proposal',
			populate : {
				path: 'user',
				model: 'User'
			}
		})
		// .populate({path:'proposal.user', model:'User'}) //'displayName firstName lastName email phone address username profileImageURL businessName businessAddress businessContactName businessContactPhone businessContactEmail')
		.exec(function (err, opportunity) {
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
		.populate({
			path: 'proposal',
			model: 'Proposal',
			populate : {
				path: 'user',
				model: 'User'
			}
		})
		.exec(function (err, opportunity) {
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
exports.rePublishOpportunities = function (programId, projectId) {
	return (projectId ? forProject (projectId) : forProgram (programId))
	.then (function (opportunities) {
		return Promise.all (opportunities.map (function (opportunity) {
			opportunity.isPublished = opportunity.wasPublished;
			return opportunity.save ();
		}));
	});
};
exports.unPublishOpportunities = function (programId, projectId) {
	return (projectId ? forProject (projectId) : forProgram (programId))
	.then (function (opportunities) {
		return Promise.all (opportunities.map (function (opportunity) {
			opportunity.wasPublished = opportunity.isPublished;
			opportunity.isPublished = false;
			return opportunity.save ();
		}));
	});
};
