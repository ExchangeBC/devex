/* tslint:disable */
(function () {
	'use strict';
	angular.module ('users')
	// -------------------------------------------------------------------------
	//
	// force lowercase input
	//
	// -------------------------------------------------------------------------
	.directive ('lowercase', function () {
		return {
			require: 'ngModel',
			link: function (scope, element, attrs, modelCtrl) {
				modelCtrl.$parsers.push (function (input) {
					return input ? input.toLowerCase() : '';
				});
				element.css ('text-transform', 'lowercase');
			}
		};
	})
	// -------------------------------------------------------------------------
	//
	// directive for listing affiliations users have with their orgs
	//
	// -------------------------------------------------------------------------
	.directive('affiliationsList', function() {
		return {
			restrict		: 'E',
			controllerAs	: 'vm',
			scope			: {
				context		: '@'
			},
			templateUrl		: '/modules/users/client/views/settings/affiliations-directive.html',
			controller		: ['$scope', 'Notification', 'OrgService', 'AuthenticationService', 'ask', function($scope, Notification, OrgService, AuthenticationService, ask) {
				var vm 			= this;
				vm.auth			= AuthenticationService.permissions();
				vm.context		= $scope.context;
				vm.user			= AuthenticationService.user;

				function loadAffiliations() {
					try {
						vm.affiliations = OrgService.my();
					} catch (error) {
						Notification.error({message: error.message });
					}

				}

				vm.removeAffiliation = function(affiliation) {
					var question = 'Removing your affiliation with ' + affiliation.name + ' means they won\'t be able to include you on proposals to Sprint With Us opportunities. ' +
					'Are you sure you want to do this?';
					ask.yesNo(question).then(function (result) {
						if (result) {
							OrgService.removeMeFromOrg ({
								orgId: affiliation._id
							}).$promise
							.then (function (org) {
								loadAffiliations();
								Notification.success({ message: '<i class="fas fa-check-circle"></i> You have been removed from ' + affiliation.name });
							});
						}
					});
				}

				loadAffiliations();
			}]
		};
	})
	;
}());
