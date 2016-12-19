(function (app) {
  'use strict';

  app.registerModule('programs', ['core']);// The core module is required for special route handling; see /core/client/config/core.client.routes
  app.registerModule('programs.services');
  app.registerModule('programs.routes', ['core','ui.router', 'core.routes', 'programs.services']);
}(ApplicationConfiguration));
