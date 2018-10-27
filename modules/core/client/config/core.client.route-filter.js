(function () {
	'use strict';

	angular
		.module('core')
		.run(routeFilter);

	routeFilter.$inject = ['$transitions', '$state', 'Authentication'];

	function routeFilter($transitions, $state, Authentication) {

		// Store previous state
		function storePreviousState(state, params) {
			// only store this state if it shouldn't be ignored
			if (!state.data || !state.data.ignoreState) {
				$state.previous = {
					state: state,
					params: params,
					href: $state.href(state, params)
				};
			}
		}

		// Route filter for org editing - makes sure current user is admin when routing to org editing views
		$transitions.onStart({ to: 'orgadmin.**'}, function(trans) {

			return new Promise(function(resolve, reject) {

				// If administrator account, allow
				if (!!~Authentication.user.roles.indexOf('admin')) {
					resolve();
				}

				// If not signed redirect to sign-in
				if (!Authentication.user) {
					storePreviousState(trans.to(), trans.params('to'));
					resolve($state.target('authentication.signin'));
				}

				// Wait for the org to resolve on the route
				trans.injector().getAsync('org')
				.then(function(org) {
					if (!org.admins || org.admins.map(function(admin) { return admin._id; }).indexOf(Authentication.user._id) < 0) {
						resolve($state.target('forbidden'));
					}
					else {
						resolve();
					}
				});
			})
		});

		// Main route filter - checks for allowed/denied roles and redirects apppropriately
		$transitions.onStart({}, function(trans) {
			var userRoles = (Authentication.user && Authentication.user.roles !== undefined) ? Authentication.user.roles : ['guest'];
			var toState = trans.to();

			var allowedRoles = (toState.data && toState.data.roles) ? toState.data.roles : [];
			var deniedRoles = (toState.data && toState.data.notroles) ? toState.data.notrole : [];

			var userHasAccess = true;
			if (allowedRoles.length > 0) {
				userHasAccess = false;
				allowedRoles.forEach(function(allowedRole) {
					if (allowedRole === 'guest' || userRoles.indexOf(allowedRole) >= 0) {
						userHasAccess = true;
					}
				});
			}

			if (deniedRoles && deniedRoles.length > 0) {
				deniedRoles.forEach(function(deniedRole) {
					if (userRoles.indexOf(deniedRole) >= 0) {
						userHasAccess = false;
					}
				});
			}

			// If the user does not have access to this route do one of the following
			// Redirect to sign-in if they haven't authenticated
			// Redirect to 'Forbidden' if they aren't authorized
			if (!userHasAccess) {
				if (!Authentication.user) {
					storePreviousState(toState, trans.params('to'));
					return $state.target('authentication.signin');
				}
				else {
					return $state.target('forbidden');
				}
			}

		});
	}
}());
