(function () {
	'use strict';
	angular.module ('programs')
	// -------------------------------------------------------------------------
	//
	// directive for listing programs
	//
	// -------------------------------------------------------------------------
	.directive ('programList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {},
			templateUrl  : '/modules/programs/client/views/list.programs.directive.html',
			controller   : function ($scope, ProgramsService, Authentication, Notification) {
				var vm = this;
				var isAdmin  = Authentication.user && !!~Authentication.user.roles.indexOf ('admin');
				var isGov    = Authentication.user && !!~Authentication.user.roles.indexOf ('gov');
				vm.isAdmin = isAdmin;
				vm.isGov = isGov;
				vm.userCanAdd = (isAdmin || isGov);
				vm.programs = ProgramsService.query ();
				vm.publish = function (program, state) {
					var publishedState = program.isPublished;
					var t = state ? 'Published' : 'Un-Published'
					program.isPublished = state;
					program.createOrUpdate ()
					//
					// success, notify and return to list
					//
					.then (function () {
						Notification.success ({
							message : '<i class="glyphicon glyphicon-ok"></i> Program '+t+' Successfully!'
						});
					})
					//
					// fail, notify and stay put
					//
					.catch (function (res) {
						program.isPublished = publishedState;
						Notification.error ({
							message : res.data.message,
							title   : '<i class=\'glyphicon glyphicon-remove\'></i> Program '+t+' Error!'
						});
					});
				};
				vm.request = function (program) {
					ProgramsService.makeRequest ({
						programId: program._id
					}).$promise
					.then (function () {
						program.userIs.request = true;
						Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Membership request sent successfully!' });
					})
					.catch (function (res) {
						Notification.error ({
							message : res.data.message,
							title   : '<i class=\'glyphicon glyphicon-remove\'></i> Membership Request Error!'
						});
					});
				};
			}
		}
	})
	;
}());
