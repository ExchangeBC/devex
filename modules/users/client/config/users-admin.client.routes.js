(function () {
  'use strict';

  // Setting up route
  angular
    .module('users.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
          .state('admin.govs', {
        url: '/govs',
        templateUrl: '/modules/users/client/views/admin/list-govs.client.view.html',
        controller: 'GovListController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Government List'
        }
      })
       .state('admin.gov', {
        url: '/govs/:userId',
        templateUrl: '/modules/users/client/views/admin/view-govs.client.view.html',
        controller: 'GovController',
        controllerAs: 'vm',
        resolve: {
          userResolve: getUser
        },
        data: {
          pageTitle: 'Edit {{ userResolve.displayName }}'
        }
      })
      .state('admin.gov-edit', {
        url: '/govs/:userId/edit',
        templateUrl: '/modules/users/client/views/admin/edit-govs.client.view.html',
        controller: 'GovController',
        controllerAs: 'vm',
        resolve: {
          userResolve: getUser
        },
        data: {
          pageTitle: 'Edit Government {{ userResolve.displayName }}'
        }
      })
      .state('admin.users', {
        url: '/users',
        templateUrl: '/modules/users/client/views/admin/list-users.client.view.html',
        controller: 'UserListController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Users List'
        }
      })
      .state('admin.user', {
        url: '/users/:userId',
        templateUrl: '/modules/users/client/views/admin/view-user.client.view.html',
        controller: 'UserController',
        controllerAs: 'vm',
        resolve: {
          userResolve: getUser,
          subscriptions: function (userResolve, NotificationsService) {
            return NotificationsService.subscriptionsForUser ({
              userId: userResolve._id
            }).$promise;
          }
        },
        data: {
          pageTitle: 'Edit {{ userResolve.displayName }}'
        }
      })
      .state('admin.notifyopps', {
        url: '/notifyopps',
        templateUrl: '/modules/users/client/views/admin/listopps.client.view.html',
        controllerAs: 'vm',
        controller: function (users) {
          var vm = this;
          vm.users = users;
        },
        resolve: {
          users: function (AdminService) {
            return AdminService.listopps().$promise;
          }
        }
      })
      .state('admin.notifymeets', {
        url: '/notifymeets',
        templateUrl: '/modules/users/client/views/admin/listmeets.client.view.html',
        controllerAs: 'vm',
        controller: function (users) {
          var vm = this;
          vm.users = users;
        },
        resolve: {
          users: function (AdminService) {
            return AdminService.listmeets().$promise;
          }
        }
      })
      .state('admin.user-edit', {
        url: '/users/:userId/edit',
        templateUrl: '/modules/users/client/views/admin/edit-user.client.view.html',
        controller: 'UserController',
        controllerAs: 'vm',
        resolve: {
          userResolve: getUser,
          subscriptions: function (userResolve, NotificationsService) {
            return NotificationsService.subscriptionsForUser ({
              userId: userResolve._id
            }).$promise;
          }
        },
        data: {
          pageTitle: 'Edit {{ userResolve.displayName }}'
        }
      })
      ;

    getUser.$inject = ['$stateParams', 'AdminService'];

    function getUser($stateParams, AdminService) {
      return AdminService.get({
        userId: $stateParams.userId
      }).$promise;
    }
  }
}());
