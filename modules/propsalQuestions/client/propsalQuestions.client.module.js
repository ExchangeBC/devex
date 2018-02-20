(function (app) {
	'use strict';
	// The core module is required for special route handling; see /core/client/config/core.client.routes
	app.registerModule('propsalQuestions', ['core']);
	app.registerModule('propsalQuestions.services');
	app.registerModule('propsalQuestions.routes', ['ui.router', 'core.routes', 'propsalQuestions.services']);
}(ApplicationConfiguration));
