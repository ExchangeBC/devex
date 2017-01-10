'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Projects Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin','gov'],
    allows: [{
      resources: '/api/projects',
      permissions: '*'
    }, {
      resources: '/api/new/activity',
      permissions: ['get']
    }, {
      resources: '/api/projects/members/:projectId',
      permissions: ['get']
    }, {
      resources: '/api/projects/requests/:projectId',
      permissions: ['get']
    }, {
      resources: '/api/projects/requests/confirm/:projectId/:userId',
      permissions: ['get']
    }, {
      resources: '/api/projects/requests/deny/:projectId/:userId',
      permissions: ['get']
    }, {
      resources: '/api/projects/:projectId',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/projects',
      permissions: ['get']
    }, {
      resources: '/api/projects/members/:projectId',
      permissions: ['get']
    }, {
      resources: '/api/projects/requests/:projectId',
      permissions: ['get']
    }, {
      resources: '/api/my/projects',
      permissions: ['get']
    }, {
      resources: '/api/myadmin/projects',
      permissions: ['get']
    }, {
      resources: '/api/projects/members/:projectId/confirm/:userId',
      permissions: ['get']
    }, {
      resources: '/api/projects/requests/:projectId/deny/:userId',
      permissions: ['get']
    }, {
      resources: '/api/projects/:projectId',
      permissions: ['get']
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/projects',
      permissions: ['get']
    }, {
      resources: '/api/projects/members/:projectId',
      permissions: ['get']
    }, {
      resources: '/api/projects/:projectId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Projects Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an Project is being processed and the current user created it then allow any manipulation
  if (req.project && req.user && req.project.user && req.project.user.id === req.user.id) {
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
