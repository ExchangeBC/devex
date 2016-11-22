// Programs service used to communicate Programs REST endpoints
(function () {
  'use strict';

  angular
    .module('programs')
    .factory('ProgramsService', ProgramsService);

  ProgramsService.$inject = ['$resource', '$log'];

  function ProgramsService($resource, $log) {
    var Program = $resource('/api/programs', {}, {
      update: {
        method: 'PUT',
        params: {
          programId: '@_id'
        }
      },
      create: {
        method: 'PUT'
      }
    });

	angular.extend(Program.prototype, {
		createOrUpdate: function () {
		var program = this;
		return createOrUpdate(program);
	}
	});
	return Program;

	function createOrUpdate(program) {
      if (program._id) {
        return program.update(onSuccess, onError);
      } else {
        return program.save(onSuccess, onError);
      }

      // Handle successful response
      function onSuccess(program) {
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
