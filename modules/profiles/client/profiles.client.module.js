(function (app) {
  'use strict';

  app.registerModule('profiles', ['core']);// The core module is required for special route handling; see /core/client/config/core.client.routes
  app.registerModule('profiles.services');
  app.registerModule('profiles.routes', ['core','ui.router', 'core.routes', 'profiles.services']);
}(ApplicationConfiguration));
