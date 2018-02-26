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
				url: '=',
				size: '=',
				text: '='
			},
			template: '<span><img class="img-circle" width="{{ avat.size }}" height="{{ avat.size }}" src="{{ avat.fullurl }}"> &nbsp; {{ avat.text }}</img></span>',
			controller: function ($scope) {
				var avat = this;
				var seturl = function () {
					var url = $scope.url;
					var fullPath;
					if (!url) fullPath = '';
					else fullPath = ((url.substr(0,1) === '/' || url.substr(0,4) === 'http') ? '' : '/') + url;
					// console.log ('full path', fullPath);
					avat.fullurl = fullPath;
				};
				avat.size = $scope.size || 40;
				avat.text = $scope.text || '';
				seturl ();
				$scope.$watch('url', function (newValue, oldValue) {
					// console.log ('CHANGE CHANGE');
					if (newValue) {
						seturl ();
					}
				});
			},
			controllerAs: 'avat',
			restrict: 'EAC'
		};
	})
	.directive ('badgeDisplay', function () {
		return {
			replace : true,
			scope   : {
				badges : '='
			},
			restrict: 'EAC',
			template : function (elem, attrs) {
				var badges = attrs.badges;
				console.log ('badges', badges);
				var isarray = false;
				var isarrayofobjects = false;
				var outarray;
				var tmplarray;
				if (Object.prototype.toString.call ( badges ) === '[object Array]') {
					isarray = true;
					if (badges[0] === Object(badges[0])) {
						isarrayofobjects = true;
					}
				}
				if (isarrayofobjects) {
					outarray = badges.map (function (obj) {
						return obj.description;
					});
				}
				else if (isarray) {
					outarray = badges;
				}
				else {
					//
					// assume string
					//
					outarray = badges.split (/[, ]/);
				}
				tmplarray = outarray.map (function (thing) {
					return '<span class="badge">'+thing+'</span>';
				});
				return tmplarray.join (' ');
			}
		};
	})
	;
}());
