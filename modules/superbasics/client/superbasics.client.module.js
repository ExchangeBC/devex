(function (app) {
	'use strict';
	// The core module is required for special route handling; see /core/client/config/core.client.routes
	app.registerModule('superbasics', ['core']);
	app.registerModule('superbasics.services');
	app.registerModule('superbasics.routes', ['ui.router', 'core.routes', 'superbasics.services']);
}(ApplicationConfiguration));
