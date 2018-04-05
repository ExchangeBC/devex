(function () {
  'use strict';

  // Users service used for communicating with the users REST endpoint
  angular
    .module('users.services')
    .factory('UsersService', UsersService);

  UsersService.$inject = ['$resource', '$window', 'Authentication'];

  function UsersService($resource, $window, Authentication) {
    var Users = $resource('/api/users', {}, {
      update: {
        method: 'PUT'
      },
      updatePassword: {
        method: 'POST',
        url: '/api/users/password'
      },
      deleteProvider: {
        method: 'DELETE',
        url: '/api/users/accounts',
        params: {
          provider: '@provider'
        }
      },
      self: {
        method: 'GET',
        url: '/api/users/me'
      },
      removeSelf: {
        method: 'DELETE',
        url: '/api/users/delete'
      },
      sendPasswordResetToken: {
        method: 'POST',
        url: '/api/auth/forgot'
      },
      resetPasswordWithToken: {
        method: 'POST',
        url: '/api/auth/reset/:token'
      },
      signup: {
        method: 'POST',
        url: '/api/auth/signup'
      },
      signin: {
        method: 'POST',
        url: '/api/auth/signin'
      },
      numUsers: {
        method: 'GET',
        url: '/api/users/count'
      }
    });

    angular.extend(Users, {
      changePassword: function (passwordDetails) {
        return this.updatePassword(passwordDetails).$promise;
      },
      removeSocialAccount: function (provider) {
        return this.deleteProvider({
          provider: provider // api expects provider as a querystring parameter
        }).$promise;
      },
      requestPasswordReset: function (credentials) {
        return this.sendPasswordResetToken(credentials).$promise;
      },
      resetPassword: function (token, passwordDetails) {
        return this.resetPasswordWithToken({
          token: token // api expects token as a parameter (i.e. /:token)
        }, passwordDetails).$promise;
      },
      userSignup: function (credentials) {
        return this.signup(credentials).$promise;
      },
      userSignin: function (credentials) {
        return this.signin(credentials).$promise;
      },
      countUsers: function () {
        return this.numUsers ().$promise;
      },
      resetMe: function () {
        return this.self ().$promise.then (function (me) {$window.user = me; Authentication.user = me;});
      }
    });

    return Users;
  }


  angular
    .module('users.admin.services')
    .factory('AdminService', AdminService);

  AdminService.$inject = ['$resource'];

  function AdminService($resource) {

    return $resource('/api/users/:userId', {
      userId: '@_id'
    }, {
       approve: {
        method: 'POST',
        url: '/api/approve',
        params: {
          flag: '@flag',
          userId:'@userId'
        }
      },
      listopps: {
        method: 'GET',
        url: '/api/listopps',
        isArray: true
      },
      listmeets: {
        method: 'GET',
        url: '/api/listmeets',
        isArray: true
      },
      update: {
        method: 'PUT'
      }
    });
  }

}());
