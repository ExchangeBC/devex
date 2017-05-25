(function () {
  'use strict';

  describe('Notifications Route Tests', function () {
    // Initialize global variables
    var $scope,
      NotificationsService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _NotificationsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      NotificationsService = _NotificationsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('notifications');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/notifications');
        });

        it('Should be abstract', function () {
          expect(mainstate.abstract).toBe(true);
        });

        it('Should have template', function () {
          expect(mainstate.template).toBe('<ui-view/>');
        });
      });

      describe('View Route', function () {
        var viewstate,
          NotificationsController,
          mockNotification;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('notifications.view');
          $templateCache.put('modules/notifications/client/views/view-notification.client.view.html', '');

          // create mock Notification
          mockNotification = new NotificationsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Notification Name'
          });

          // Initialize Controller
          NotificationsController = $controller('NotificationsController as vm', {
            $scope: $scope,
            notificationResolve: mockNotification
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:notificationId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.notificationResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            notificationId: 1
          })).toEqual('/notifications/1');
        }));

        it('should attach an Notification to the controller scope', function () {
          expect($scope.vm.notification._id).toBe(mockNotification._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/notifications/client/views/view-notification.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          NotificationsController,
          mockNotification;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('notifications.create');
          $templateCache.put('modules/notifications/client/views/form-notification.client.view.html', '');

          // create mock Notification
          mockNotification = new NotificationsService();

          // Initialize Controller
          NotificationsController = $controller('NotificationsController as vm', {
            $scope: $scope,
            notificationResolve: mockNotification
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.notificationResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/notifications/create');
        }));

        it('should attach an Notification to the controller scope', function () {
          expect($scope.vm.notification._id).toBe(mockNotification._id);
          expect($scope.vm.notification._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/notifications/client/views/form-notification.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          NotificationsController,
          mockNotification;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('notifications.edit');
          $templateCache.put('modules/notifications/client/views/form-notification.client.view.html', '');

          // create mock Notification
          mockNotification = new NotificationsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Notification Name'
          });

          // Initialize Controller
          NotificationsController = $controller('NotificationsController as vm', {
            $scope: $scope,
            notificationResolve: mockNotification
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:notificationId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.notificationResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            notificationId: 1
          })).toEqual('/notifications/1/edit');
        }));

        it('should attach an Notification to the controller scope', function () {
          expect($scope.vm.notification._id).toBe(mockNotification._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/notifications/client/views/form-notification.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
