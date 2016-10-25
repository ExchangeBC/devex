(function () {
  'use strict';

  describe('Opportunities Controller Tests', function () {
    // Initialize global variables
    var OpportunitiesController,
      $scope,
      $httpBackend,
      $state,
      Authentication,
      OpportunitiesService,
      mockOpportunity;

    // The $resource service augments the response object with methods for updating and deleting the resource.
    // If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
    // the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
    // When the toEqualData matcher compares two objects, it takes only object properties into
    // account and ignores methods.
    beforeEach(function () {
      jasmine.addMatchers({
        toEqualData: function (util, customEqualityTesters) {
          return {
            compare: function (actual, expected) {
              return {
                pass: angular.equals(actual, expected)
              };
            }
          };
        }
      });
    });

    // Then we can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($controller, $rootScope, _$state_, _$httpBackend_, _Authentication_, _OpportunitiesService_) {
      // Set a new global scope
      $scope = $rootScope.$new();

      // Point global variables to injected services
      $httpBackend = _$httpBackend_;
      $state = _$state_;
      Authentication = _Authentication_;
      OpportunitiesService = _OpportunitiesService_;

      // create mock opportunity
      mockOpportunity = new OpportunitiesService({
        _id: '525a8422f6d0f87f0e407a33',
        title: 'An Opportunity about MEAN',
        content: 'MEAN rocks!'
      });

      // Mock logged in user
      Authentication.user = {
        roles: ['user']
      };

      // Initialize the Opportunities controller.
      OpportunitiesController = $controller('OpportunitiesController as vm', {
        $scope: $scope,
        opportunityResolve: {}
      });

      // Spy on state go
      spyOn($state, 'go');
    }));
  });
}());
