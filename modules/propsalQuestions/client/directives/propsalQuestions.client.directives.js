(function () {
	'use strict';
	angular.module ('propsalQuestions')
	// -------------------------------------------------------------------------
	//
	// directive for listing propsalQuestions
	//
	// -------------------------------------------------------------------------
	.directive ('propsalQuestionList', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				title       : '@',
				context     : '@',
				propsalQuestions : '='
			},
			templateUrl  : '/modules/propsalQuestions/client/views/list.propsalQuestions.directive.html',
			controller   : function ($sce, $rootScope, $scope, PropsalQuestionsService, Authentication) {
				var vm         = this;
				vm.trust       = $sce.trustAsHtml;
				vm.auth        = Authentication;
				vm.title       = ($scope.title) ? $scope.title : null;
				vm.canAdd      = vm.auth.isAdmin;
				vm.context     = $scope.context;
				vm.propsalQuestions = $scope.propsalQuestions;
				$rootScope.$on ('updatePropsalQuestions', function () {
					vm.propsalQuestions = PropsalQuestionsService.query ();
				});
			}
		}
	})
	// -------------------------------------------------------------------------
	//
	// directive for viewing a propsalQuestion, could have several different modes
	//
	// -------------------------------------------------------------------------
	.directive ('propsalQuestionView', function () {
		return {
			restrict     : 'E',
			controllerAs : 'vm',
			scope        : {
				mode       : '@',
				propsalQuestion : '='
			},
			templateUrl  : '/modules/propsalQuestions/client/views/view.propsalQuestion.directive.html',
			controller   : function ($scope, Authentication) {
				var vm        = this;
				vm.auth       = Authentication;
				vm.mode       = $scope.mode || 'page';
				vm.canEdit    = vm.auth.isAdmin;
				vm.propsalQuestion = $scope.propsalQuestion;
			}
		}

	})
	;
}());

