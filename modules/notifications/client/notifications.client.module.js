(function (app) {
  'use strict';

  app.registerModule('notifications', ['core']);// The core module is required for special route handling; see /core/client/config/core.client.routes
  app.registerModule('notifications.services');
  app.registerModule('notifications.routes', ['ui.router', 'core.routes', 'notifications.services']);
}(ApplicationConfiguration));
