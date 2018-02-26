(function (app) {
  'use strict';

  app.registerModule('superbasics', ['core']);// The core module is required for special route handling; see /core/client/config/core.client.routes
  app.registerModule('superbasics.services');
  app.registerModule('superbasics.routes', ['ui.router', 'core.routes', 'superbasics.services']);
}(ApplicationConfiguration));
