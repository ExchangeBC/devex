'use strict';
/*

Notes about projects

Roles:
------
Membership in a project is defined by the user having various roles attached to their
user record. There are only three possible states: admin, member, or request.
When a user requests membership they get the request role only, once accepted that
simply gets changed to the member role. Roles are simply the project code with suffixes.

member  : <code>
admin   : <code>-admin
request : <code>-request

*/

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Project = mongoose.model('Project'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  helpers = require(path.resolve('./modules/core/server/controllers/core.server.helpers')),
  _ = require('lodash');

// -------------------------------------------------------------------------
//
// set a project role on a user
//
// -------------------------------------------------------------------------
var adminRole = function (project) {
  return project.code+'-admin';
};
var memberRole = function (project) {
  return project.code;
};
var requestRole = function (project) {
  return project.code+'-request';
};
var setProjectMember = function (project, user) {
  user.addRoles ([memberRole(project)]);
};
var setProjectAdmin = function (project, user) {
  user.addRoles ([memberRole(project), adminRole(project)]);
};
var setProjectRequest = function (project, user) {
  user.addRoles ([requestRole(project)]);
};
var unsetProjectMember = function (project, user) {
  user.removeRoles ([memberRole(project)]);
};
var unsetProjectAdmin = function (project, user) {
  user.removeRoles ([memberRole(project), adminRole(project)]);
};
var unsetProjectRequest = function (project, user) {
  console.log ('remove role ', requestRole(project));
  user.removeRoles ([requestRole(project)]);
};
var ensureAdmin = function (project, user, res) {
  if (!~user.roles.indexOf (adminRole(project)) && !~user.roles.indexOf ('admin')) {
    console.log ('NOT admin');
    res.status(422).send({
      message: 'User Not Authorized'
    });
    return false;
  } else {
    console.log ('Is admin');
    return true;
  }
};
// -------------------------------------------------------------------------
//
// this takes a project model, serializes it, and decorates it with what
// relationship the user has to the project, and returns the JSON
//
// -------------------------------------------------------------------------
var decorate = function (projectModel, roles) {
  var project = projectModel ? projectModel.toJSON () : {};
  project.userIs = {
    admin   : !!~roles.indexOf (adminRole(project)) || !!~roles.indexOf ('admin'),
    member  : !!~roles.indexOf (memberRole(project)),
    request : !!~roles.indexOf (requestRole(project)),
    gov     : !!~roles.indexOf ('gov')
  };
  return project;
};
// -------------------------------------------------------------------------
//
// decorate an entire list of projects
//
// -------------------------------------------------------------------------
var decorateList = function (projectModels, roles) {
  return projectModels.map (function (projectModel) {
    return decorate (projectModel, roles);
  });
};
// -------------------------------------------------------------------------
//
// return a list of all project members. this means all members NOT
// including users who have requested access and are currently waiting
//
// -------------------------------------------------------------------------
exports.members = function (project, cb) {
  mongoose.model ('User').find ({roles: memberRole(project)}).exec (cb);
};

// -------------------------------------------------------------------------
//
// return a list of all users who are currently waiting to be added to the
// project member list
//
// -------------------------------------------------------------------------
exports.requests = function (project, cb) {
  mongoose.model ('User').find ({roles: requestRole(project)}).exec (cb);
};

/**
 * Create a Project
 */
// -------------------------------------------------------------------------
//
// create a new project. the user doing the creation will be set as the
// administrator
//
// -------------------------------------------------------------------------
exports.create = function(req, res) {
  console.log ('Creating a new project');
  var project = new Project(req.body);
  //
  // set the code, this is used for setting roles and other stuff
  //
  Project.findUniqueCode (project.name, null, function (newcode) {
    project.code = newcode;
    //
    // set the audit fields so we know who did what when
    //
    helpers.applyAudit (project, req.user)
    //
    // save and return
    //
    project.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        setProjectAdmin (project, req.user);
        req.user.save ();
        res.json(project);
      }
    });
  });

