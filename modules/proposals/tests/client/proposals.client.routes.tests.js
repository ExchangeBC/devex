(function () {
  'use strict';

  describe('Proposals Route Tests', function () {
    // Initialize global variables
    var $scope,
      ProposalsService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _ProposalsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      ProposalsService = _ProposalsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('proposals');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/proposals');
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
          ProposalsController,
          mockProposal;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('proposals.view');
          $templateCache.put('modules/proposals/client/views/view-proposal.client.view.html', '');

          // create mock Proposal
          mockProposal = new ProposalsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Proposal Name'
          });

          // Initialize Controller
          ProposalsController = $controller('ProposalsController as vm', {
            $scope: $scope,
            proposalResolve: mockProposal
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:proposalId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.proposalResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            proposalId: 1
          })).toEqual('/proposals/1');
        }));

        it('should attach an Proposal to the controller scope', function () {
          expect($scope.vm.proposal._id).toBe(mockProposal._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/proposals/client/views/view-proposal.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          ProposalsController,
          mockProposal;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('proposals.create');
          $templateCache.put('modules/proposals/client/views/form-proposal.client.view.html', '');

          // create mock Proposal
          mockProposal = new ProposalsService();

          // Initialize Controller
          ProposalsController = $controller('ProposalsController as vm', {
            $scope: $scope,
            proposalResolve: mockProposal
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.proposalResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/proposals/create');
        }));

        it('should attach an Proposal to the controller scope', function () {
          expect($scope.vm.proposal._id).toBe(mockProposal._id);
          expect($scope.vm.proposal._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/proposals/client/views/form-proposal.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          ProposalsController,
          mockProposal;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('proposals.edit');
          $templateCache.put('modules/proposals/client/views/form-proposal.client.view.html', '');

          // create mock Proposal
          mockProposal = new ProposalsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Proposal Name'
          });

          // Initialize Controller
          ProposalsController = $controller('ProposalsController as vm', {
            $scope: $scope,
            proposalResolve: mockProposal
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:proposalId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.proposalResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            proposalId: 1
          })).toEqual('/proposals/1/edit');
        }));

        it('should attach an Proposal to the controller scope', function () {
          expect($scope.vm.proposal._id).toBe(mockProposal._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/proposals/client/views/form-proposal.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
