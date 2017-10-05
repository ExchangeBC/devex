(function () {
	'use strict';
	angular.module('core')
	//
	// usage: <avatar-display url="profile.user.profileImageURL"></avatar-display>
	//
	.directive('avatarDisplay', function() {
		return {
			replace: true,
			// transclude: true,
			scope: {
				url: '=url'
			},
			// template: function (elem, attrs) {
			// 	var tmp = '<div class="card-img"><img class="card-img-left img-rounded" src="';
			// 	tmp += fullPath;
			// 	tmp += '"/></div>';
			// 	return tmp;
			// },
			template: '<div class="card-img img-rounded"><img class="card-img-left " src="{{ avat.url }}"></img></div>',
			controller: function ($scope) {
				var avat = this;
				var url = this.url;
				var fullPath = ((url.substr(0,1) === '/' || url.substr(0,4) === 'http') ? '' : '/') + url;
				console.log ('full path', fullPath);
				avat.url = fullPath;
			},
			controllerAs: 'avat',
			bindToController: true,
			restrict: 'EAC'
		};
	})
	;
}());
