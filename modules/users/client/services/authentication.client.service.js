(function () {
	'use strict';
	// Authentication service for user variables
	angular.module ('users.services').factory ('Authentication', function ($window) {
		var auth = {
			user: $window.user,
			permissions : function () {
				var isUser     = !!$window.user;
				var ret        = isUser ? $window.user : {};
				var isAdmin    = isUser && !!~$window.user.roles.indexOf ('admin');
				var isGov      = isUser && !!~$window.user.roles.indexOf ('gov');
				ret.loggedIn   = isUser;
				ret.isLoggedIn = isUser;
				ret.isUser     = isUser;
				ret.isAdmin    = isAdmin;
				ret.isGov      = isGov;
				return ret;
			}
		};
		return auth;
	});
}());
