// Import certain style elements here so that webpack picks them up
import '../../../../public/sass/theme.scss';
import '@fortawesome/fontawesome-free/js/all';
import '../css/bl_checkbox.css';
import '../css/core.css';

(function() {
	'use strict';

	HomeController.$inject = ['Authentication', '$state'];
	angular.module('core').controller('HomeController', HomeController);

	function HomeController(Authentication, $state) {
		var vm = this;
		vm.isUser = Authentication.user;
		if (sessionStorage.prevState) {
			var prevState = sessionStorage.prevState;
			var prevParams = JSON.parse(sessionStorage.prevParams);
			delete sessionStorage.prevState;
			delete sessionStorage.prevParams;
			$state.go(prevState, prevParams);
		}
	}
}());
