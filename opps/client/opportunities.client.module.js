(function (app) {
  'use strict';

  app.registerModule('opportunities', ['core']);// The core module is required for special route handling; see /core/client/config/core.client.routes
  app.registerModule('opportunities.services');
  app.registerModule('opportunities.routes', ['ui.router', 'core.routes', 'opportunities.services']);
}(ApplicationConfiguration));
