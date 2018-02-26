// Proposals service used to communicate Proposals REST endpoints
(function () {
	'use strict';
	angular.module ('skills.services').factory('SkillsService', function ($resource, $log) {
		console.log ('starting service');
		var Skill = $resource ('/api/skills/:skillId', {
			skillId: '@_id'
		}, {
			update: {
				method: 'PUT'
			},
			list: {
				method  : 'GET',
				url     : '/api/skills/object/list',
				isArray : false
			}
		});
		console.log ('skill service:', Skill);
		angular.extend (Skill.prototype, {
			createOrUpdate: function () {
				var skill = this;
				if (skill._id) {
					return skill.$update (function () {}, function (e) {$log.error(e.data);});
				} else {
					return skill.$save (function () {}, function (e) {$log.error(e.data);});
				}
			}
		});
		return Skill;
	});
}());




