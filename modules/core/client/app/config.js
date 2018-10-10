(function (window) {
  'use strict';

  var applicationModuleName = 'mean';

  var service = {
    applicationEnvironment: window.env,
    applicationModuleName: applicationModuleName,
    applicationModuleVendorDependencies: [
    'ngResource',
    'ngAnimate',
    'ngMessages',
    'ui.router',
    'ui.bootstrap',
    'ui.tinymce',
    'ngFileUpload',
    'ngImgCrop',
    'ui-notification',
    'ncy-angular-breadcrumb',
    'dndLists',
	'ngIdle',
	'ngSanitize'
    ],
    registerModule: registerModule
  };

  window.ApplicationConfiguration = service;

  // Add a new vertical module
  function registerModule(moduleName, dependencies) {
    // Create angular module
    angular.module(moduleName, dependencies || []);

    // Add the module to the AngularJS configuration file
    angular.module(applicationModuleName).requires.push(moduleName);
  }

  // Angular-ui-notification configuration
  angular.module('ui-notification').config(['NotificationProvider', function(NotificationProvider) {
    NotificationProvider.setOptions({
      delay: 2000,
      startTop: 20,
      startRight: 10,
      verticalSpacing: 20,
      horizontalSpacing: 20,
      positionX: 'right',
      positionY: 'bottom'
    });
  }]);

  // Angular idle configuration
  angular.module('ngIdle').config(['IdleProvider', 'KeepaliveProvider', function(IdleProvider, KeepaliveProvider) {
    IdleProvider.idle(Number(window.sessionTimeoutWarning));
    IdleProvider.timeout(Number(window.sessionTimeout));
    KeepaliveProvider.interval(2);
  }])
}(window));



