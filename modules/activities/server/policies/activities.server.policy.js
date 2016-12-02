'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Activities Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin','gov'],
    allows: [{
      resources: '/api/activities',
      permissions: '*'
    }, {
      resources: '/api/new/activity',
      permissions: ['get']
    }, {
      resources: '/api/activities/members/:activityId',
      permissions: ['get']
    }, {
      resources: '/api/activities/requests/:activityId',
      permissions: ['get']
    }, {
      resources: '/api/activities/requests/confirm/:activityId/:userId',
      permissions: ['get']
    }, {
      resources: '/api/activities/requests/deny/:activityId/:userId',
      permissions: ['get']
    }, {
      resources: '/api/activities/:activityId',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/activities',
      permissions: ['get']
    }, {
      resources: '/api/activities/members/:activityId',
      permissions: ['get']
    }, {
      resources: '/api/activities/requests/:activityId',
      permissions: ['get']
    }, {
      resources: '/api/activities/members/:activityId/confirm/:userId',
      permissions: ['get']
    }, {
      resources: '/api/activities/requests/:activityId/deny/:userId',
      permissions: ['get']
    }, {
      resources: '/api/activities/:activityId',
      permissions: ['get']
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/activities',
      permissions: ['get']
    }, {
      resources: '/api/activities/members/:activityId',
      permissions: ['get']
    }, {
      resources: '/api/activities/:activityId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Activities Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];
  console.log ('roles, method, path', roles, req.method, req.route.path);
  // If an activity is being processed and the current user created it then allow any manipulation
  if (req.activity && req.user && req.activity.user && req.activity.user.id === req.user.id) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
