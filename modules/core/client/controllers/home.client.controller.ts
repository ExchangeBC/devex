// Import certain style elements here so that webpack picks them up
import '@fortawesome/fontawesome-free/js/all';
import angular from 'angular';
import '../../../../public/sass/theme.scss';
import '../css/bl_checkbox.css';
import '../css/core.css';

(() => {
	'use strict';

	HomeController.$inject = ['Authentication', '$state', '$rootScope'];
	angular.module('core').controller('HomeController', HomeController);

	function HomeController(Authentication, $state, $rootScope) {
		const vm = this;
		vm.isUser = Authentication.user;
		if (sessionStorage.prevState) {
			const prevState = sessionStorage.prevState;
			const prevParams = JSON.parse(sessionStorage.prevParams);
			delete sessionStorage.prevState;
			delete sessionStorage.prevParams;
			$state.go(prevState, prevParams);
		}

		if (vm.isUser) {
			$rootScope.$broadcast('updateMessageCount', 'done');
		}
	}
})();
