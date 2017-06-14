'use strict';

module.exports = function (app) {
  // Root routing
  var core = require('../controllers/core.server.controller');

  // Define error pages
  app.route('/server-error').get(core.renderServerError);

  // Return a 404 for all undefined api, module or lib routes
  app.route('/:url(api|modules|lib)/*').get(core.renderNotFound);

  app.route ('/home').get(function (req, res) {
	res.set ('location', 'https://bcdevexchange.org');
	res.status(301).send();
  });
  app.route ('/developers').get(function (req, res) {
	res.set ('location', 'https://bcdevexchange.org/codewithus');
	res.status(301).send();
  });

  // Define application route
  app.route('/*').get(core.renderIndex);

};
