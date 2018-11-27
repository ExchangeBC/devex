(() => {
	'use strict';

	angular
		.module('core')
		.controller('HeaderController', HeaderController)
		.controller('WarningModalController', WarningModalController)
		.controller('TimeoutModalController', TimeoutModalController);

	HeaderController.$inject = [
		'$rootScope',
		'$scope',
		'$state',
		'$location',
		'Authentication',
		'menuService',
		'$uibModal',
		'Idle',
		'MessagesService'
	];

	WarningModalController.$inject = ['$scope', 'Idle'];

	function HeaderController(
		$rootScope,
		$scope,
		$state,
		$location,
		Authentication,
		menuService,
		$uibModal,
		Idle,
		MessagesService
	) {
		const vm = this;
		vm.accountMenu = menuService.getMenu('account').items[0];
		vm.authentication = Authentication;
		vm.isCollapsed = false;
		vm.menu = menuService.getMenu('topbar');

		if (Authentication.user) {
			updateMessageCount();
			setAvatarImage(vm.authentication.user);
		}

		$rootScope.$on('updateMessageCount', () => {
			updateMessageCount();
		});

		$rootScope.$on('userSignedIn', (event, data) => {
			setAvatarImage(data);
		});

		function setAvatarImage(userData) {
			if (
				userData.profileImageURL.indexOf('http://') !== 0 &&
				userData.profileImageURL.indexOf('https://') !== 0
			) {
				vm.avatarImageURL =
					window.location.origin + '/' + userData.profileImageURL;
			} else {
				vm.avatarImageURL = userData.profileImageURL;
			}
		}

		function updateMessageCount() {
			MessagesService.mycount(response => {
				vm.messageCount = response.countResult;
			});
		}

		$scope.$on('$stateChangeSuccess', stateChangeSuccess);
		$scope.isHomePage = () => {
			const path = $location.path();
			return !path || path === '/';
		};
		$scope.isActiveMenu = item => {
			let route = item.state || '';
			let active = $state.current.name || '';
			const mr = route.match(/^(.*)\.(list)$/);
			const ma = active.match(/^(.*)\.(edit|view|list)$/);
			if (mr) {
				route = mr[1];
			}
			if (ma) {
				active = ma[1];
			}
			if (route === active) {
				return true;
			}
			if (route === 'admin' && active.substring(0, 5) === 'admin') {
				return true;
			}
		};

		/**
		 * Functions for handling session timeout warnings
		 */

		// if signed in, start a session timer
		if (vm.authentication.user) {
			Idle.watch();
		}

		$scope.$on('IdleStart', () => {
			vm.warning = $uibModal.open({
				size: 'sm',
				animation: true,
				templateUrl:
					'/modules/core/client/views/modal.timeout.warning.html',
				windowClass: 'modal-timeout-warning-dialog',
				backdrop: 'static',
				bindToController: true,
				controllerAs: 'qqq',
				controller: 'WarningModalController'
			});
		});

		$scope.$on('IdleTimeout', () => {
			vm.warning.close();

			// instruct the server to terminate the session
			const client = new XMLHttpRequest();
			client.open('GET', '/api/auth/signout');
			client.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');
			client.send();

			$scope.timedout = $uibModal.open({
				size: 'sm',
				templateUrl: '/modules/core/client/views/modal.timeout.html',
				windowClass: 'modal-timeout-dialog',
				backdrop: 'static',
				bindToController: true,
				controllerAs: 'qqq',
				controller: 'TimeoutModalController'
			});
		});

		$scope.$on('IdleEnd', () => {
			vm.warning.close();
		});

		function stateChangeSuccess() {
			// Collapsing the menu after navigation
			vm.isCollapsed = false;
		}
	}

	function WarningModalController($scope, Idle) {
		const qqq = this;
		qqq.countdown = Idle.getTimeout();
		qqq.max = Idle.getTimeout();

		qqq.getCountdownInMinutes = () => {
			return Math.floor(qqq.countdown / 60);
		};

		$scope.$on('IdleWarn', (e, countdown) => {
			$scope.$apply(() => {
				qqq.countdown = countdown;
			});
		});
	}

	function TimeoutModalController() {
		const qqq = this;
		// inform user and provide option to sign back in
		qqq.handleClickOK = () => {
			window.location.href = '/authentication/signin';
		};
	}
})();
