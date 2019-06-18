import '../css/projects.css';

(function() {
	'use strict';
	angular
		.module('projects')
		// =========================================================================
		//
		// Controller for the master list of programs
		//
		// =========================================================================
		.controller('ProjectsListController', [
			'ProjectsService',
			function(ProjectsService) {
				var vm = this;
				vm.projects = ProjectsService.query();
			}
		])
		// =========================================================================
		//
		// Controller the view of the project page
		//
		// =========================================================================
		.controller('ProjectViewController', [
			'$sce',
			'$stateParams',
			'project',
			'AuthenticationService',
			'ProjectsService',
			'Notification',
			function($sce, $stateParams, project, authenticationService, ProjectsService, Notification) {
				var vm = this;
				vm.programId = project.program ? project.program._id : $stateParams.programId;
				vm.project = project;
				vm.display = {};
				vm.display.description = $sce.trustAsHtml(vm.project.description);
				vm.authentication = authenticationService;
				vm.ProjectsService = ProjectsService;
				vm.idString = 'projectId';
				//
				// what can the user do here?
				//
				var isUser = authenticationService.user;
				var isAdmin = isUser && !!~authenticationService.user.roles.indexOf('admin');
				var isMemberOrWaiting = project.userIs.member || project.userIs.request;
				vm.isAdmin = isAdmin;
				vm.loggedIn = isUser;
				vm.canRequestMembership = !isMemberOrWaiting;
				vm.canEdit = isAdmin || project.userIs.admin;
				// -------------------------------------------------------------------------
				//
				// issue a request for membership
				//
				// -------------------------------------------------------------------------
				vm.request = function() {
					ProjectsService.makeRequest({
						projectId: project._id
					}).$promise.then(function() {
						Notification.success({
							message: '<i class="fas fa-check-circle"></i> Membership request sent successfully!'
						});
					});
				};
				// -------------------------------------------------------------------------
				//
				// publish or un publish the opportunity
				//
				// -------------------------------------------------------------------------
				vm.publish = function(state) {
					var publishedState = project.isPublished;
					var t = state ? 'Published' : 'Un-Published';
					project.isPublished = state;
					project
						.createOrUpdate()
						//
						// success, notify and return to list
						//
						.then(function() {
							Notification.success({
								message: '<i class="fas fa-check-circle"></i> Project ' + t + ' Successfully!'
							});
						})
						//
						// fail, notify and stay put
						//
						.catch(function(res) {
							project.isPublished = publishedState;
							Notification.error({
								message: res.data.message,
								title: '<i class=\'fas fa-exclamation-triangle\'></i> Project ' + t + ' Error!'
							});
						});
				};
			}
		])
		// =========================================================================
		//
		// Controller the view of the project page
		//
		// =========================================================================
		.controller('ProjectEditController', [
			'$scope',
			'$state',
			'$stateParams',
			'$window',
			'project',
			'editing',
			'programs',
			'AuthenticationService',
			'Notification',
			'previousState',
			'OpportunitiesService',
			function(
				$scope,
				$state,
				$stateParams,
				$window,
				project,
				editing,
				programs,
				authenticationService,
				Notification,
				previousState,
				OpportunitiesService
			) {
				var vm = this;
				vm.previousState = previousState;
				vm.isAdmin = authenticationService.user && !!~authenticationService.user.roles.indexOf('admin');
				vm.isGov = authenticationService.user && !!~authenticationService.user.roles.indexOf('gov');
				vm.isProjectAdmin = vm.editing ? project.userIs.admin : true;
				vm.project = project;
				vm.authentication = authenticationService;
				//
				// if the user doesn't have the right access then kick them out
				//
				if (editing && !vm.isAdmin && !project.userIs.admin) $state.go('forbidden');
				vm.form = {};
				vm.project.taglist = vm.project.tags ? vm.project.tags.join(', ') : '';
				vm.editing = editing;
				vm.context = $stateParams.context;
				vm.programs = programs;
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
				if (vm.programs.length === 0) {
					Notification.error({
						message:
							'You do not have a program for which you are able to create a project. Please browse to or create a program to put the new project under.'
					});
					$state.go(previousState.name, previousState.params);
				}
				//
				// if adding we care about the context
				// if editing, the program field is locked (and is just a link)
				// if adding then the user is restricted to add under a program they have
				// admin over. If adding wihin the context of a program then restrict to
				// that program only
				//
				//
				// defaults
				//
				vm.programLink = true;
				vm.programId = $stateParams.programId;
				vm.programTitle = $stateParams.programTitle;
				//
				// if editing, set from existing
				//
				if (vm.editing) {
					vm.programId = project.program._id;
					vm.programTitle = project.program.title;
				} else {
					//
					// if adding with no program context display select box
					//
					if (vm.context === 'allprojects') {
						vm.programLink = false;
					}
					//
					// if adding with program context set the program on the record
					//
					else if (vm.context === 'program') {
						vm.project.program = vm.programId;
					}
				}
				const determineIfDeletable = async function() {

					if (editing){

						// Fetch all opportunities associated with the parent program
						const opportunitiesForProgram = await fetch('/api/opportunities/for/program/'+vm.programId).then(response => response.json());

						// Filter for opportunities associated with the current project
						const opportunitiesForProject = opportunitiesForProgram.filter(opp => opp.project === null ? false : opp.project._id === vm.project._id);

						// Determine whether project has any associated published or assigned opportunities
						const hasChildOpps = opportunitiesForProject.length > 0;
						const hasPublished = opportunitiesForProject.some(element => element.isPublished);
						const hasAssigned = opportunitiesForProject.some(element => element.status === 'Assigned');

						// if no published opps, and no assigned opps and either root admin or project admin (with no child opps)
						return (!hasPublished && !hasAssigned && (vm.isAdmin || (project.userIs.admin && !hasChildOpps)));
					} else {
						return false;
					}
				}
				const init_deletable = async function() {
					vm.deletable = await determineIfDeletable();
				}

				init_deletable();

				vm.close = function() {
					if (editing) {
						$state.go('projects.view', { projectId: vm.project._id });
					} else {
						$state.go('projects.list');
					}
				}
				// -------------------------------------------------------------------------
				//
				// remove the project and associated opportunities with some confirmation
				//
				// -------------------------------------------------------------------------
				vm.remove = async function() {

					let confirmMessage = 'Are you sure you want to delete this project?\n\nThe following opportunities will also be deleted:\n';

					// Fetch all opportunities associated with the parent program
					const opportunitiesForProgram = await fetch('/api/opportunities/for/program/'+vm.programId).then(response => response.json());

					// Filter for opportunities associated with the current project
					const opportunitiesForProject = opportunitiesForProgram.filter(opp => opp.project === null ? false : opp.project._id === vm.project._id);

					// Add opportunities to confirmation message
					opportunitiesForProject.forEach(function(element){
						confirmMessage+=element.name+'\n';
					});

					// Show confirmation dialog
					if ($window.confirm(confirmMessage)){

						// Delete child opportunities
						opportunitiesForProject.forEach(function(element){
							var opportunityResource = new OpportunitiesService(element);
							opportunityResource.$remove();
						});

						// Delete project
						vm.project.$remove(function() {
							$state.go('projects.list');
							Notification.success({
								message: '<i class="fas fa-check-circle"></i> project deleted successfully!'
							});
						});
					}
				};
				// -------------------------------------------------------------------------
				//
				// save the project, could be added or edited (post or put)
				//
				// -------------------------------------------------------------------------
				vm.saveme = function() {
					this.save(true);
				};
				vm.save = function(isValid) {
					vm.form.projectForm.$setPristine();
					if (!isValid) {
						$scope.$broadcast('show-errors-check-validity', 'vm.form.projectForm');
						return false;
					}
					if (vm.project.taglist !== '') {
						vm.project.tags = vm.project.taglist.split(/ *, */);
					} else {
						vm.project.tags = [];
					}
					//
					// if we were adding, then set the selected programId, unless it was adding inside
					// a program context already, then just use the one that is already set
					//
					if (!editing && vm.context === 'allprojects') {
						vm.project.program = vm.programId;
					}
					//
					// Create a new project, or update the current instance
					//
					vm.project
						.createOrUpdate()
						//
						// success, notify and return to list
						//
						.then(function() {
							vm.form.projectForm.$setPristine();
							Notification.success({
								message: '<i class="fas fa-check-circle"></i> project saved successfully!'
							});
							$state.go('projects.view', { projectId: project.code });
						})
						//
						// fail, notify and stay put
						//
						.catch(function(res) {
							Notification.error({
								message: res.data.message,
								title: '<i class=\'fas fa-exclamation-triangle\'></i> project save error!'
							});
						});
				};
			}
		]);
}());
