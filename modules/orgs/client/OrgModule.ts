'use strict';

ApplicationConfiguration.registerModule('orgs', ['core']);
ApplicationConfiguration.registerModule('orgs.services');
ApplicationConfiguration.registerModule('orgs.routes', ['core', 'ui.router', 'core.routes', 'orgs.services']);
