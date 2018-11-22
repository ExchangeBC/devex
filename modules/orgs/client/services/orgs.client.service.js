(function () {
	'use strict';
	angular.module ('orgs.services').factory ('OrgsService', ['$resource', '$log', function ($resource, $log) {
		var Org = $resource ('/api/orgs/:orgId', {
			orgId: '@_id'
		}, {
			update: {
				method: 'PUT'
			},
			list: {
				method: 'GET',
				url: '/api/orgs',
				isArray: true
			},
			my: {
				method: 'GET',
				url: '/api/orgs/my',
				isArray: true
			},
			myadmin: {
				method: 'GET',
				url: '/api/orgs/myadmin',
				isArray: true
			},
			removeUser: {
				method: 'GET',
				url: '/api/orgs/:orgId/user/:userId/remove',
				isArray: false
			},
			addMeToOrg: {
				method: 'GET',
				url: '/api/addmeto/org/:orgId',
				isArray: false
			},
			removeMeFromOrg: {
				method: 'GET',
				url: '/api/orgs/:orgId/removeMeFromCompany',
				isArray: false
			}

		});
		angular.extend (Org.prototype, {
			createOrUpdate: function () {
				var org = this;
				if (org._id) {
					return org.$update (function () {}, function (e) {$log.error (e.data);});
				} else {
					return org.$save (function () {}, function (e) {$log.error (e.data);});
				}
			}
		});
		return Org;
	}]);
}());
