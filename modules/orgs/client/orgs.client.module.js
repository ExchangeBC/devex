(function (app) {
  'use strict';

  app.registerModule('orgs', ['core']);// The core module is required for special route handling; see /core/client/config/core.client.routes
  app.registerModule('orgs.services');
  app.registerModule('orgs.routes', ['core','ui.router', 'core.routes', 'orgs.services']);
}(ApplicationConfiguration));
