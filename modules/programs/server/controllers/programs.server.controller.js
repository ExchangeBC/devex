'use strict';
/*

Notes about programs

Roles:
------
Membership in a program is defined by the user having various roles attached to their
user record. There are only three possible states: admin, member, or request.
When a user requests membership they get the request role only, once accepted that
simply gets changed to the member role. Roles are simply the program code with suffixes.

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
	Program = mongoose.model('Program'),
	errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
	helpers = require(path.resolve('./modules/core/server/controllers/core.server.helpers')),
	Opportunities = require(path.resolve('./modules/opportunities/server/controllers/opportunities.server.controller')),
	Projects = require(path.resolve('./modules/projects/server/controllers/projects.server.controller')),
	multer = require('multer'),
	_ = require('lodash'),
	Notifications = require(path.resolve('./modules/notifications/server/controllers/notifications.server.controller'))
	;

// -------------------------------------------------------------------------
//
// set a program role on a user
//
// -------------------------------------------------------------------------
var adminRole = function (program) {
	return program.code+'-admin';
};
var memberRole = function (program) {
	return program.code;
};
var requestRole = function (program) {
	return program.code+'-request';
};
var setProgramMember = function (program, user) {
	user.addRoles ([memberRole(program)]);
};
var setProgramAdmin = function (program, user) {
	user.addRoles ([memberRole(program), adminRole(program)]);
};
var setProgramRequest = function (program, user) {
	user.addRoles ([requestRole(program)]);
};
var unsetProgramMember = function (program, user) {
	user.removeRoles ([memberRole(program)]);
};
var unsetProgramAdmin = function (program, user) {
	user.removeRoles ([memberRole(program), adminRole(program)]);
};
var unsetProgramRequest = function (program, user) {
	// console.log ('remove role ', requestRole(program));
	user.removeRoles ([requestRole(program)]);
};
var ensureAdmin = function (program, user, res) {
	if (!~user.roles.indexOf (adminRole(program)) && !~user.roles.indexOf ('admin')) {
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
// -------------------------------------------------------------------------
//
// this takes a program model, serializes it, and decorates it with what
// relationship the user has to the program, and returns the JSON
//
// -------------------------------------------------------------------------
var decorate = function (programModel, roles) {
	var program = programModel ? programModel.toJSON () : {};
	program.userIs = {
		admin   : !!~roles.indexOf (adminRole(program)),
		member  : !!~roles.indexOf (memberRole(program)),
		request : !!~roles.indexOf (requestRole(program)),
		gov     : !!~roles.indexOf ('gov')
	};
	return program;
};
// -------------------------------------------------------------------------
//
// decorate an entire list of programs
//
// -------------------------------------------------------------------------
var decorateList = function (programModels, roles) {
	return programModels.map (function (programModel) {
		return decorate (programModel, roles);
	});
};
// -------------------------------------------------------------------------
//
// get a list of all my programs, but only ones I have access to as a normal
// member or admin, just not as request
//
// -------------------------------------------------------------------------
exports.my = function (req, res) {
	var me = helpers.myStuff ((req.user && req.user.roles)? req.user.roles : null );
	var search = me.isAdmin ? {} : { code: { $in: me.programs.member } };
	Program.find (search)
	.select ('code title short')
	.exec (function (err, programs) {
		if (err) {
			return res.status(422).send ({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (programs);
		}
	});
};
exports.myadmin = function (req, res) {
	var me = helpers.myStuff ((req.user && req.user.roles)? req.user.roles : null );
	var search = me.isAdmin ? {} : { code: { $in: me.programs.admin } };
	Program.find (search)
	.select ('code title short')
	.exec (function (err, programs) {
		if (err) {
			return res.status(422).send ({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (programs);
		}
	});
};
// -------------------------------------------------------------------------
//
// return a list of all program members. this means all members NOT
// including users who have requested access and are currently waiting
//
// -------------------------------------------------------------------------
exports.members = function (program, cb) {
	mongoose.model ('User').find ({roles: memberRole(program)}).select ('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle').exec (cb);
};

// -------------------------------------------------------------------------
//
// return a list of all users who are currently waiting to be added to the
// program member list
//
// -------------------------------------------------------------------------
exports.requests = function (program, cb) {
	mongoose.model ('User').find ({roles: requestRole(program)}).select ('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle').exec (cb);
};

// -------------------------------------------------------------------------
//
// create a new program. the user doing the creation will be set as the
// administrator
//
// -------------------------------------------------------------------------
exports.create = function (req, res) {
	// console.log ('Creating a new program');
	var program = new Program(req.body);
	//
	// set the code, this is used for setting roles and other stuff
	//
	Program.findUniqueCode (program.title, null, function (newcode) {
		program.code = newcode;
		//
		// set the audit fields so we know who did what when
		//
		helpers.applyAudit (program, req.user)
		//
		// save and return
		//
		program.save(function (err) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				setProgramAdmin (program, req.user);
				req.user.save ();
				Notifications.addNotification ({
					code: 'not-update-'+program.code,
					name: 'Update of Program '+program.name,
					// description: 'Update of Program '+program.name,
					target: 'Program',
					event: 'Update'
				});
				res.json(program);
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
	res.json (decorate (req.program, req.user ? req.user.roles : []));
};

// -------------------------------------------------------------------------
//
// update the document, make sure to apply audit. We don't mess with the
// code if they change the title as that would mean reworking all the roles
//
// -------------------------------------------------------------------------
exports.update = function (req, res) {
	if (ensureAdmin (req.program, req.user, res)) {
		var wasPublished = req.program.isPublished;
		var isPublished = req.body.isPublished;
		if (!wasPublished && isPublished) {
			Projects.rePublishProjects (req.program._id);
			Opportunities.rePublishOpportunities (req.program._id, null);
		}
		else if (wasPublished && !isPublished) {
			Projects.unPublishProjects (req.program._id);
			Opportunities.unPublishOpportunities (req.program._id, null);
		}
		//
		// copy over everything passed in. This will overwrite the
		// audit fields, but they get updated in the following step
		//
		var program = _.assign (req.program, req.body);
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
				notificationCodes = ['not-updateany-program', 'not-update-'+program.code];
			} else {
				//
				// this is an add as it is the first time being published
				//
				notificationCodes = ['not-add-program'];
			}
		}

		program.wasPublished = (program.isPublished || program.wasPublished);
		//
		// set the audit fields so we know who did what when
		//
		helpers.applyAudit (program, req.user)
		//
		// save
		//
		program.save(function (err) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				program.link = 'https://'+(process.env.DOMAIN || 'localhost')+'/programs/'+program.code;
				Promise.all (notificationCodes.map (function (code) {
					return Notifications.notifyObject (code, program);
				}))
				.catch (function (err) {
					console.log (err);
				})
				.then (function () {
					res.json (decorate (program, req.user ? req.user.roles : []));
				});
				// // res.json(program);
				// res.json (decorate (program, req.user ? req.user.roles : []));
			}
		});
	}
};

// -------------------------------------------------------------------------
//
// delete the program
//
// -------------------------------------------------------------------------
exports.delete = function (req, res) {
	// console.log ('Deleting');
	if (ensureAdmin (req.program, req.user, res)) {
		// console.log ('Deleting');

		var program = req.program;
		program.remove(function (err) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.json(program);
			}
		});
	}
};

// -------------------------------------------------------------------------
//
// return a list of all programs
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
	var me = helpers.myStuff ((req.user && req.user.roles)? req.user.roles : null );
	var search = me.isAdmin ? {} : {$or: [{isPublished:true}, {code: {$in: me.programs.admin}}]}
	Program.find(search).sort('title')
	.populate('createdBy', 'displayName')
	.populate('updatedBy', 'displayName')
	.exec(function (err, programs) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (decorateList (programs, req.user ? req.user.roles : []));
			// res.json(programs);
		}
	});
};

// -------------------------------------------------------------------------
//
// this is the service front to the members call
//
// -------------------------------------------------------------------------
exports.listMembers = function (req, res) {
	exports.members (req.program, function (err, users) {
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
	exports.requests (req.program, function (err, users) {
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
	setProgramRequest (req.program, req.user);
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
	unsetProgramRequest (req.program, user);
	setProgramMember (req.program, user);
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
	unsetProgramRequest (req.program, user);
	unsetProgramMember (req.program, user);
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
// new empty program
//
// -------------------------------------------------------------------------
exports.new = function (req, res) {
	// console.log ('get a new program set up and return it');
	var p = new Program ();
	res.json(p);
};

// -------------------------------------------------------------------------
//
// magic that populates the program on the request
//
// -------------------------------------------------------------------------
exports.programByID = function (req, res, next, id) {
	if (id.substr (0, 3) === 'pro' ) {
		Program.findOne({code:id})
		.populate('createdBy', 'displayName')
		.populate('updatedBy', 'displayName')
		.exec(function (err, program) {
			if (err) {
				return next(err);
			} else if (!program) {
				return res.status(404).send({
					message: 'No program with that identifier has been found'
				});
			}
			req.program = program;
			next();
		});

	} else {

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).send({
				message: 'Program is invalid'
			});
		}

		Program.findById(id)
		.populate('createdBy', 'displayName')
		.populate('updatedBy', 'displayName')
		.exec(function (err, program) {
			if (err) {
				return next(err);
			} else if (!program) {
				return res.status(404).send({
					message: 'No program with that identifier has been found'
				});
			}
			req.program = program;
			next();
		});
	}
};
// -------------------------------------------------------------------------
//
// Logo upload
//
// -------------------------------------------------------------------------
exports.logo = function (req, res) {
	var program       = req.program;
	var storage = multer.diskStorage (config.uploads.diskStorage);
	var upload = multer({storage: storage}).single('logo');
	// var upload        = multer (config.uploads.fileUpload).single ('logo');
	upload.fileFilter = require(path.resolve('./config/lib/multer')).profileUploadFileFilter;
	var up            = helpers.fileUploadFunctions (program, Program, 'logo', req, res, upload, program.logo);

	if (program) {
		up.uploadImage ()
		.then (up.updateDocument)
		.then (up.deleteOldImage)
		.then (function () {
			// console.log ('program', program);
			res.json (program);
		})
		.catch (function (err) {
			res.status(422).send(err);
		});
	} else {
		res.status(401).send({
			message: 'invalid program or program not supplied'
		});
	}
};

