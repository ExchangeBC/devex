(function () {
  'use strict';

  describe('Activities Route Tests', function () {
    // Initialize global variables
    var $scope,
      ActivitiesService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _ActivitiesService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      ActivitiesService = _ActivitiesService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('activities');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/activities');
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
          ActivitiesController,
          mockActivity;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('activities.view');
          $templateCache.put('modules/activities/client/views/view-activity.client.view.html', '');

          // create mock Activity
          mockActivity = new ActivitiesService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Activity Name'
          });

          // Initialize Controller
          ActivitiesController = $controller('ActivitiesController as vm', {
            $scope: $scope,
            activityResolve: mockActivity
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:activityId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.activityResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            activityId: 1
          })).toEqual('/activities/1');
        }));

        it('should attach an Activity to the controller scope', function () {
          expect($scope.vm.activity._id).toBe(mockActivity._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/activities/client/views/view-activity.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          ActivitiesController,
          mockActivity;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('admin.activities.create');
          $templateCache.put('modules/activities/client/views/form-activity.client.view.html', '');

          // create mock Activity
          mockActivity = new ActivitiesService();

          // Initialize Controller
          ActivitiesController = $controller('ActivitiesController as vm', {
            $scope: $scope,
            activityResolve: mockActivity
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.activityResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/activities/create');
        }));

        it('should attach an Activity to the controller scope', function () {
          expect($scope.vm.activity._id).toBe(mockActivity._id);
          expect($scope.vm.activity._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/activities/client/views/form-activity.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          ActivitiesController,
          mockActivity;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('admin.activities.edit');
          $templateCache.put('modules/activities/client/views/form-activity.client.view.html', '');

          // create mock Activity
          mockActivity = new ActivitiesService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Activity Name'
          });

          // Initialize Controller
          ActivitiesController = $controller('ActivitiesController as vm', {
            $scope: $scope,
            activityResolve: mockActivity
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:activityId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.activityResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            activityId: 1
          })).toEqual('/activities/1/edit');
        }));

        it('should attach an Activity to the controller scope', function () {
          expect($scope.vm.activity._id).toBe(mockActivity._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/activities/client/views/form-activity.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
