// Superbasics service used to communicate Superbasics REST endpoints
(function () {
	'use strict';
	angular.module ('superbasics.services').factory ('SuperbasicsService', function ($resource, $log) {
		var Superbasic = $resource ('/api/superbasics/:superbasicId', {
			superbasicId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
		angular.extend (Superbasic.prototype, {
			createOrUpdate: function () {
				var superbasic = this;
				if (superbasic._id) {
					return superbasic.$update (function () {}, function (e) {$log.error (e.data);});
				} else {
					return superbasic.$save (function () {}, function (e) {$log.error (e.data);});
				}
			}
		});
		return Superbasic;
	});
}());
