/* tslint:disable */
// Import certain style elements here so that webpack picks them up
import '../css/orgs.css';
import angular from 'angular';

(function() {
	'use strict';
	angular
		.module('orgs')
		// =========================================================================
		//
		// Controller for the master list of orgs
		//
		// =========================================================================
		.controller('OrgsListController', [
			'orgs',
			'Authentication',
			function(orgs, Authentication) {
				var vm = this;
				vm.isLoggedIn = !!Authentication.user;
				vm.orgs = orgs;
			}
		])
		// =========================================================================
		//
		// Controller the view of the org page
		//
		// =========================================================================
		.controller('OrgViewController', [
			'$sce',
			'org',
			'Authentication',
			function($sce, org, Authentication) {
				var vm = this;
				vm.org = org;
				vm.user = Authentication.user;
				vm.isLoggedIn = !!vm.user;
				vm.isAdmin = vm.user && !!~Authentication.user.roles.indexOf('admin');
				vm.isGov = vm.user && !!~Authentication.user.roles.indexOf('gov');
				vm.isOrgAdmin =
					vm.user &&
					vm.org.admins &&
					vm.org.admins
						.map(function(u) {
							return vm.user._id === u._id;
						})
						.reduce(function(accum, curr) {
							return accum || curr;
						}, false);
				vm.isOrgOwner = vm.user && org.owner && vm.user._id === org.owner._id;
				vm.canEdit = vm.isAdmin || vm.isOrgOwner || vm.isOrgAdmin;
				vm.trust = $sce.trustAsHtml;

				vm.description = $sce.trustAsHtml(vm.org.description);
				//
				// what can the user do here?
				//
			}
		])
		// =========================================================================
		//
		// create a new org
		//
		// =========================================================================
		.controller('OrgCreateController', [
			'$scope',
			'$state',
			'org',
			'Authentication',
			'Notification',
			'UsersService',
			function($scope, $state, org, Authentication, Notification, UsersService) {
				var vm = this;
				vm.org = org;
				vm.user = Authentication.user;
				var newId;
				vm.add = function(isValid) {
					if (!isValid) {
						$scope.$broadcast('show-errors-check-validity', 'vm.orgForm');
						return false;
					}
					vm.orgForm.$setPristine();
					vm.org
						.createOrUpdate()
						.then(function(result) {
							vm.orgForm.$setPristine();
							newId = result._id;
							Notification.success({
								message: '<i class="fas fa-check-circle"></i> Company saved successfully!'
							});
						})
						.then(function() {
							vm.user.orgsMember.push(newId);
							vm.user.orgsAdmin.push(newId);
							var user = new UsersService(vm.user);
							return new Promise(function(resolve, reject) {
								user.$update(
									function(response) {
										Authentication.user = response;
										resolve();
									},
									function(err) {
										reject(err);
									}
								);
							});
							// UsersService.resetMe ();
						})
						.then(function() {
							$state.go('orgadmin.profile', { orgId: newId });
						})
						.catch(function(res) {
							Notification.error({
								message: res.data.message,
								title: '<i class=\'fas fa-exclamation-triangle\'></i> Company save error!'
							});
						});
				};
				vm.delete = function() {
					$state.go('orgs.list');
				};
			}
		])
		// =========================================================================
		//
		// top level of the edit
		//
		// =========================================================================
		.controller('OrgAdminController', [
			'$rootScope',
			'$state',
			'org',
			'OrgsService',
			function($rootScope, $state, org, OrgsService) {
				var vm = this;
				vm.org = org;

				$rootScope.$on('updateOrg', function() {
					OrgsService.get({ orgId: org._id }).$promise.then(function(result) {
						vm.org = result;
					});
				});

				$state.go('orgadmin.profile');

				vm.tabs = [
					{
						url: '/profile',
						name: 'Business Info',
						templateUrl: '/modules/orgs/client/views/org-main.html',
						route: 'orgadmin.profile'
					},
					{
						url: '/members',
						name: 'Team Members',
						templateUrl: '/modules/orgs/client/views/org-members.html',
						route: 'orgadmin.members'
					},
					{
						url: '/terms',
						name: 'Terms',
						templateUrl: '/modules/orgs/client/views/org-terms.html',
						route: 'orgadmin.terms'
					}
				];

				vm.openTab = function(tab) {
					$state.go(tab.route);
				};
			}
		])
		// =========================================================================
		//
		// edit the tonbstone info for an org
		//
		// =========================================================================
		.controller('OrgProfileController', [
			'$rootScope',
			'capabilities',
			'$scope',
			'$state',
			'$window',
			'org',
			'Authentication',
			'Notification',
			'dataService',
			'UsersService',
			function(
				$rootScope,
				capabilities,
				$scope,
				$state,
				$window,
				org,
				Authentication,
				Notification,
				dataService,
				UsersService
			) {
				var vm = this;
				vm.user = Authentication.user;
				vm.isAdmin = vm.user && !!~Authentication.user.roles.indexOf('admin');
				vm.isGov = vm.user && !!~Authentication.user.roles.indexOf('gov');

				vm.org = org;
				if (!vm.org.capabilities) vm.org.capabilities = [];

				vm.cities = dataService.cities;
				vm.capabilities = capabilities;

				vm.form = {};
				vm.tinymceOptions = {
					resize: true,
					width: '100%', // I *think* its a number and not '400' string
					height: 100,
					menubar: '',
					elementpath: false,
					plugins: 'textcolor lists advlist link',
					toolbar:
						'undo redo | styleselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | forecolor backcolor'
				};
				$rootScope.$on('orgImageUpdated', function(evt, data) {
					vm.org.orgImageURL = data;
				});

				parseWebsite();

				function parseWebsite() {
					var parts = vm.org.website.split('://');
					if (parts[0] === 'https') {
						vm.org.websiteProtocol = 'https://';
					} else {
						vm.org.websiteProtocol = 'http://';
					}

					if (parts.length > 1) {
						vm.org.websiteAddress = parts[1];
					} else {
						vm.org.websiteAddress = vm.org.website;
					}
				}
				// -------------------------------------------------------------------------
				//
				// remove the org with some confirmation
				//
				// -------------------------------------------------------------------------
				vm.remove = function() {
					var orgId = vm.org._id.toString();
					if ($window.confirm('Are you sure you want to delete?')) {
						vm.org.$remove(function() {
							Notification.success({
								message: '<i class="fas fa-check-circle"></i> org deleted successfully!'
							});
							vm.user.orgsMember = vm.user.orgsMember.filter(function(el) {
								return el !== orgId;
							});
							vm.user.orgsAdmin = vm.user.orgsAdmin.filter(function(el) {
								return el !== orgId;
							});
							var user = new UsersService(vm.user);
							user.$update(function(response) {
								Authentication.user = response;
								$state.go('orgs.list');
							});
						});
					}
				};
				// -------------------------------------------------------------------------
				//
				// save the org, could be added or edited (post or put)
				//
				// -------------------------------------------------------------------------
				vm.save = function(isValid) {
					vm.orgForm.$setPristine();
					if (!isValid) {
						$scope.$broadcast('show-errors-check-validity', 'vm.form.orgForm');
						return false;
					}

					vm.org.website = vm.org.websiteProtocol + vm.org.websiteAddress;
					//
					// Create a new org, or update the current instance
					//
					vm.org
						.createOrUpdate()
						//
						// success, notify and return to list
						//
						.then(function() {
							vm.orgForm.$setPristine();
							parseWebsite();
							Notification.success({
								message: '<i class="fas fa-3x fa-check-circle"></i><br> <h4>Changes saved</h4>'
							});
						})
						//
						// fail, notify and stay put
						//
						.catch(function(res) {
							Notification.error({
								message: res.data.message,
								title: '<i class=\'fas fa-exclamation-triangle\'></i> org save error!'
							});
						});
				};
			}
		])
		// -------------------------------------------------------------------------
		//
		// controller for skills
		//
		// -------------------------------------------------------------------------
		.controller('OrgSkillsController', [
			'capabilities',
			'Notification',
			'org',
			function(capabilities, Notification, org) {
				var vm = this;
				// vm.features = window.features;
				vm.org = org;
				vm.capabilities = capabilities;
				vm.updateUserProfile = function(isValid) {
					//
					// Create a new org, or update the current instance
					//
					vm.org
						.createOrUpdate()
						//
						// success, notify and return to list
						//
						.then(function() {
							Notification.success({
								message: '<i class="fas fa-check-circle"></i> capabilities saved successfully!'
							});
						})
						//
						// fail, notify and stay put
						//
						.catch(function(res) {
							Notification.error({
								message: res.data.message,
								title: '<i class=\'fas fa-exclamation-triangle\'></i> capabilities save error!'
							});
						});
				};
			}
		])
		// =========================================================================
		//
		// edit org teams list
		//
		// =========================================================================
		.controller('OrgTeamsController', [
			'org',
			function(org) {
				var vm = this;
				vm.org = org;
			}
		])
		// =========================================================================
		//
		// edit org member list
		//
		// =========================================================================
		.controller('OrgMembersController', [
			'$rootScope',
			'org',
			'Notification',
			'OrgsService',
			'capabilities',
			'CapabilitiesMethods',
			'ask',
			'$uibModal',
			function($rootScope, org, Notification, OrgsService, capabilities, CapabilitiesMethods, ask, $uibModal) {
				var vm = this;
				vm.org = org;
				vm.emaillist = '';
				CapabilitiesMethods.init(vm, vm.org, capabilities);
				// -------------------------------------------------------------------------
				//
				// refresh the organization and also the additions email list
				//
				// -------------------------------------------------------------------------
				vm.refresh = function() {
					vm.orgForm.$setPristine();
					vm.emaillist = '';
					var id = vm.org._id;
					vm.loading = true;
					OrgsService.get({ orgId: id }).$promise.then(function(org) {
						vm.org = org;
						CapabilitiesMethods.init(vm, vm.org, capabilities);
						vm.loading = false;
					});
				};
				// -------------------------------------------------------------------------
				//
				// add or remove members
				// CC: swap out the reference here.  this does create a new reference and
				// orphans the original, but since all we do on this screen is this action
				// it really makes little difference.  If change was afffected immediately
				// then this would be an issue
				//
				// -------------------------------------------------------------------------
				vm.addMembers = function() {
					vm.orgForm.$setPristine();
					if (vm.emaillist !== '') {
						var saveorg = new OrgsService(vm.org);
						saveorg.additions = vm.emaillist.toLowerCase();
						saveorg
							.$update()
							.then(function(savedOrg) {
								vm.emaillist = '';
								vm.orgForm.$setPristine();
								vm.org = savedOrg;
								return savedOrg;
							})
							.then(vm.displayResults)
							//
							// fail, notify and stay put
							//
							.catch(function(res) {
								Notification.error({
									message: res.message,
									title: '<i class=\'fas fa-exclamation-triangle\'></i> invitations send error!'
								});
							});
					}
				};
				vm.removeMember = function(member) {
					ask.yesNo(
						'Are you sure you want to remove this member from your company? If you have added them to a proposal, you may no longer qualify to apply on the opportunity.'
					).then(function(yes) {
						if (yes) {
							OrgsService.removeUser({
								orgId: vm.org._id,
								userId: member._id
							}).$promise.then(function(org) {
								vm.refresh();
							});
						}
					});
				};
				vm.save = function() {
					vm.orgForm.$setPristine();
					vm.org.createOrUpdate().then(function() {
						vm.emaillist = '';
						CapabilitiesMethods.init(vm, vm.org, capabilities);
						vm.orgForm.$setPristine();
						Notification.success({
							message:
								'<i class="fas fa-3x fa-check-circle"></i><br> <h4>Congrats! Your company is now qualified for Sprint With Us.</h4>'
						});
						$rootScope.$broadcast('updateOrg', 'done');
					});
				};
				vm.displayResults = function(result) {
					if (!result.emaillist) return Promise.resolve();
					return new Promise(function(resolve, reject) {
						$uibModal.open({
							size: 'sm',
							templateUrl: '/modules/orgs/client/views/org-members-results.html',
							controller: [
								'$scope',
								'$uibModalInstance',
								function($scope, $uibModalInstance) {
									$scope.data = {
										found: result.emaillist.found,
										notfound: result.emaillist.notFound
									};

									$scope.close = function() {
										$uibModalInstance.close();
									};
								}
							]
						});
					});
				};
			}
		])
		// =========================================================================
		//
		// accept terms
		//
		// =========================================================================
		.controller('OrgTermsController', [
			'$rootScope',
			'org',
			'Notification',
			function($rootScope, org, Notification) {
				var vm = this;
				vm.org = org;

				vm.checkBoxModel = {
					value: org.isAcceptedTerms
				};

				vm.save = function() {
					vm.org.isAcceptedTerms = vm.checkBoxModel.value;
					vm.orgForm.$setPristine();
					vm.org.createOrUpdate().then(function() {
						vm.orgForm.$setPristine();
						Notification.success({
							message:
								'<i class="fas fa-3x fa-check-circle"></i><br> <h4>Your company has accepted the terms of the RFQ.</h4>'
						});
						$rootScope.$broadcast('updateOrg', 'done');
					});
				};
			}
		])
		// =========================================================================
		//
		// edit org skill list
		//
		// =========================================================================
		.controller('OrgProposalsController', [
			'org',
			function(org) {
				var vm = this;
				vm.org = org;
			}
		]);
}());
