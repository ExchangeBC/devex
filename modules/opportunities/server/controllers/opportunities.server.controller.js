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
	// notifier = require(path.resolve('./modules/core/server/controllers/core.server.notifier.js')).notifier,
	// fs = require('fs'),
	// markdown = require('helper-markdown'),
	// // HandlebarsIntl = require('handlebars-intl'),
	// Handlebars = require('handlebars'),
	// htmlToText = require('html-to-text')
	Notifications = require(path.resolve('./modules/notifications/server/controllers/notifications.server.controller'))
	;


// var oppEmailNotifier = notifier('opportunities', 'email');

// Handlebars.registerHelper('markdown', markdown({ breaks: true, xhtmlOut: false}));
// // HandlebarsIntl.registerWith(Handlebars);
// var emailBodyTemplateHtml = Handlebars.compile(fs.readFileSync(path.resolve('./modules/opportunities/server/email_templates/message_body.hbs.md'), 'utf8'));
// var emailSubjectTemplate = Handlebars.compile(fs.readFileSync(path.resolve('./modules/opportunities/server/email_templates/subject.hbs.md'), 'utf8'));

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
	// console.log ('remove role ', requestRole(opportunity));
	user.removeRoles ([requestRole(opportunity)]);
};
var ensureAdmin = function (opportunity, user, res) {
	if (!~user.roles.indexOf (adminRole(opportunity)) && !~user.roles.indexOf ('admin')) {
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
var searchTerm = function (req, opts) {
	opts = opts || {};
	var me = helpers.myStuff ((req.user && req.user.roles)? req.user.roles : null );
	if (!me.isAdmin) {
		opts['$or'] = [{isPublished:true}, {code: {$in: me.opportunities.admin}}];
	}
	// console.log ('me = ', me);
	// console.log ('opts = ', opts);
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
// create an issue in the opportunity repo using the secret from our repos or
// from the users'
//
// -------------------------------------------------------------------------
var createIssue = function (opportunity, user) {
	return new Promise (function (resolve, reject) {

		var callbackf = function (err, status, body, headers) {
			console.log ('err', err);
			console.log ('status', status);
			console.log ('body', body);
			console.log ('headers', headers);
			resolve ({
				err: err,
				status: status,
				body: body,
				headers: headers
			});
		};
		var github = require('octonode');
		console.log ('octonode', github);
		var accessToken = user.providerData.accessToken;
		var login = user.providerData.login;

		var client = github.client (accessToken);
		var ghme = client.me();
		var repo = 'BCDevExchange-app';
		var ghrepo = client.repo('BCDevExchange/BCDevExchange-app');


		console.log ('ghrepo', ghrepo);

		ghme.orgs (callbackf);

		// ghrepo.issues (callbackf);

		// ghrepo.issue({
		// 'title': 'Test Auto Issue',
		// 'body': 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
		// 'assignee': login,
		// 'labels': ['Label1', 'Label2']
		// }, callbackf);

	});

};
exports.ttt = function (req, res) {
	createIssue (req.opportunity, req.user)
	.then (function (r) {
		res.json (r);
	});

}
// -------------------------------------------------------------------------
//
// get a list of all my opportunities, but only ones I have access to as a normal
// member or admin, just not as request
//
// -------------------------------------------------------------------------
exports.my = function (req, res) {
	// var me = helpers.myStuff ((req.user && req.user.roles)? req.user.roles : null );
	// var search = me.isAdmin ? {} : { code: { $in: me.opportunities.member } };
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
	// console.log ('Creating a new opportunity');
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
				// Notifications.addNotification ({
				// 	code: 'not-unpublish-'+opportunity.code,
				// 	name: 'Suspension of Opportunity '+opportunity.name,
				// 	// description: 'Update of Opportunity '+opportunity.name,
				// 	target: 'Opportunity',
				// 	event: 'unpublish'
				// });
				// Notifications.addNotification ({
				// 	code: 'not-republish-'+opportunity.code,
				// 	name: 'Re-Posting of Opportunity '+opportunity.name,
				// 	// description: 'Update of Opportunity '+opportunity.name,
				// 	target: 'Opportunity',
				// 	event: 'republish'
				// });
				res.json(opportunity);
			}
		});
	});

