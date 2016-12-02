'use strict';
/*

Notes about activities

Roles:
------
Membership in a activity is defined by the user having various roles attached to their
user record. There are only three possible states: admin, member, or request.
When a user requests membership they get the request role only, once accepted that
simply gets changed to the member role. Roles are simply the activity code with suffixes.

member  : <code>
admin   : <code>-admin
request : <code>-request

*/

'use strict';


/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Activity = mongoose.model('Activity'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  helpers = require(path.resolve('./modules/core/server/controllers/core.server.helpers')),
  _ = require('lodash')
  ;

// -------------------------------------------------------------------------
//
// set a activity role on a user
//
// -------------------------------------------------------------------------
var adminRole = function (activity) {
  return activity.code+'-admin';
};
var memberRole = function (activity) {
  return activity.code;
};
var requestRole = function (activity) {
  return activity.code+'-request';
};
var setActivityMember = function (activity, user) {
  user.addRoles ([memberRole(activity)]);
};
var setActivityAdmin = function (activity, user) {
  user.addRoles ([memberRole(activity), adminRole(activity)]);
};
var setActivityRequest = function (activity, user) {
  user.addRoles ([requestRole(activity)]);
};
var unsetActivityMember = function (activity, user) {
  user.removeRoles ([memberRole(activity)]);
};
var unsetActivityAdmin = function (activity, user) {
  user.removeRoles ([memberRole(activity), adminRole(activity)]);
};
var unsetActivityRequest = function (activity, user) {
  console.log ('remove role ', requestRole(activity));
  user.removeRoles ([requestRole(activity)]);
};
var ensureAdmin = function (activity, user, res) {
  if (!~user.roles.indexOf (adminRole(activity)) && !~user.roles.indexOf ('admin')) {
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
// this takes a activity model, serializes it, and decorates it with what
// relationship the user has to the activity, and returns the JSON
//
// -------------------------------------------------------------------------
var decorate = function (activityModel, roles) {
  var activity = activityModel ? activityModel.toJSON () : {};
  activity.userIs = {
    admin   : !!~roles.indexOf (adminRole(activity)) || !!~roles.indexOf ('admin'),
    member  : !!~roles.indexOf (memberRole(activity)),
    request : !!~roles.indexOf (requestRole(activity)),
    gov     : !!~roles.indexOf ('gov')
  };
  return activity;
};
// -------------------------------------------------------------------------
//
// decorate an entire list of activities
//
// -------------------------------------------------------------------------
var decorateList = function (activityModels, roles) {
  return activityModels.map (function (activityModel) {
    return decorate (activityModel, roles);
  });
};
// -------------------------------------------------------------------------
//
// return a list of all activity members. this means all members NOT
// including users who have requested access and are currently waiting
//
// -------------------------------------------------------------------------
exports.members = function (activity, cb) {
  mongoose.model ('User').find ({roles: memberRole(activity)}).exec (cb);
};

// -------------------------------------------------------------------------
//
// return a list of all users who are currently waiting to be added to the
// activity member list
//
// -------------------------------------------------------------------------
exports.requests = function (activity, cb) {
  mongoose.model ('User').find ({roles: requestRole(activity)}).exec (cb);
};

// -------------------------------------------------------------------------
//
// create a new activity. the user doing the creation will be set as the
// administrator
//
// -------------------------------------------------------------------------
exports.create = function (req, res) {
  console.log ('Creating a new activity');
  var activity = new Activity(req.body);
  //
  // set the code, this is used for setting roles and other stuff
  //
  Activity.findUniqueCode (activity.title, null, function (newcode) {
    activity.code = newcode;
    //
    // set the audit fields so we know who did what when
    //
    helpers.applyAudit (activity, req.user)
    //
    // save and return
    //
    activity.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        setActivityAdmin (activity, req.user);
        req.user.save ();
        res.json(activity);
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
  res.json (decorate (req.activity, req.user ? req.user.roles : []));
};

// -------------------------------------------------------------------------
//
// update the document, make sure to apply audit. We don't mess with the
// code if they change the title as that would mean reworking all the roles
//
// -------------------------------------------------------------------------
exports.update = function (req, res) {
  if (ensureAdmin (req.activity, req.user, res)) {
    //
    // copy over everything passed in. This will overwrite the
    // audit fields, but they get updated in the following step
    //
    var activity = _.assign (req.activity, req.body);
    //
    // set the audit fields so we know who did what when
    //
    helpers.applyAudit (activity, req.user)
    //
    // save
    //
    activity.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(activity);
      }
    });
  }
};

// -------------------------------------------------------------------------
//
// delete the activity
//
// -------------------------------------------------------------------------
exports.delete = function (req, res) {
  console.log ('Deleting');
  if (ensureAdmin (req.activity, req.user, res)) {
    console.log ('Deleting');

    var activity = req.activity;
    activity.remove(function (err) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(activity);
      }
    });
  }
};

// -------------------------------------------------------------------------
//
// return a list of all activities
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
  Activity.find().sort('title')
  .populate('createdBy', 'displayName')
  .populate('updatedBy', 'displayName')
  .exec(function (err, activities) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json (decorateList (activities, req.user ? req.user.roles : []));
      // res.json(activities);
    }
  });
};

// -------------------------------------------------------------------------
//
// this is the service front to the members call
//
// -------------------------------------------------------------------------
exports.listMembers = function (req, res) {
  exports.members (req.activity, function (err, users) {
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
  exports.requests (req.activity, function (err, users) {
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
  setActivityRequest (req.activity, req.user);
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
  unsetActivityRequest (req.activity, user);
  setActivityMember (req.activity, user);
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
  unsetActivityRequest (req.activity, user);
  unsetActivityMember (req.activity, user);
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
  Activity.find({program:req.program._id}).sort('title')
  .populate('createdBy', 'displayName')
  .populate('updatedBy', 'displayName')
  .exec(function (err, activities) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json (decorateList (activities, req.user ? req.user.roles : []));
      // res.json(activities);
    }
  });
};

// -------------------------------------------------------------------------
//
// new empty activity
//
// -------------------------------------------------------------------------
exports.new = function (req, res) {
  console.log ('get a new activity set up and return it');
  var p = new Activity ();
  res.json(p);
};

// -------------------------------------------------------------------------
//
// magic that populates the activity on the request
//
// -------------------------------------------------------------------------
exports.activityByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Activity is invalid'
    });
  }

  Activity.findById(id)
  .populate('createdBy', 'displayName')
  .populate('updatedBy', 'displayName')
  .exec(function (err, activity) {
    if (err) {
      return next(err);
    } else if (!activity) {
      return res.status(404).send({
        message: 'No activity with that identifier has been found'
      });
    }
    req.activity = activity;
    next();
  });
};

