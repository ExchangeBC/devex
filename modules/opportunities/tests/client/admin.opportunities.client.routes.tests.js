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
          mainstate = $state.get('admin.opportunities');
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
          liststate = $state.get('admin.opportunities.list');
        }));

        it('Should have the correct URL', function () {
          expect(liststate.url).toEqual('');
        });

        it('Should be not abstract', function () {
          expect(liststate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(liststate.templateUrl).toBe('/modules/opportunities/client/views/admin/list-opportunities.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          OpportunitiesAdminController,
          mockOpportunity;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('admin.opportunities.create');
          $templateCache.put('/modules/opportunities/client/views/admin/form-opportunity.client.view.html', '');

          // Create mock opportunity
          mockOpportunity = new OpportunitiesService();

          // Initialize Controller
          OpportunitiesAdminController = $controller('OpportunitiesAdminController as vm', {
            $scope: $scope,
            opportunityResolve: mockOpportunity
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.opportunityResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/admin/opportunities/create');
        }));

        it('should attach an opportunity to the controller scope', function () {
          expect($scope.vm.opportunity._id).toBe(mockOpportunity._id);
          expect($scope.vm.opportunity._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('/modules/opportunities/client/views/admin/form-opportunity.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          OpportunitiesAdminController,
          mockOpportunity;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('admin.opportunities.edit');
          $templateCache.put('/modules/opportunities/client/views/admin/form-opportunity.client.view.html', '');

          // Create mock opportunity
          mockOpportunity = new OpportunitiesService({
            _id: '525a8422f6d0f87f0e407a33',
            title: 'An Opportunity about MEAN',
            content: 'MEAN rocks!'
          });

          // Initialize Controller
          OpportunitiesAdminController = $controller('OpportunitiesAdminController as vm', {
            $scope: $scope,
            opportunityResolve: mockOpportunity
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:opportunityId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.opportunityResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            opportunityId: 1
          })).toEqual('/admin/opportunities/1/edit');
        }));

        it('should attach an opportunity to the controller scope', function () {
          expect($scope.vm.opportunity._id).toBe(mockOpportunity._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('/modules/opportunities/client/views/admin/form-opportunity.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
