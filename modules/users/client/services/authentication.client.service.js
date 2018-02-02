(function () {
	'use strict';
	// Authentication service for user variables
	angular.module ('users.services').factory ('Authentication', function ($window) {
		var auth = {
			user: $window.user
		};
		auth.isUser   = !!auth.user;
		auth.loggedIn = auth.isUser;
		auth.isAdmin  = auth.isUser && !!~auth.user.roles.indexOf ('admin');
		auth.isGov    = auth.isUser && !!~auth.user.roles.indexOf ('gov');
		return auth;
	});
}());
