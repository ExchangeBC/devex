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
          mainstate = $state.get('teams');
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
          liststate = $state.get('teams.list');
        }));

        it('Should have the correct URL', function () {
          expect(liststate.url).toEqual('');
        });

        it('Should not be abstract', function () {
          expect(liststate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(liststate.templateUrl).toBe('/modules/teams/client/views/list-teams.client.view.html');
        });
      });

      describe('View Route', function () {
        var viewstate,
          TeamsController,
          mockTeam;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('teams.view');
          $templateCache.put('/modules/teams/client/views/view-team.client.view.html', '');

          // create mock team
          mockTeam = new TeamsService({
            _id: '525a8422f6d0f87f0e407a33',
            title: 'An Team about MEAN',
            content: 'MEAN rocks!'
          });

          // Initialize Controller
          TeamsController = $controller('TeamsController as vm', {
            $scope: $scope,
            teamResolve: mockTeam
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:teamId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.teamResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            teamId: 1
          })).toEqual('/teams/1');
        }));

        it('should attach an team to the controller scope', function () {
          expect($scope.vm.team._id).toBe(mockTeam._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('/modules/teams/client/views/view-team.client.view.html');
        });
      });

      describe('Handle Trailing Slash', function () {
        beforeEach(inject(function ($state, $rootScope, $templateCache) {
          $templateCache.put('/modules/teams/client/views/list-teams.client.view.html', '');

          $state.go('teams.list');
          $rootScope.$digest();
        }));

        it('Should remove trailing slash', inject(function ($state, $location, $rootScope) {
          $location.path('teams/');
          $rootScope.$digest();

          expect($location.path()).toBe('/teams');
          expect($state.current.templateUrl).toBe('/modules/teams/client/views/list-teams.client.view.html');
        }));
      });
    });
  });
}());
