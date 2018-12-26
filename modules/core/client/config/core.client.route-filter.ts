(() => {
	'use strict';

	angular.module('core').run(routeFilter);

	routeFilter.$inject = ['$transitions', '$state', 'authenticationService'];

	function routeFilter($transitions, $state, authenticationService) {
		// Store previous state
		function storePreviousState(state, params) {
			// only store this state if it shouldn't be ignored
			if (!state.data || !state.data.ignoreState) {
				$state.previous = {
					state,
					params,
					href: $state.href(state, params)
				};
			}
		}

		// Route filter for org editing - makes sure current user is admin when routing to org editing views
		$transitions.onStart({ to: 'orgadmin.**' }, trans => {
			return new Promise(resolve => {
				// If administrator account, allow
				if (authenticationService.user.roles.indexOf('admin') !== -1) {
					resolve();
				}

				// If not signed redirect to sign-in
				if (!authenticationService.user) {
					storePreviousState(trans.to(), trans.params('to'));
					resolve($state.target('authentication.signin'));
				}

				// Wait for the org to resolve on the route
				trans
					.injector()
					.getAsync('org')
					.then(org => {
						if (
							!org.admins ||
							org.admins
								.map(admin => admin._id)
								.indexOf(authenticationService.user._id) < 0
						) {
							resolve($state.target('forbidden'));
						} else {
							resolve();
						}
					});
			});
		});

		// Main route filter - checks for allowed/denied roles and redirects apppropriately
		$transitions.onStart({}, trans => {
			const userRoles =
				authenticationService.user && authenticationService.user.roles !== undefined
					? authenticationService.user.roles
					: ['guest'];
			const toState = trans.to();

			const allowedRoles =
				toState.data && toState.data.roles ? toState.data.roles : [];
			const deniedRoles =
				toState.data && toState.data.notroles
					? toState.data.notrole
					: [];

			let userHasAccess = true;
			if (allowedRoles.length > 0) {
				userHasAccess = false;
				allowedRoles.forEach(allowedRole => {
					if (
						allowedRole === 'guest' ||
						userRoles.indexOf(allowedRole) >= 0
					) {
						userHasAccess = true;
					}
				});
			}

			if (deniedRoles && deniedRoles.length > 0) {
				deniedRoles.forEach(deniedRole => {
					if (userRoles.indexOf(deniedRole) >= 0) {
						userHasAccess = false;
					}
				});
			}

			// If the user does not have access to this route do one of the following
			// Redirect to sign-in if they haven't authenticated
			// Redirect to 'Forbidden' if they aren't authorized
			if (!userHasAccess) {
				if (!authenticationService.user) {
					storePreviousState(toState, trans.params('to'));
					return $state.target('authentication.signin');
				} else {
					return $state.target('forbidden');
				}
			}
		});
	}
})();
