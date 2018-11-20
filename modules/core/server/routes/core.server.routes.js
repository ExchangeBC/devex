'use strict';

const path = require('path');
const fileStream = require(path.resolve('./config/lib/filestream'));
const config = require(path.resolve('./config/config'));

module.exports = function(app) {
	// Root routing
	var core = require('../controllers/core.server.controller');

	// Define error pages
	app.route('/server-error').get(core.renderServerError);

	// Return a 404 for all undefined api, module or lib routes
	app.route('/:url(api|modules|lib)/*').get(core.renderNotFound);

	app.route('/home').get(function(req, res) {
		res.set('location', 'https://bcdevexchange.org');
		res.status(301).send();
	});
	app.route('/developers').get(function(req, res) {
		res.set('location', 'https://bcdevexchange.org/codewithus');
		res.status(301).send();
	});

	// Define route for downloading terms
	app.route('/terms/:version').get((req, res) => {
		const version = req.params.version;
		const fileobj = config.terms[version];
		var home = config.home;
		if (fileobj) {
			return fileStream(res, home + '/' + fileobj.path, fileobj.name, fileobj.type);
		} else {
			res.status(401).send({ message: 'No terms file found' });
		}
	});

	// Define application route
	app.route('/*').get(core.renderIndex);
};
