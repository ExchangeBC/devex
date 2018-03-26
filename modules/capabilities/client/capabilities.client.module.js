(function (app) {
	'use strict';
	// The core module is required for special route handling; see /core/client/config/core.client.routes
	app.registerModule('capabilities', ['core', 'core.admin']);
	app.registerModule('capabilities.services');
	app.registerModule('capabilities.routes', ['ui.router', 'core.routes', 'capabilities.services']);
}(ApplicationConfiguration));
