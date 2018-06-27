// Opportunities service used to communicate Opportunities REST endpoints
(function () {
	'use strict';

	angular	.module('opportunities')
	// -------------------------------------------------------------------------
	//
	// service for database interaction - the $resource for opportunities
	//
	// -------------------------------------------------------------------------
	.factory('OpportunitiesService', function ($resource, $log) {
		var Opportunity = $resource('/api/opportunities/:opportunityId', {
			opportunityId: '@_id'
		}, {
			update: {
				method: 'PUT',
				transformResponse: function (data) {
					data                         = angular.fromJson(data);
					data.deadline                = new Date(data.deadline);
					data.assignment              = new Date(data.assignment);
					data.start                   = new Date(data.start);
					data.inceptionStartDate      = new Date (data.inceptionStartDate);
					data.inceptionEndDate        = new Date (data.inceptionEndDate);
					data.prototypeStartDate      = new Date (data.prototypeStartDate);
					data.prototypeEndDate        = new Date (data.prototypeEndDate);
					data.implementationStartDate = new Date (data.implementationStartDate);
					data.implementationEndDate   = new Date (data.implementationEndDate);
					return data;
				}
			},
			save: {
				method: 'POST',
				transformResponse: function (data) {
					data            = angular.fromJson(data);
					data.deadline   = new Date(data.deadline);
					data.assignment = new Date(data.assignment);
					data.start      = new Date(data.start);
					data.inceptionStartDate      = new Date (data.inceptionStartDate);
					data.inceptionEndDate        = new Date (data.inceptionEndDate);
					data.prototypeStartDate      = new Date (data.prototypeStartDate);
					data.prototypeEndDate        = new Date (data.prototypeEndDate);
					data.implementationStartDate = new Date (data.implementationStartDate);
					data.implementationEndDate   = new Date (data.implementationEndDate);
					return data;
				}
			},
			forProject: {
				method: 'GET',
				url: '/api/opportunities/for/project/:projectId',
				isArray: true
			},
			forProgram: {
				method: 'GET',
				url: '/api/opportunities/for/program/:programId',
				isArray: true
			},
			my: {
				method: 'GET',
				url: '/api/my/opportunities',
				isArray: true
			},
			publish: {
				method: 'GET',
				url :'/api/opportunities/publish/:opportunityId'
			},
			unpublish: {
				method: 'DELETE',
				url :'/api/opportunities/publish/:opportunityId'
			},
			unassign: {
				method: 'PUT',
				url: '/api/opportunities/unassign/:opportunityId',
				params: {opportunityId:'@opportunityId'}
			},
			makeRequest: {
				method: 'GET',
				url :'/api/request/opportunity/:opportunityId'
			},
			getRequests: {
				method: 'GET',
				url :'/api/opportunities/requests/:opportunityId',
				isArray: true
			},
			getMembers: {
				method: 'GET',
				url :'/api/opportunities/members/:opportunityId',
				isArray: true
			},
			confirmMember: {
				method: 'GET',
				url : '/api/opportunities/requests/confirm/:opportunityId/:userId'
			},
			denyMember: {
				method: 'GET',
				url : '/api/opportunities/requests/deny/:opportunityId/:userId'
			},
			addWatch: {
				method: 'GET',
				url : '/api/opportunities/watch/add/:opportunityId'
			},
			removeWatch: {
				method: 'GET',
				url : '/api/opportunities/watch/remove/:opportunityId'
			}
		});
		angular.extend (Opportunity.prototype, {
			createOrUpdate: function () {
				var opportunity = this;
				if (opportunity._id) {
					return opportunity.$update (function () {}, function (e) {$log.error (e.data);});
				} else {
					return opportunity.$save (function () {}, function (e) {$log.error (e.data);});
				}
			}
		});
		return Opportunity;
	})
	// -------------------------------------------------------------------------
	//
	// this is a set of common things that all types of mopportunities need to do
	// this is really part of the controller, but this is a great place to put common
	// functions
	//
	// -------------------------------------------------------------------------
	.factory ('OpportunitiesCommon', function ($sce, Authentication, OpportunitiesService, Notification) {
		return {
			// -------------------------------------------------------------------------
			//
			// check if the current user is currently watching this opportunity
			//
			// -------------------------------------------------------------------------
			isWatchng : function (o) {
				if (Authentication.user) return !!~o.watchers.indexOf (Authentication.user._id);
				else return false;
			},
			// -------------------------------------------------------------------------
			//
			// add current user to the watchers list - this assumes that ths function could
			// not be run except if the user was not already on the list
			//
			// -------------------------------------------------------------------------
			addWatch : function (o) {
				o.watchers.push (Authentication.user._id);
				OpportunitiesService.addWatch ({
					opportunityId: o._id
				});
				Notification.success({ message: '<i class="fa fa-eye fa-3x"></i><br/><br/>You are now watching<br/>'+o.name });
				return true;
			},
			// -------------------------------------------------------------------------
			//
			// remove the current user from the list
			//
			// -------------------------------------------------------------------------
			removeWatch : function (o) {
				o.watchers.splice (o.watchers.indexOf (Authentication.user._id), 1);
				OpportunitiesService.removeWatch ({
					opportunityId: o._id
				});
				Notification.success({ message: '<i class="fa fa-eye-slash fa-3x"></i><br/><br/>You are no longer watching<br/>'+o.name });
				return false;
			},
			// -------------------------------------------------------------------------
			//
			// publishStatus checks for whether or not fields are missing so we can
			// publish or not
			//
			// -------------------------------------------------------------------------
			publishStatus : function (o) {
				//
				// removed background for now
				//
				// [(o.background), 'Background'],
				if (!o.phases) {
					o.phases = {
						implementation : {},
						inception : {},
						proto : {}
					}
				}
				var fields = {
					common: [
						[(o.name), 'Title'],
						[(o.short), 'Teaser'],
						[(o.description), 'Background / Summary'],
						[(o.github), 'Github Repository'],
						[(o.program), 'Program'],
						[(o.project), 'Project'],
						[(o.deadline), 'Proposal Deadline'],
						[(o.assignment), 'Assignment Date'],
						[(o.location), 'Location']
					],
					cwu: [
						[(o.evaluation), 'Proposal Evaluation Criteria'],
						[(o.criteria), 'Acceptance Criteria'],
						[(o.proposalEmail), 'Email to Receive Acceptance of Terms and Contract'],
						[(o.skills), 'Required Skills'],
						[(o.earn), 'Fixed-Price Reward'],
						[(o.start), 'Proposed Start Date']
					],
					swu: [
						// [(o.terms), 'Additional Terms and Conditions'],
						[(o.budget > 0), 'Total Opportunity Budget'],
						[(o.phases.implementation.isImplementation || o.phases.inception.isInception || o.phases.proto.isPrototype), 'Phase Selection and Information'],
						// [((!o.phases.implementation.isImplementation) || (o.phases.implementation.isImplementation && o.phases.implementation.contract)), 'Implementation Phase Contract Model'],
						[((!o.phases.implementation.isImplementation) || (o.phases.implementation.isImplementation && o.phases.implementation.endDate)), 'Implementation Phase End Date'],
						// [((!o.phases.implementation.isImplementation) || (o.phases.implementation.isImplementation && o.phases.implementation.target)), 'Implementation Phase Target Cost'],
						[((!o.phases.implementation.isImplementation) || (o.phases.implementation.isImplementation && o.phases.implementation.startDate)), 'Implementation Phase Start Date'],
						// [((!o.phases.inception.isInception          ) || (o.phases.inception.isInception && o.phases.inception.contract)), 'Inception Phase Contract Model'],
						[((!o.phases.inception.isInception          ) || (o.phases.inception.isInception && o.phases.inception.endDate)), 'Inception Phase End Date'],
						// [((!o.phases.inception.isInception          ) || (o.phases.inception.isInception && o.phases.inception.target)), 'Inception Phase Target Cost'],
						[((!o.phases.inception.isInception          ) || (o.phases.inception.isInception && o.phases.inception.startDate)), 'Inception Phase Start Date'],
						// [((!o.phases.proto.isPrototype              ) || (o.phases.proto.isPrototype && o.phases.proto.contract)), 'Prototype Phase Contract Model'],
						[((!o.phases.proto.isPrototype              ) || (o.phases.proto.isPrototype && o.phases.proto.endDate)), 'Prototype Phase End Date'],
						// [((!o.phases.proto.isPrototype              ) || (o.phases.proto.isPrototype && o.phases.proto.target)), 'Prototype Phase Target Cost'],
						[((!o.phases.proto.isPrototype              ) || (o.phases.proto.isPrototype && o.phases.proto.startDate)), 'Prototype Phase Start Date']
					]
				};
				var errorFields = fields.common.reduce (function (accum, elem) {
					if (!elem[0]) accum.push (elem[1]);
					return accum;
				}, []);
				if (o.opportunityTypeCd === 'code-with-us') {
					fields.cwu.forEach (function (elem) {
						if (!elem[0]) errorFields.push (elem[1]);
					});
				}
				else {
					fields.swu.forEach (function (elem) {
						if (!elem[0]) errorFields.push (elem[1]);
					});
				}
				return errorFields;
			},
			// -------------------------------------------------------------------------
			//
			// all the common setup on the scope
			//
			// -------------------------------------------------------------------------
			setScopeView : function (vm, opportunity, myproposal) {
				//
				// if I have a proposal
				//
				vm.myproposal             = myproposal;
				vm.opportunity            = opportunity;
				vm.pageViews              = opportunity.views;
				vm.opportunity.deadline   = new Date (vm.opportunity.deadline);
				vm.opportunity.assignment = new Date (vm.opportunity.assignment);
				vm.authentication         = Authentication;
				vm.display                = {};
				vm.display.description    = $sce.trustAsHtml(vm.opportunity.description);
				vm.display.evaluation     = $sce.trustAsHtml(vm.opportunity.evaluation);
				vm.display.criteria       = $sce.trustAsHtml(vm.opportunity.criteria);
				vm.trust = $sce.trustAsHtml;
				//
				// what can the user do here?
				//
				var isUser                 = Authentication.user;
				var isAdmin                = isUser && !!~Authentication.user.roles.indexOf ('admin');
				var isGov                  = isUser && !!~Authentication.user.roles.indexOf ('gov');
				vm.isGov                   = isGov;
				vm.hasEmail                = isUser && Authentication.user.email !== '';
				var isMemberOrWaiting      = opportunity.userIs.member || opportunity.userIs.request;
				vm.loggedIn                = isUser;
				vm.canRequestMembership    = isGov && !isMemberOrWaiting;
				vm.canEdit                 = isAdmin || opportunity.userIs.admin;
				vm.isMember                = opportunity.userIs.member;
				vm.isSprintWithUs          = (vm.opportunity.opportunityTypeCd === 'sprint-with-us');
				vm.showProposals           = vm.canEdit && vm.opportunity.isPublished;
				//
				// dates
				//
				var rightNow               = new Date ();
				vm.closing = 'CLOSED';
				var d                      = vm.opportunity.deadline - rightNow;
				if (d > 0) {
					var dd = Math.floor(d / 86400000); // days
					var dh = Math.floor((d % 86400000) / 3600000); // hours
					var dm = Math.round(((d % 86400000) % 3600000) / 60000); // minutes
					vm.closing = dm+' minutes';
					if (dd > 0) vm.closing = dd+' days '+dh+' hours '+dm+' minutes';
					else if (dh > 0) vm.closing = dh+' hours '+dm+' minutes';
					else vm.closing = dm+' minutes';
				}
				var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
				var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
				var dt = vm.opportunity.deadline;
				vm.deadline = dt.getHours()+':00 PST, '+dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
				dt = vm.opportunity.assignment;
				vm.assignment = dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
				dt = vm.opportunity.start;
				vm.start = dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
				// -------------------------------------------------------------------------
				//
				// can this be published?
				//
				// -------------------------------------------------------------------------
				// vm.errorFields = OpportunitiesCommon.publishStatus (vm.opportunity);
				vm.canPublish = (vm.errorFields.length === 0);
			}

		}
	})
	;
}());