/*

GITHUB related stuff

  var project = new Project(req.body);
  project.user = req.user;

  var http = require('http');
  var github = require('octonode');
  var config = require('/config/config.js');

  // curl -u "[github account]:[secret]" https://api.github.com/user/repos -d '{"name":"'helloGit'"}'

  var url = 'https://api.github.com/user/repos';
  var user = config.github.clientID;  // tested with 'dewolfe001';
  var secret = config.github.clientSecret; // tested  with '39c1cffc1008ed43189ecd27448bd903a75778eb' (since revoked);

  var client = github.client({
	id: user,
    secret: secret
  });

 //  project.github = client.repo({
	// 'name': project.name,
	// 'description' : project.description
	// },  function (err, data) {
	// 	if (err) {
	// 		return console.error(err);
	// 	}
	// 	else {
	// 		return data.html_url;
	// 	}
	// }
  // );

  project.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(project);
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
  res.json (decorate (req.project, req.user ? req.user.roles : []));
};

// -------------------------------------------------------------------------
//
// update the document, make sure to apply audit. We don't mess with the
// code if they change the name as that would mean reworking all the roles
//
// -------------------------------------------------------------------------
exports.update = function (req, res) {
  if (ensureAdmin (req.project, req.user, res)) {
    //
    // copy over everything passed in. This will overwrite the
    // audit fields, but they get updated in the following step
    //
    var project = _.assign (req.project, req.body);
    //
    // set the audit fields so we know who did what when
    //
    helpers.applyAudit (project, req.user)
    //
    // save
    //
    project.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(project);
      }
    });
  }
};

// -------------------------------------------------------------------------
//
// delete the project
//
// -------------------------------------------------------------------------
exports.delete = function (req, res) {
  console.log ('Deleting');
  if (ensureAdmin (req.project, req.user, res)) {
    console.log ('Deleting');

    var project = req.project;
    project.remove(function (err) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(project);
      }
    });
  }
};

// -------------------------------------------------------------------------
//
// return a list of all projects
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
  Project.find().sort('name')
  .populate('createdBy', 'displayName')
  .populate('updatedBy', 'displayName')
  .exec(function (err, projects) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json (decorateList (projects, req.user ? req.user.roles : []));
      // res.json(projects);
    }
  });
};

// -------------------------------------------------------------------------
//
// this is the service front to the members call
//
// -------------------------------------------------------------------------
exports.listMembers = function (req, res) {
  exports.members (req.project, function (err, users) {
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
  exports.requests (req.project, function (err, users) {
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
  setProjectRequest (req.project, req.user);
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
  console.log ('++++ confirm member ', user.username, user._id);
  unsetProjectRequest (req.project, user);
  setProjectMember (req.project, user);
  user.save (function (err, result) {
    if (err) {
      return res.status (422).send ({
        message: errorHandler.getErrorMessage (err)
      });
    } else {
      console.log ('---- member roles ', result.roles);
      res.json (result);
    }
  });
};
exports.denyMember = function (req, res) {
  var user = req.model;
  console.log ('++++ deny member ', user.username, user._id);
  unsetProjectRequest (req.project, user);
  unsetProjectMember (req.project, user);
  user.save (function (err, result) {
    if (err) {
      return res.status (422).send ({
        message: errorHandler.getErrorMessage (err)
      });
    } else {
      console.log ('---- member roles ', result.roles);
      res.json (result);
    }
  });
};

// -------------------------------------------------------------------------
//
// get projects under program
//
// -------------------------------------------------------------------------
exports.forProgram = function (req, res) {
  Project.find({program:req.program._id}).sort('name')
  .populate('createdBy', 'displayName')
  .populate('updatedBy', 'displayName')
  .exec(function (err, projects) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json (decorateList (projects, req.user ? req.user.roles : []));
      // res.json(projects);
    }
  });
};

// -------------------------------------------------------------------------
//
// new empty project
//
// -------------------------------------------------------------------------
exports.new = function (req, res) {
  console.log ('get a new project set up and return it');
  var p = new Project ();
  res.json(p);
};

// -------------------------------------------------------------------------
//
// magic that populates the project on the request
//
// -------------------------------------------------------------------------
exports.projectByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Project is invalid'
    });
  }

  Project.findById(id)
  .populate('createdBy', 'displayName')
  .populate('updatedBy', 'displayName')
  .exec(function (err, project) {
    if (err) {
      return next(err);
    } else if (!project) {
      return res.status(404).send({
        message: 'No project with that identifier has been found'
      });
    }
    req.project = project;
    next();
  });
};
