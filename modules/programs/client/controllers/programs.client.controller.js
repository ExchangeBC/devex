(function () {
	'use strict';
	angular.module('programs')
	// =========================================================================
	//
	// Controller for the master list of programs
	//
	// =========================================================================
	.controller('ProgramsListController', ['ProgramsService', function (ProgramsService) {
		var vm      = this;
		vm.programs = ProgramsService.query();
	}])
	// =========================================================================
	//
	// Controller the view of the program page
	//
	// =========================================================================
	.controller('ProgramViewController', ['$window', '$sce', 'program', 'AuthenticationService', 'ProgramsService', 'Notification', function ($window, $sce, program, authenticationService, ProgramsService, Notification) {
		var vm                 = this;
		vm.program             = program;
		vm.display             = {};
		vm.display.description = $sce.trustAsHtml(vm.program.description);
		vm.authentication      = authenticationService;
		vm.ProgramsService     = ProgramsService;
		vm.idString            = 'programId';
		//
		// what can the user do here?
		//
		var isUser                 = authenticationService.user;
		var isAdmin                = isUser && !!~authenticationService.user.roles.indexOf ('admin');
		var isGov                  = isUser && !!~authenticationService.user.roles.indexOf ('gov');
		var isMemberOrWaiting      = program.userIs.member || program.userIs.request;
		vm.loggedIn                = isUser;
		vm.canRequestMembership    = isGov && !isMemberOrWaiting;
		vm.canEdit                 = isAdmin || program.userIs.admin;
		$window.onbeforeunload = null;
		// -------------------------------------------------------------------------
		//
		// issue a request for membership
		//
		// -------------------------------------------------------------------------
		vm.request = function () {
			ProgramsService.makeRequest ({
				programId: program._id
			}).$promise.then (function () {
				Notification.success({ message: '<i class="fas fa-check-circle"></i> Membership request sent successfully!' });
			});
		};
		// -------------------------------------------------------------------------
		//
		// publish or un publish the opportunity
		//
		// -------------------------------------------------------------------------
		vm.publish = function (state) {
			var publishedState = program.isPublished;
			var t = state ? 'Published' : 'Un-Published'
			program.isPublished = state;
			program.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function () {
				Notification.success ({
					message : '<i class="fas fa-check-circle"></i> Program '+t+' Successfully!'
				});
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				program.isPublished = publishedState;
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'fas fa-exclamation-triangle\'></i> Program '+t+' Error!'
				});
			});
		};
	}])
	// =========================================================================
	//
	// Controller the view of the program page
	//
	// =========================================================================
	.controller('ProgramEditController', ['$scope', '$state', '$window', '$timeout', 'Upload', 'program', 'editing', 'AuthenticationService', 'Notification', 'previousState', 'ProjectsService', 'OpportunitiesService', function ($scope, $state, $window, $timeout, Upload, program, editing, authenticationService, Notification, previousState, ProjectsService, OpportunitiesService) {
		var vm            = this;
		vm.user = authenticationService.user;
		vm.fileSelected = false;
		vm.progress = 0;
		vm.croppedDataUrl = '';
		vm.picFile = null;

		vm.previousState = previousState;
		vm.isAdmin                 = authenticationService.user && !!~authenticationService.user.roles.indexOf ('admin');
		vm.isGov                   = authenticationService.user && !!~authenticationService.user.roles.indexOf ('gov');
		vm.editing        = editing;
		vm.program        = program;
		vm.authentication = authenticationService;
		//
		// if the user doesn't have the right access then kick them out
		//
		if (editing && !(program.userIs.admin || vm.isAdmin)) $state.go('forbidden');
		vm.form           = {};
		vm.program.taglist = vm.program.tags? vm.program.tags.join (', ') : '';
		vm.filename = {name:'none'};
		vm.tinymceOptions = {
			resize      : true,
			width       : '100%',  // I *think* its a number and not '400' string
			height      : 100,
			menubar     :'',
			elementpath : false,
			plugins     : 'textcolor lists advlist link',
			toolbar     : 'undo redo | styleselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | forecolor backcolor'
		};

		const determineIfDeletable = async function() {

			if (editing){
				// Determine whether program has any associated open or unassigned opportunities
				const opportunities = await fetch('/api/opportunities/for/program/' + vm.program._id).then(response => response.json());
				const hasPublished = opportunities.some(element => element.isPublished);
				const hasAssigned = opportunities.some(element => element.status === 'Assigned');

				// Determine whether program has any associated projects or opportunities
				const projects = await fetch('/api/projects/for/program/' + vm.program._id).then(response => response.json());
				const hasChildProjects = projects.length > 0;
				const hasChildOpps = opportunities.length > 0;

				// if no published opps, and no assigned opps and either root admin or program admin (with no child projects or opps)
				return (!hasPublished && !hasAssigned && (vm.isAdmin || (program.userIs.admin && !hasChildProjects && !hasChildOpps)));
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
				$state.go('programs.view', { programId: vm.program._id });
			} else {
				$state.go('programs.list');
			}

		}
		// -------------------------------------------------------------------------
		//
		// remove the program and associated projects and opportunities with some confirmation
		//
		// -------------------------------------------------------------------------
		vm.remove = async function() {

			let confirmMessage = 'Are you sure you want to delete this program?\n\nThe following projects and opportunities will also be deleted:\n';

			// Fetch all projects associated with the program
			const projects = await fetch('/api/projects/for/program/'+vm.program._id).then(response => response.json());
			projects.forEach(function(element){
				confirmMessage+=element.name+'\n';
			});

			// Fetch all opportunities associated with the program
			const opportunities = await fetch('/api/opportunities/for/program/'+vm.program._id).then(response => response.json());
			opportunities.forEach(function(element){
				confirmMessage+=element.name+'\n';
			});

			// Show confirmation dialog
			if ($window.confirm(confirmMessage)) {

				// Delete child projects
				projects.forEach(function(element){
					var projectResource = new ProjectsService(element);
					projectResource.$remove();
				});

				// Delete child opportunities
				opportunities.forEach(function(element){
					var opportunityResource = new OpportunitiesService(element);
					opportunityResource.$remove();
				});

				// Delete program
				vm.program.$remove(function() {
					$state.go('programs.list');
					Notification.success({ message: '<i class="fas fa-check-circle"></i> program deleted successfully!' });
				});
			}
		};
		// -------------------------------------------------------------------------
		//
		// save the program, could be added or edited (post or put)
		//
		// -------------------------------------------------------------------------
		vm.saveme = function () {
			this.save (true);
		};
		vm.save = function (isValid) {
			vm.form.programForm.$setPristine ();
			if (!isValid) {
				$scope.$broadcast('show-errors-check-validity', 'vm.form.programForm');
				return false;
			}
			//
			// Create a new program, or update the current instance
			//
			vm.program.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function () {
				vm.form.programForm.$setPristine ();
				Notification.success ({
					message : '<i class="fas fa-check-circle"></i> program saved successfully!'
				});
				//
				// saved the record, now we can upload the logo if it was changed at all
				//
				((vm.fileSelected) ? vm.upload (vm.croppedDataUrl, vm.picFile, vm.program._id) : Promise.resolve ())
				.then (function () {
						$state.go('programs.view', {programId:program.code});
				});
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'fas fa-exclamation-triangle\'></i> program save error!'
				});
			});
		};
		// -------------------------------------------------------------------------
		//
		// does the work of uploading the logo file
		//
		// -------------------------------------------------------------------------
		vm.upload = function (url, name, programId) {
			return new Promise (function (resolve, reject) {
				Upload.upload ({
					url: '/api/upload/logo/program/'+programId,
					data: {
						logo: Upload.dataUrltoBlob (url, name.name)
					}
				})
				.then (
					function () {
						$timeout (function () {
							Notification.success ({ message: '<i class="fas fa-check-circle"></i> Update of logo successful!' });
							vm.fileSelected = false;
							vm.progress = 0;
						});
						resolve ();
					},
					function (response) {
						if (response.status > 0) {
							vm.fileSelected = false;
							Notification.error ({ message: response.message, title: '<i class="fas fa-exclamation-triangle"></i> Update of logo failed!' });
						}
						reject ();
					},
					function (evt) {
						vm.progress = parseInt(100.0 * evt.loaded / evt.total, 10);
					}
				);
			});
		};
		// -------------------------------------------------------------------------
		//
		// CC: BA-614-615 determine that the picture does not exceed the max allowed size
		//
		// -------------------------------------------------------------------------
		vm.fileSelected = false;
		vm.onSelectPicture = function (file) {
			if (!file) return;
			if (file.size > (1 * 1024 * 1024)) {
				Notification.error ({
					delay   : 6000,
					title   : '<div class="text-center"><i class="fas fa-exclamation-triangle fa-2x"></i> File Too Large</div>',
					message : '<div class="text-center">This file exceeds the max allowed size of 1M. Please select another image, or reduce the size or density of this image.</div>'
				});
			}
			else vm.fileSelected = true;
		};
	}])
	;
}());
