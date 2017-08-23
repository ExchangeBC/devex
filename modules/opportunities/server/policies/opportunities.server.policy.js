'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Opportunities Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin','gov'],
    allows: [{
      resources: '/api/opportunities',
      permissions: '*'
    }, {
      resources: '/api/new/activity',
      permissions: ['get']
    }, {
      resources: '/api/opportunities/members/:opportunityId',
      permissions: ['get']
    }, {
      resources: '/api/opportunities/requests/:opportunityId',
      permissions: ['get']
    }, {
      resources: '/api/opportunities/requests/confirm/:opportunityId/:userId',
      permissions: ['get']
    }, {
      resources: '/api/opportunities/requests/deny/:opportunityId/:userId',
      permissions: ['get']
    }, {
      resources: '/api/opportunities/publish/:opportunityId',
      permissions: ['*']
    }, {
      resources: '/api/opportunities/unassign/:opportunityId',
      permissions: ['*']
    }, {
      resources: '/api/opportunities/:opportunityId',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/opportunities',
      permissions: ['get']
    }, {
      resources: '/api/opportunities/members/:opportunityId',
      permissions: ['get']
    }, {
      resources: '/api/opportunities/requests/:opportunityId',
      permissions: ['get']
    }, {
      resources: '/api/my/opportunities',
      permissions: ['get']
    }, {
      resources: '/api/opportunities/members/:opportunityId/confirm/:userId',
      permissions: ['get']
    }, {
      resources: '/api/opportunities/requests/:opportunityId/deny/:userId',
      permissions: ['get']
    }, {
      resources: '/api/opportunities/publish/:opportunityId',
      permissions: ['*']
   }, {
      resources: '/api/opportunities/:opportunityId',
      permissions: ['get']
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/opportunities',
      permissions: ['get']
    }, {
      resources: '/api/opportunities/members/:opportunityId',
      permissions: ['get']
    }, {
      resources: '/api/opportunities/:opportunityId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Opportunities Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an Opportunity is being processed and the current user created it then allow any manipulation
  if (req.opportunity && req.user && req.opportunity.user && req.opportunity.user.id === req.user.id) {
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
