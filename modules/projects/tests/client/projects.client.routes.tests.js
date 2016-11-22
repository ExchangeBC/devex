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

      describe('View Route', function () {
        var viewstate,
          ProjectsController,
          mockProject;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('projects.view');
          $templateCache.put('modules/projects/client/views/view-project.client.view.html', '');

          // create mock Project
          mockProject = new ProjectsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Project Name'
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

        it('should attach an Project to the controller scope', function () {
          expect($scope.vm.project._id).toBe(mockProject._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/projects/client/views/view-project.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          ProjectsController,
          mockProject;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('projects.create');
          $templateCache.put('modules/projects/client/views/form-project.client.view.html', '');

          // create mock Project
          mockProject = new ProjectsService();

          // Initialize Controller
          ProjectsController = $controller('ProjectsController as vm', {
            $scope: $scope,
            projectResolve: mockProject
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.projectResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/projects/create');
        }));

        it('should attach an Project to the controller scope', function () {
          expect($scope.vm.project._id).toBe(mockProject._id);
          expect($scope.vm.project._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/projects/client/views/form-project.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          ProjectsController,
          mockProject;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('projects.edit');
          $templateCache.put('modules/projects/client/views/form-project.client.view.html', '');

          // create mock Project
          mockProject = new ProjectsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Project Name'
          });

          // Initialize Controller
          ProjectsController = $controller('ProjectsController as vm', {
            $scope: $scope,
            projectResolve: mockProject
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:projectId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.projectResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            projectId: 1
          })).toEqual('/projects/1/edit');
        }));

        it('should attach an Project to the controller scope', function () {
          expect($scope.vm.project._id).toBe(mockProject._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/projects/client/views/form-project.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
