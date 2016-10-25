(function () {
  'use strict';

  describe('Programs Route Tests', function () {
    // Initialize global variables
    var $scope,
      ProgramsService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _ProgramsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      ProgramsService = _ProgramsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('admin.programs');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/programs');
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
          liststate = $state.get('admin.programs.list');
        }));

        it('Should have the correct URL', function () {
          expect(liststate.url).toEqual('');
        });

        it('Should be not abstract', function () {
          expect(liststate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(liststate.templateUrl).toBe('/modules/programs/client/views/admin/list-programs.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          ProgramsAdminController,
          mockProgram;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('admin.programs.create');
          $templateCache.put('/modules/programs/client/views/admin/form-program.client.view.html', '');

          // Create mock program
          mockProgram = new ProgramsService();

          // Initialize Controller
          ProgramsAdminController = $controller('ProgramsAdminController as vm', {
            $scope: $scope,
            programResolve: mockProgram
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.programResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/admin/programs/create');
        }));

        it('should attach an program to the controller scope', function () {
          expect($scope.vm.program._id).toBe(mockProgram._id);
          expect($scope.vm.program._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('/modules/programs/client/views/admin/form-program.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          ProgramsAdminController,
          mockProgram;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('admin.programs.edit');
          $templateCache.put('/modules/programs/client/views/admin/form-program.client.view.html', '');

          // Create mock program
          mockProgram = new ProgramsService({
            _id: '525a8422f6d0f87f0e407a33',
            title: 'An Program about MEAN',
            content: 'MEAN rocks!'
          });

          // Initialize Controller
          ProgramsAdminController = $controller('ProgramsAdminController as vm', {
            $scope: $scope,
            programResolve: mockProgram
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:programId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.programResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            programId: 1
          })).toEqual('/admin/programs/1/edit');
        }));

        it('should attach an program to the controller scope', function () {
          expect($scope.vm.program._id).toBe(mockProgram._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('/modules/programs/client/views/admin/form-program.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
