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
          mainstate = $state.get('admin.projects');
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
          liststate = $state.get('admin.projects.list');
        }));

        it('Should have the correct URL', function () {
          expect(liststate.url).toEqual('');
        });

        it('Should be not abstract', function () {
          expect(liststate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(liststate.templateUrl).toBe('/modules/projects/client/views/admin/list-projects.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          ProjectsAdminController,
          mockProject;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('admin.projects.create');
          $templateCache.put('/modules/projects/client/views/admin/form-project.client.view.html', '');

          // Create mock project
          mockProject = new ProjectsService();

          // Initialize Controller
          ProjectsAdminController = $controller('ProjectsAdminController as vm', {
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
          expect($state.href(createstate)).toEqual('/admin/projects/create');
        }));

        it('should attach an project to the controller scope', function () {
          expect($scope.vm.project._id).toBe(mockProject._id);
          expect($scope.vm.project._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('/modules/projects/client/views/admin/form-project.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          ProjectsAdminController,
          mockProject;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('admin.projects.edit');
          $templateCache.put('/modules/projects/client/views/admin/form-project.client.view.html', '');

          // Create mock project
          mockProject = new ProjectsService({
            _id: '525a8422f6d0f87f0e407a33',
            title: 'An Project about MEAN',
            content: 'MEAN rocks!'
          });

          // Initialize Controller
          ProjectsAdminController = $controller('ProjectsAdminController as vm', {
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
          })).toEqual('/admin/projects/1/edit');
        }));

        it('should attach an project to the controller scope', function () {
          expect($scope.vm.project._id).toBe(mockProject._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('/modules/projects/client/views/admin/form-project.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
