(() => {
	'use strict';

	angular.module('core').factory('authInterceptor', authInterceptor);

	authInterceptor.$inject = ['$q', '$injector', 'AuthenticationService'];

	function authInterceptor($q, $injector, authenticationService) {
		const service = {
			responseError
		};

		return service;

		function responseError(rejection) {
			if (rejection.config && !rejection.config.ignoreAuthModule) {
				switch (rejection.status) {
					case 400:
						$injector.get('$state').go('bad-request', {
							message: rejection.data.message
						});
						break;
					case 401:
						// Deauthenticate the global user
						authenticationService.user = null;
						$injector.get('$state').transitionTo('authentication.signin');
						break;
					case 403:
						authenticationService.user = null;
						$injector.get('$state').transitionTo('authentication.signin');
						break;
					case 404:
						$injector.get('$state').go('not-found', {
							message: rejection.data.message
						});
						break;
					case 500: // Handle error if 500 response from server.
						const N500 = $injector.get('Notification');
						N500.error({
							message: 'Error response received from server. Please try again later.',
							title: 'Error processing request!',
							delay: 5000
						});
						break;
					case -1: // Handle error if no response from server(Network Lost or Server not responding)
						const Notification = $injector.get('Notification');
						Notification.error({
							message: 'No response received from server. Please try again later.',
							title: 'Error processing request!',
							delay: 5000
						});
						break;
					default:
						break;
				}
			}
			// otherwise, default behaviour
			return $q.reject(rejection);
		}
	}
})();
