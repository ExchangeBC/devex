(function () {
	'use strict';
	angular.module ('propsalQuestions')
	// =========================================================================
	//
	// Controller for the master list of propsalQuestions
	//
	// =========================================================================
	.controller ('PropsalQuestionsListController', function (propsalQuestions, Authentication) {
		var vm         = this;
		vm.propsalQuestions = propsalQuestions;
	})
	// =========================================================================
	//
	// Controller the view of the propsalQuestion page
	//
	// =========================================================================
	.controller ('PropsalQuestionViewController', function ($sce, $state, propsalQuestion, Authentication, Notification) {
		var vm                 = this;
		vm.trust               = $sce.trustAsHtml;
		vm.propsalQuestion          = propsalQuestion;
		vm.auth                = Authentication;
		vm.canEdit              = Authentication.isAdmin;
	})
	// =========================================================================
	//
	// Controller the view of the propsalQuestion page
	//
	// =========================================================================
	.controller ('PropsalQuestionEditController', function ($scope, $state, propsalQuestion, Authentication, Notification) {
		var qqq        = this;
		qqq.propsalQuestion = propsalQuestion;
		qqq.auth       = Authentication;
		// -------------------------------------------------------------------------
		//
		// save the propsalQuestion, could be added or edited (post or put)
		//
		// -------------------------------------------------------------------------
		qqq.savenow = function (isValid, leavenow) {
			if (!isValid) {
				$scope.$broadcast ('show-errors-check-validity', 'qqq.propsalQuestionForm');
				return false;
			}
			//
			// Create a new propsalQuestion, or update the current instance
			//
			qqq.propsalQuestion.createOrUpdate ()
			//
			// success, notify and return to list
			//
			.then (function (result) {
				qqq.propsalQuestionForm.$setPristine ();
				Notification.success ({
					message : '<i class="glyphicon glyphicon-ok"></i> propsalQuestion saved successfully!'
				});
				if (leavenow) $state.go ('propsalQuestions.view', {propsalQuestionId:qqq.propsalQuestion.code});
			})
			//
			// fail, notify and stay put
			//
			.catch (function (res) {
				Notification.error ({
					message : res.data.message,
					title   : '<i class=\'glyphicon glyphicon-remove\'></i> propsalQuestion save error!'
				});
			});
		};
	})
	;
}());
