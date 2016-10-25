(function () {
  'use strict';

  describe('Teams Route Tests', function () {
    // Initialize global variables
    var $scope,
      TeamsService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _TeamsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      TeamsService = _TeamsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('admin.teams');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/teams');
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
          liststate = $state.get('admin.teams.list');
        }));

        it('Should have the correct URL', function () {
          expect(liststate.url).toEqual('');
        });

        it('Should be not abstract', function () {
          expect(liststate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(liststate.templateUrl).toBe('/modules/teams/client/views/admin/list-teams.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          TeamsAdminController,
          mockTeam;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('admin.teams.create');
          $templateCache.put('/modules/teams/client/views/admin/form-team.client.view.html', '');

          // Create mock team
          mockTeam = new TeamsService();

          // Initialize Controller
          TeamsAdminController = $controller('TeamsAdminController as vm', {
            $scope: $scope,
            teamResolve: mockTeam
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.teamResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/admin/teams/create');
        }));

        it('should attach an team to the controller scope', function () {
          expect($scope.vm.team._id).toBe(mockTeam._id);
          expect($scope.vm.team._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('/modules/teams/client/views/admin/form-team.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          TeamsAdminController,
          mockTeam;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('admin.teams.edit');
          $templateCache.put('/modules/teams/client/views/admin/form-team.client.view.html', '');

          // Create mock team
          mockTeam = new TeamsService({
            _id: '525a8422f6d0f87f0e407a33',
            title: 'An Team about MEAN',
            content: 'MEAN rocks!'
          });

          // Initialize Controller
          TeamsAdminController = $controller('TeamsAdminController as vm', {
            $scope: $scope,
            teamResolve: mockTeam
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:teamId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.teamResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            teamId: 1
          })).toEqual('/admin/teams/1/edit');
        }));

        it('should attach an team to the controller scope', function () {
          expect($scope.vm.team._id).toBe(mockTeam._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('/modules/teams/client/views/admin/form-team.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
