(function () {
  'use strict';

  describe('Opportunities Route Tests', function () {
    // Initialize global variables
    var $scope,
      OpportunitiesService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _OpportunitiesService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      OpportunitiesService = _OpportunitiesService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('opportunities');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/opportunities');
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
          liststate = $state.get('opportunities.list');
        }));

        it('Should have the correct URL', function () {
          expect(liststate.url).toEqual('');
        });

        it('Should not be abstract', function () {
          expect(liststate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(liststate.templateUrl).toBe('/modules/opportunities/client/views/list-opportunities.client.view.html');
        });
      });

      describe('View Route', function () {
        var viewstate,
          OpportunitiesController,
          mockOpportunity;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('opportunities.view');
          $templateCache.put('/modules/opportunities/client/views/view-opportunity.client.view.html', '');

          // create mock opportunity
          mockOpportunity = new OpportunitiesService({
            _id: '525a8422f6d0f87f0e407a33',
            title: 'An Opportunity about MEAN',
            content: 'MEAN rocks!'
          });

          // Initialize Controller
          OpportunitiesController = $controller('OpportunitiesController as vm', {
            $scope: $scope,
            opportunityResolve: mockOpportunity
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:opportunityId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.opportunityResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            opportunityId: 1
          })).toEqual('/opportunities/1');
        }));

        it('should attach an opportunity to the controller scope', function () {
          expect($scope.vm.opportunity._id).toBe(mockOpportunity._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('/modules/opportunities/client/views/view-opportunity.client.view.html');
        });
      });

      describe('Handle Trailing Slash', function () {
        beforeEach(inject(function ($state, $rootScope, $templateCache) {
          $templateCache.put('/modules/opportunities/client/views/list-opportunities.client.view.html', '');

          $state.go('opportunities.list');
          $rootScope.$digest();
        }));

        it('Should remove trailing slash', inject(function ($state, $location, $rootScope) {
          $location.path('opportunities/');
          $rootScope.$digest();

          expect($location.path()).toBe('/opportunities');
          expect($state.current.templateUrl).toBe('/modules/opportunities/client/views/list-opportunities.client.view.html');
        }));
      });
    });
  });
}());