/*

GITHUB related stuff

	var opportunity = new Opportunity(req.body);
	opportunity.user = req.user;

	var http = require('http');
	var github = require('octonode');
	var config = require('/config/config.js');

	// curl -u 'dewolfe001:39c1cffc1008ed43189ecd27448bd903a75778eb' https://api.github.com/user/repos -d '{'name':''helloGit''}'

	var url = 'https://api.github.com/user/repos';
	var user = config.github.clientID;  // 'dewolfe001';
	var secret = config.github.clientSecret; // '39c1cffc1008ed43189ecd27448bd903a75778eb';

	var client = github.client({
	id: user,
		secret: secret
	});

 //  opportunity.github = client.repo({
	// 'name': opportunity.name,
	// 'description' : opportunity.description
	// },  function (err, data) {
	// 	if (err) {
	// 		return console.error(err);
	// 	}
	// 	else {
	// 		return data.html_url;
	// 	}
	// }
	// );

	opportunity.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(opportunity);
		}
	});
	*/
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
		console.log ('NOT ALLOWED');
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
	console.log ('got here with opp', req.opportunity);

	//
	// save
	//
	updateSave (opportunity)
	.then (function () {
		var data = setNotificationData (opportunity);
		// console.log ('++ update notification data', data);
		if (opportunity.isPublished) {
			Notifications.notifyObject ('not-updateany-opportunity', data);
			Notifications.notifyObject ('not-update-'+opportunity.code, data);
		}
		res.json (decorate (opportunity, req.user ? req.user.roles : []));
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
		console.log ('NOT ALLOWED');
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
	// console.log ('opportunity.ispublished', opportunity.isPublished);
	// console.log ('firstTime', firstTime);
	// console.log ('isToBePublished', isToBePublished);

	//
	// save and notify
	//
	updateSave (opportunity)
	.then (function () {
		var data = setNotificationData (opportunity);
		// console.log ('++ publish notification data', data);
		if (firstTime)   Notifications.notifyObject ('not-add-opportunity'             , data);
		else if (isToBePublished) {
			Notifications.notifyObject ('not-update-'+opportunity.code, data);
			Notifications.notifyObject ('not-updateany-opportunity', data);
		}
		// if (!isToBePublished) Notifications.notifyObject ('not-unpublish-'+opportunity.code , data);
		// else if (firstTime)   Notifications.notifyObject ('not-add-opportunity'             , data);
		// else                  Notifications.notifyObject ('not-republish-'+opportunity.code , data);
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
// delete the opportunity
//
// -------------------------------------------------------------------------
exports.delete = function (req, res) {
	// console.log ('Deleting');
	if (ensureAdmin (req.opportunity, req.user, res)) {
		// console.log ('Deleting');

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
	// Opportunity.find (searchTerm (req))
	// .sort([['deadline', -1],['name', 1]])
	// .populate('createdBy', 'displayName')
	// .populate('updatedBy', 'displayName')
	// .populate('project', 'code name _id isPublished')
	// .populate('program', 'code title _id logo isPublished')
	// .exec(function (err, opportunities) {
	// 	if (err) {
	// 		return res.status(422).send({
	// 			message: errorHandler.getErrorMessage(err)
	// 		});
	// 	} else {
	// 		res.json (decorateList (opportunities, req.user ? req.user.roles : []));
	// 		// res.json(opportunities);
	// 	}
	// });
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
exports.confirmMember = function (req, res) {
	var user = req.model;
	// console.log ('++++ confirm member ', user.username, user._id);
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
	// console.log ('++++ deny member ', user.username, user._id);
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
	// Opportunity.find(searchTerm (req, {project:req.project._id})).sort('name')
	// .populate('createdBy', 'displayName')
	// .populate('updatedBy', 'displayName')
	// .exec(function (err, opportunities) {
	// 	if (err) {
	// 		return res.status(422).send({
	// 			message: errorHandler.getErrorMessage(err)
	// 		});
	// 	} else {
	// 		res.json (decorateList (opportunities, req.user ? req.user.roles : []));
	// 		// res.json(opportunities);
	// 	}
	// });
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
	// Opportunity.find(searchTerm (req, {program:req.program._id})).sort('name')
	// .populate('createdBy', 'displayName')
	// .populate('updatedBy', 'displayName')
	// .exec(function (err, opportunities) {
	// 	if (err) {
	// 		return res.status(422).send({
	// 			message: errorHandler.getErrorMessage(err)
	// 		});
	// 	} else {
	// 		res.json (decorateList (opportunities, req.user ? req.user.roles : []));
	// 		// res.json(opportunities);
	// 	}
	// });
};

// -------------------------------------------------------------------------
//
// new empty opportunity
//
// -------------------------------------------------------------------------
exports.new = function (req, res) {
	// console.log ('get a new opportunity set up and return it');
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
