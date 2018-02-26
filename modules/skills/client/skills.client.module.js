(function (app) {
	'use strict';
	app.registerModule ('skills', ['core']);
	app.registerModule('skills.services');
	app.registerModule('skills.routes', ['core','ui.router', 'core.routes', 'skills.services']);
}
(ApplicationConfiguration));
