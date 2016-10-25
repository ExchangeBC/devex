(function () {
  'use strict';

  describe('Projects Route Tests', function () {
    // Initialize global variables
    var $scope,
      ProjectsService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _ProjectsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      ProjectsService = _ProjectsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('projects');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/projects');
        });

        it('Should be abstract', function () {
          expect(mainstate.abstract).toBe(true);
        });

        it('Should have template', function () {
          expect(mainstate.template).toBe('<ui-view/>');
        });
      });

      describe('List Route', function () {
        var liststate;
        beforeEach(inject(function ($state) {
          liststate = $state.get('projects.list');
        }));

        it('Should have the correct URL', function () {
          expect(liststate.url).toEqual('');
        });

        it('Should not be abstract', function () {
          expect(liststate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(liststate.templateUrl).toBe('/modules/projects/client/views/list-projects.client.view.html');
        });
      });

      describe('View Route', function () {
        var viewstate,
          ProjectsController,
          mockProject;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('projects.view');
          $templateCache.put('/modules/projects/client/views/view-project.client.view.html', '');

          // create mock project
          mockProject = new ProjectsService({
            _id: '525a8422f6d0f87f0e407a33',
            title: 'An Project about MEAN',
            content: 'MEAN rocks!'
          });

          // Initialize Controller
          ProjectsController = $controller('ProjectsController as vm', {
            $scope: $scope,
            projectResolve: mockProject
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:projectId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.projectResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            projectId: 1
          })).toEqual('/projects/1');
        }));

        it('should attach an project to the controller scope', function () {
          expect($scope.vm.project._id).toBe(mockProject._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('/modules/projects/client/views/view-project.client.view.html');
        });
      });

      describe('Handle Trailing Slash', function () {
        beforeEach(inject(function ($state, $rootScope, $templateCache) {
          $templateCache.put('/modules/projects/client/views/list-projects.client.view.html', '');

          $state.go('projects.list');
          $rootScope.$digest();
        }));

        it('Should remove trailing slash', inject(function ($state, $location, $rootScope) {
          $location.path('projects/');
          $rootScope.$digest();

          expect($location.path()).toBe('/projects');
          expect($state.current.templateUrl).toBe('/modules/projects/client/views/list-projects.client.view.html');
        }));
      });
    });
  });
}());
