(function (app) {
  'use strict';

  app.registerModule('programs', ['core']);// The core module is required for special route handling; see /core/client/config/core.client.routes
  app.registerModule('programs.admin', ['core.admin']);
  app.registerModule('programs.admin.routes', ['core.admin.routes']);
  app.registerModule('programs.services');
  app.registerModule('programs.routes', ['ui.router', 'core.routes', 'programs.services']);
}(ApplicationConfiguration));
