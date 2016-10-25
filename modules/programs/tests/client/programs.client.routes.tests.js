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
          mainstate = $state.get('programs');
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
          liststate = $state.get('programs.list');
        }));

        it('Should have the correct URL', function () {
          expect(liststate.url).toEqual('');
        });

        it('Should not be abstract', function () {
          expect(liststate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(liststate.templateUrl).toBe('/modules/programs/client/views/list-programs.client.view.html');
        });
      });

      describe('View Route', function () {
        var viewstate,
          ProgramsController,
          mockProgram;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('programs.view');
          $templateCache.put('/modules/programs/client/views/view-program.client.view.html', '');

          // create mock program
          mockProgram = new ProgramsService({
            _id: '525a8422f6d0f87f0e407a33',
            title: 'An Program about MEAN',
            content: 'MEAN rocks!'
          });

          // Initialize Controller
          ProgramsController = $controller('ProgramsController as vm', {
            $scope: $scope,
            programResolve: mockProgram
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:programId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.programResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            programId: 1
          })).toEqual('/programs/1');
        }));

        it('should attach an program to the controller scope', function () {
          expect($scope.vm.program._id).toBe(mockProgram._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('/modules/programs/client/views/view-program.client.view.html');
        });
      });

      describe('Handle Trailing Slash', function () {
        beforeEach(inject(function ($state, $rootScope, $templateCache) {
          $templateCache.put('/modules/programs/client/views/list-programs.client.view.html', '');

          $state.go('programs.list');
          $rootScope.$digest();
        }));

        it('Should remove trailing slash', inject(function ($state, $location, $rootScope) {
          $location.path('programs/');
          $rootScope.$digest();

          expect($location.path()).toBe('/programs');
          expect($state.current.templateUrl).toBe('/modules/programs/client/views/list-programs.client.view.html');
        }));
      });
    });
  });
}());
