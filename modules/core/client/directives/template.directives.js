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
				url: '=url',
				size: '=size',
				text: '=text'
			},
			template: '<span><img class="img-circle" width="{{ avat.size }}" height="{{ avat.size }}" src="{{ avat.url }}"> &nbsp; {{ avat.text }}</img></span>',
			controller: function ($scope) {
				var avat = this;
				var url = this.url;
				avat.size = this.size || 40;
				avat.text = this.text || '';
				var fullPath;
				if (!url) fullPath = '';
				else fullPath = ((url.substr(0,1) === '/' || url.substr(0,4) === 'http') ? '' : '/') + url;
				console.log ('full path', fullPath);
				avat.url = fullPath;
			},
			controllerAs: 'avat',
			bindToController: true,
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
