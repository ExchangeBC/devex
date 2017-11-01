'use strict';
/*

Notes about teams

Roles:
------
Membership in a team is defined by the user having various roles attached to their
user record. There are only three possible states: admin, member, or request.
When a user requests membership they get the request role only, once accepted that
simply gets changed to the member role. Roles are simply the team code with suffixes.

member  : <code>
admin   : <code>-admin
request : <code>-request

*/

/**
 * Module dependencies.
 */
var path = require('path'),
	mongoose = require('mongoose'),
	Team = mongoose.model('Team'),
	errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
	helpers = require(path.resolve('./modules/core/server/controllers/core.server.helpers')),
	Opportunities = require(path.resolve('./modules/opportunities/server/controllers/opportunities.server.controller')),
	_ = require('lodash'),
	Notifications = require(path.resolve('./modules/notifications/server/controllers/notifications.server.controller'))
	;

// -------------------------------------------------------------------------
//
// set a team role on a user
//
// -------------------------------------------------------------------------
var adminRole = function (team) {
	return team.code+'-admin';
};
var memberRole = function (team) {
	return team.code;
};
var requestRole = function (team) {
	return team.code+'-request';
};
var setTeamMember = function (team, user) {
	user.addRoles ([memberRole(team)]);
};
var setTeamAdmin = function (team, user) {
	user.addRoles ([memberRole(team), adminRole(team)]);
};
var setTeamRequest = function (team, user) {
	user.addRoles ([requestRole(team)]);
};
var unsetTeamMember = function (team, user) {
	user.removeRoles ([memberRole(team)]);
};
var unsetTeamAdmin = function (team, user) {
	user.removeRoles ([memberRole(team), adminRole(team)]);
};
var unsetTeamRequest = function (team, user) {
	user.removeRoles ([requestRole(team)]);
};
var ensureAdmin = function (team, user, res) {
	if (!~user.roles.indexOf (adminRole(team)) && !~user.roles.indexOf ('admin')) {
		res.status(422).send({
			message: 'User Not Authorized'
		});
		return false;
	} else {
		return true;
	}
};
var forProgram = function (id) {
	return new Promise (function (resolve, reject) {
		Team.find ({program:id}).exec ().then (resolve, reject);
	});
};
var searchTerm = function (req, opts) {
	opts = opts || {};
	var me = helpers.myStuff ((req.user && req.user.roles)? req.user.roles : null );
	if (!me.isAdmin) {
		opts['$or'] = [{isPublished:true}, {code: {$in: me.teams.admin}}];
	}
	return opts;
};
// -------------------------------------------------------------------------
//
// this takes a team model, serializes it, and decorates it with what
// relationship the user has to the team, and returns the JSON
//
// -------------------------------------------------------------------------
var decorate = function (teamModel, roles) {
	var team = teamModel ? teamModel.toJSON () : {};
	team.userIs = {
		admin   : !!~roles.indexOf (adminRole(team)),
		member  : !!~roles.indexOf (memberRole(team)),
		request : !!~roles.indexOf (requestRole(team)),
		gov     : !!~roles.indexOf ('gov')
	};
	return team;
};
// -------------------------------------------------------------------------
//
// decorate an entire list of teams
//
// -------------------------------------------------------------------------
var decorateList = function (teamModels, roles) {
	return teamModels.map (function (teamModel) {
		return decorate (teamModel, roles);
	});
};
// -------------------------------------------------------------------------
//
// get a list of all my teams, but only ones I have access to as a normal
// member or admin, just not as request
//
// -------------------------------------------------------------------------
exports.my = function (req, res) {
	var me = helpers.myStuff ((req.user && req.user.roles)? req.user.roles : null );
	var search = me.isAdmin ? {} : { code: { $in: me.teams.member } };
	Team.find (search)
	.select ('code name short')
	.exec (function (err, teams) {
		if (err) {
			return res.status(422).send ({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (teams);
		}
	});
};
exports.myadmin = function (req, res) {
	Team.find (searchTerm (req))
	.populate ('program', 'code title short logo')
	.select ('code name short program')
	.exec (function (err, teams) {
		if (err) {
			return res.status(422).send ({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (teams);
		}
	});
};
// -------------------------------------------------------------------------
//
// return a list of all team members. this means all members NOT
// including users who have requested access and are currently waiting
//
// -------------------------------------------------------------------------
exports.members = function (team, cb) {
	mongoose.model ('User').find ({roles: memberRole(team)}).select ('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle').exec (cb);
};

// -------------------------------------------------------------------------
//
// return a list of all users who are currently waiting to be added to the
// team member list
//
// -------------------------------------------------------------------------
exports.requests = function (team, cb) {
	mongoose.model ('User').find ({roles: requestRole(team)}).select ('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle').exec (cb);
};

/**
 * Create a Team
 */
// -------------------------------------------------------------------------
//
// create a new team. the user doing the creation will be set as the
// administrator
//
// -------------------------------------------------------------------------
exports.create = function(req, res) {
	var team = new Team(req.body);
	//
	// set the code, this is used for setting roles and other stuff
	//
	Team.findUniqueCode (team.name, null, function (newcode) {
		team.code = newcode;
		//
		// set the audit fields so we know who did what when
		//
		helpers.applyAudit (team, req.user)
		//
		// save and return
		//
		team.save(function (err) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				setTeamAdmin (team, req.user);
				req.user.save ();
				Notifications.addNotification ({
					code: 'not-update-'+team.code,
					name: 'Update of Team '+team.name,
					target: 'Team',
					event: 'Update'
				});
				res.json(team);
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
	res.json (decorate (req.team, req.user ? req.user.roles : []));
};

// -------------------------------------------------------------------------
//
// update the document, make sure to apply audit. We don't mess with the
// code if they change the name as that would mean reworking all the roles
//
// -------------------------------------------------------------------------
exports.update = function (req, res) {
	if (ensureAdmin (req.team, req.user, res)) {
		var wasPublished = req.team.isPublished;
		var isPublished = req.body.isPublished;
		if (!wasPublished && isPublished) {
			Opportunities.rePublishOpportunities (req.team.program._id, req.team._id);
		}
		else if (wasPublished && !isPublished) {
			Opportunities.unPublishOpportunities (req.team.program._id, req.team._id);
		}
		//
		// copy over everything passed in. This will overwrite the
		// audit fields, but they get updated in the following step
		//
		var team = _.assign (req.team, req.body);
		//
		// determine what notify actions we want to send out, if any
		// if not published, then we send nothing
		//
		var notificationCodes = [];
		var doNotNotify = _.isNil(req.body.doNotNotify) ? true : req.body.doNotNotify;
		if (isPublished && !doNotNotify) {
			if (wasPublished) {
				//
				// this is an update, we send both specific and general
				//
				notificationCodes = ['not-updateany-team', 'not-update-'+team.code];
			} else {
				//
				// this is an add as it is the first time being published
				//
				notificationCodes = ['not-add-team'];
			}
		}

		team.wasPublished = (team.isPublished || team.wasPublished);

		//
		// set the audit fields so we know who did what when
		//
		helpers.applyAudit (team, req.user)
		//
		// save
		//
		team.save(function (err) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				team.link = 'https://'+(process.env.DOMAIN || 'localhost')+'/teams/'+team.code;
				Promise.all (notificationCodes.map (function (code) {
					return Notifications.notifyObject (code, team);
				}))
				.catch (function () {
				})
				.then (function () {
					res.json (decorate (team, req.user ? req.user.roles : []));
				});
			}
		});
	}
};

// -------------------------------------------------------------------------
//
// delete the team
//
// -------------------------------------------------------------------------
exports.delete = function (req, res) {
	if (ensureAdmin (req.team, req.user, res)) {

		var team = req.team;
		team.remove(function (err) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.json(team);
			}
		});
	}
};

// -------------------------------------------------------------------------
//
// return a list of all teams
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
	Team.find(searchTerm (req)).sort('activity name')
	.populate('createdBy', 'displayName')
	.populate('updatedBy', 'displayName')
	.populate('program', 'code title logo isPublished')
	.exec(function (err, teams) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (decorateList (teams, req.user ? req.user.roles : []));
		}
	});
};

