// Projects service used to communicate Projects REST endpoints
(function () {
  'use strict';

  angular
    .module('projects')
    .factory('ProjectsService', ProjectsService);

  ProjectsService.$inject = ['$resource', '$log'];

  function ProjectsService($resource, $log) {
    var Project = $resource('/api/projects/:projectId', {
      projectId: '@_id'
    }, {
      update: {
        method: 'PUT'
	  },
      forProgram: {
        method: 'GET',
        url: '/api/projects/for/program/:programId',
        isArray: true
      },
      makeRequest: {
        method: 'GET',
        url :'/api/request/project/:projectId'
      },
      myadmin: {
        method: 'GET',
        url: '/api/myadmin/projects',
        isArray: true
      },
      getRequests: {
        method: 'GET',
        url :'/api/projects/requests/:projectId',
        isArray: true
      },
      getMembers: {
        method: 'GET',
        url :'/api/projects/members/:projectId',
        isArray: true
      },
      confirmMember: {
        method: 'GET',
        url : '/api/projects/requests/confirm/:projectId/:userId'
      },
      denyMember: {
        method: 'GET',
        url : '/api/projects/requests/deny/:projectId/:userId'
      }
    });

    angular.extend(Project.prototype, {
      createOrUpdate: function () {
        var project = this;
        return createOrUpdate(project);
      }
    });
    return Project;

    function createOrUpdate(project) {
      if (project._id) {
        return project.$update(onSuccess, onError);
      } else {
        return project.$save(onSuccess, onError);
      }

      // Handle successful response
      function onSuccess() {
        // Any required internal processing from inside the service, goes here.
      }

      // Handle error response
      function onError(errorResponse) {
        var error = errorResponse.data;
        // Handle error internally
        handleError(error);
      }

      function handleError(error) {
        // Log error
        $log.error(error);
      }
    }
  }
}());
