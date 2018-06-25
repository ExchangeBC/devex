(function () {
	'use strict';
	var formatDate = function (d) {
		if (!d) return '--- --, ----';
		var monthNames = [
		'January', 'February', 'March',
		'April', 'May', 'June', 'July',
		'August', 'September', 'October',
		'November', 'December'
		];
		var day = d.getDate();
		var monthIndex = d.getMonth();
		var year = d.getFullYear();
		return monthNames[monthIndex] + ' ' + day + ', '+ year;
	}
	angular.module ('messages.routes')
	// =========================================================================
	//
	// Controller for the master list of messagetemplates
	//
	// =========================================================================
	.controller ('MessageTemplatesListController', function (templates, Authentication) {
		var vm         = this;
		vm.templates = templates;
	})
	// =========================================================================
	//
	// Controller the view of the template page
	//
	// =========================================================================
	.controller ('MessageTemplateViewController', function ($sce, $state, template, Authentication, Notification) {
		var vm                 = this;
		vm.trust               = $sce.trustAsHtml;
		vm.template          = template;
		vm.auth                = Authentication;
		vm.canEdit              = Authentication.isAdmin;
	})
	.controller ('MessageViewController', function ($sce, $location, $state, $rootScope, message, Authentication, Notification, MessagesService) {
		var vm        = this;
		vm.haveresult = false;
		vm.resultmsg  = '';
		vm.trust      = $sce.trustAsHtml;
		vm.message    = message ;
		vm.auth       = Authentication;
		vm.formatDate = formatDate;
		message.datePosted = formatDate(new Date (message.datePosted));
		message.date2Archive = formatDate(new Date (message.date2Archive));
		message.dateViewed = formatDate(new Date (message.dateViewed));
		//
		// mark message viewed
		//
		MessagesService.viewed ({
			messageId: message._id
		});
		//
		// take some sort of action
		//
		vm.takeAction = function (action) {
			MessagesService.actioned ({
				messageId : message._id,
				action    : action.actionCd
			}).$promise
			.then (function (response) {
				vm.haveresult = true;
				vm.resultmsg = vm.trust (response.message);
				$rootScope.$broadcast('updateMessages', 'done');
			})
			.catch (function (response) {
				vm.haveresult = true;
				vm.resultmsg = vm.trust (response.message);
				$rootScope.$broadcast('updateMessages', 'done');
			})
		};
	})
	.controller ('MessageResultController', function ($sce, $rootScope, $state, isGoodResult, message) {
		var vm        = this;
		vm.bodyMessage = isGoodResult ? $sce.trustAsHtml (message.successMessage) : $sce.trustAsHtml (message.failureMessage);
	})
	// =========================================================================
	//
	// Controller the view of the template page
	//
	// =========================================================================
	.controller ('MessageTemplateEditController', function ($scope, TINYMCE_OPTIONS, $state, editing, template, Authentication, Notification, MessageTemplatesService) {
		var qqq        = this;
		qqq.template = template;
		qqq.auth       = Authentication;
		qqq.tinymceOptions = TINYMCE_OPTIONS;
		qqq.template.defaultActionCd          = '';
		qqq.template.defaultLinkTitleTemplate = '';
		qqq.template.action1ActionCd          = '';
		qqq.template.action1LinkTitleTemplate = '';
		qqq.template.action1LinkTemplate      = '';
		qqq.template.action2ActionCd          = '';
		qqq.template.action2LinkTitleTemplate = '';
		qqq.template.action2LinkTemplate      = '';
		if (editing) {
			qqq.template.defaultActionCd          = qqq.template.actions[0].actionCd          ;
			qqq.template.defaultLinkTitleTemplate = qqq.template.actions[0].linkTitleTemplate ;
			if (qqq.template.actions.length > 1) {
				qqq.template.action1ActionCd          = qqq.template.actions[1].actionCd          ;
				qqq.template.action1LinkTitleTemplate = qqq.template.actions[1].linkTitleTemplate ;
				qqq.template.action1LinkTemplate      = qqq.template.actions[1].linkTemplate      ;
			}
			if (qqq.template.actions.length > 2) {
				qqq.template.action2ActionCd          = qqq.template.actions[2].actionCd          ;
				qqq.template.action2LinkTitleTemplate = qqq.template.actions[2].linkTitleTemplate ;
				qqq.template.action2LinkTemplate      = qqq.template.actions[2].linkTemplate      ;
			}
		}
		// -------------------------------------------------------------------------
		//
		// save the template, could be added or edited (post or put)
		//
		// -------------------------------------------------------------------------
		qqq.savenow = function (isValid, leavenow) {
			if (!isValid) {
				$scope.$broadcast ('show-errors-check-validity', 'qqq.templateForm');
				return false;
			}
			//
			// put the right bits in place
			//
			qqq.template.actions = [];
			qqq.template.actions.push ({
				isDefault         : true,
				linkTitleTemplate : qqq.template.defaultLinkTitleTemplate,
				linkTemplate      : '',
				actionCd          : qqq.template.defaultActionCd
			});
			if (qqq.template.action1ActionCd && qqq.template.action1LinkTitleTemplate && qqq.template.action1LinkTemplate) {
				qqq.template.actions.push ({
					isDefault         : false,
					linkTitleTemplate : qqq.template.action1LinkTitleTemplate,
					linkTemplate      : qqq.template.action1LinkTemplate,
					actionCd          : qqq.template.action1ActionCd
				});
			}
			if (qqq.template.action2ActionCd && qqq.template.action2LinkTitleTemplate && qqq.template.action2LinkTemplate) {
				qqq.template.actions.push ({
					isDefault         : false,
					linkTitleTemplate : qqq.template.action2LinkTitleTemplate,
					linkTemplate      : qqq.template.action2LinkTemplate,
					actionCd          : qqq.template.action2ActionCd
				});
			}
			//
			// Create a new template, or update the current instance
			//
			qqq.template.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function (result) {
				qqq.templateForm.$setPristine ();
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> template saved successfully!'
				});
				if (leavenow) $state.go ('messagetemplates.list');
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> template save error!'
				});
			});
		};
	})
	;
}());