// -------------------------------------------------------------------------
//
// this is the service front to the members call
//
// -------------------------------------------------------------------------
exports.listMembers = function (req, res) {
	exports.members (req.team, function (err, users) {
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
	exports.requests (req.team, function (err, users) {
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
	setTeamRequest (req.team, req.user);
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
	unsetTeamRequest (req.team, user);
	setTeamMember (req.team, user);
	user.save (function (err, result) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (result);
		}
	});
};
exports.denyMember = function (req, res) {
	var user = req.model;
	unsetTeamRequest (req.team, user);
	unsetTeamMember (req.team, user);
	user.save (function (err, result) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (result);
		}
	});
};

// -------------------------------------------------------------------------
//
// get teams under program
//
// -------------------------------------------------------------------------
exports.forProgram = function (req, res) {
	Team.find(searchTerm (req, {program:req.program._id})).sort('name')
	.populate('createdBy', 'displayName')
	.populate('updatedBy', 'displayName')
	.exec(function (err, teams) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (decorateList (teams, req.user ? req.user.roles : []));
		}
	});
};

// -------------------------------------------------------------------------
//
// new empty team
//
// -------------------------------------------------------------------------
exports.new = function (req, res) {
	var p = new Team ();
	res.json(p);
};

// -------------------------------------------------------------------------
//
// magic that populates the team on the request
//
// -------------------------------------------------------------------------
exports.teamByID = function (req, res, next, id) {
	if (id.substr (0, 3) === 'prj' ) {
		Team.findOne({code:id})
		.populate('createdBy', 'displayName')
		.populate('updatedBy', 'displayName')
		.populate('program', 'code title logo isPublished')
		.exec(function (err, team) {
			if (err) {
				return next(err);
			} else if (!team) {
				return res.status(404).send({
					message: 'No team with that identifier has been found'
				});
			}
			req.team = team;
			next();
		});

	} else {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).send({
				message: 'Team is invalid'
			});
		}

		Team.findById(id)
		.populate('createdBy', 'displayName')
		.populate('updatedBy', 'displayName')
		.populate('program', 'code title logo isPublished')
		.exec(function (err, team) {
			if (err) {
				return next(err);
			} else if (!team) {
				return res.status(404).send({
					message: 'No team with that identifier has been found'
				});
			}
			req.team = team;
			next();
		});
	}
};

// -------------------------------------------------------------------------
//
// publish or unpublish whole sets of teams by program id
//
// -------------------------------------------------------------------------
exports.rePublishTeams = function (programId) {
	return forProgram (programId)
	.then (function (teams) {
		return Promise.all (teams.map (function (team) {
			team.isPublished = team.wasPublished;
			return team.save ();
		}));
	});
};
exports.unPublishTeams = function (programId) {
	return forProgram (programId)
	.then (function (teams) {
		return Promise.all (teams.map (function (team) {
			team.wasPublished = team.isPublished;
			team.isPublished = false;
			return team.save ();
		}));
	});
};
