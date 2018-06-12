(function () {
	'use strict';

	angular.module('propsalQuestions').run(['menuService', function (menuService) {
		menuService.addSubMenuItem ('topbar', 'admin', {
			title: 'Propsal Questions',
			state: 'propsalQuestions.list'
		});
	}]);

}());
