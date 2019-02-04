'use strict';

import { StateService, TransitionService } from '@uirouter/core';
import angular from 'angular';
import { IOrg } from '../../../orgs/shared/IOrgDTO';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';

class CoreClientRouteFilter {
	constructor(private $transitions: TransitionService, private $state: StateService, private AuthenticationService: IAuthenticationService) {}

	public initFilters(): void {
		this.$transitions.onStart({ to: 'orgadmin.**' }, trans => {
			// return new Promise(resolve => {
			// If administrator account, allow
			if (this.AuthenticationService.user.roles.indexOf('admin') !== -1) {
				return;
			}

			// If not signed redirect to sign-in
			if (!this.AuthenticationService.user) {
				return this.$state.target('authentication.signin');
			}

			// Wait for the org to resolve on the route
			trans
				.injector()
				.getAsync('org')
				.then((org: IOrg) => {
					if (!org.admins || org.admins.map(admin => admin._id).indexOf(this.AuthenticationService.user._id) < 0) {
						return this.$state.target('forbidden');
					} else {
						return;
					}
				});
			// });
		});

		// Main route filter - checks for allowed/denied roles and redirects apppropriately
		this.$transitions.onStart({}, trans => {
			const userRoles = this.AuthenticationService.user && this.AuthenticationService.user.roles !== undefined ? this.AuthenticationService.user.roles : ['guest'];

			const toState = trans.to();

			const allowedRoles: string[] = toState.data && toState.data.roles ? toState.data.roles : [];
			const deniedRoles: string[] = toState.data && toState.data.notroles ? toState.data.notrole : [];

			let userHasAccess = true;
			if (allowedRoles.length > 0) {
				userHasAccess = false;
				allowedRoles.forEach(allowedRole => {
					if (allowedRole === 'guest' || userRoles.indexOf(allowedRole) >= 0) {
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
				if (!this.AuthenticationService.user) {
					return this.$state.target('authentication.signin');
				} else {
					return this.$state.target('forbidden');
				}
			}
		});
	}
}

angular.module('core').run([
	'$transitions',
	'$state',
	'AuthenticationService',
	($transitions: TransitionService, $state: StateService, AuthenticationService: IAuthenticationService) => {
		const filter = new CoreClientRouteFilter($transitions, $state, AuthenticationService);
		filter.initFilters();
	}
]);
