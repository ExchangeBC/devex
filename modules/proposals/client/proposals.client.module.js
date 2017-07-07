(function (app) {
  'use strict';

  app.registerModule('proposals', ['core']);// The core module is required for special route handling; see /core/client/config/core.client.routes
  app.registerModule('proposals.services');
  app.registerModule('proposals.routes', ['ui.router', 'core.routes', 'proposals.services']);
}(ApplicationConfiguration));
