(() => {
	'use strict';
	angular
		.module('core')
		//
		// usage: <avatar-display url="profile.user.profileImageURL"></avatar-display>
		//
		.directive('avatarDisplay', () => {
			return {
				replace: true,
				// transclude: true,
				scope: {
					url: '=',
					size: '=',
					text: '='
				},
				template:
					'<span> \
					<img class="rounded-circle" width="{{ avat.size }}" \
					height="{{ avat.size }}" src="{{ avat.fullurl }}"> &nbsp; {{ avat.text }} \
					</img> \
					</span>',
				controller: [
					'$scope',
					function($scope) {
						const avat = this;
						const seturl = () => {
							const url = $scope.url;
							let fullPath;
							if (!url) {
								fullPath = '';
							} else {
								fullPath =
									(url.substr(0, 1) === '/' ||
									url.substr(0, 4) === 'http'
										? ''
										: '/') + url;
							}
							avat.fullurl = fullPath;
						};
						avat.size = $scope.size || 50;
						avat.text = $scope.text || '';
						seturl();
						$scope.$watch('url', newValue => {
							if (newValue) {
								seturl();
							}
						});
					}
				],
				controllerAs: 'avat',
				restrict: 'EAC'
			};
		})
		.directive('badgeDisplay', () => {
			return {
				replace: true,
				scope: {
					badges: '='
				},
				restrict: 'EAC',
				template: (elem, attrs) => {
					const badges = attrs.badges;
					let isarray = false;
					let isarrayofobjects = false;
					let outarray;
					let tmplarray;
					if (
						Object.prototype.toString.call(badges) ===
						'[object Array]'
					) {
						isarray = true;
						if (badges[0] === Object(badges[0])) {
							isarrayofobjects = true;
						}
					}
					if (isarrayofobjects) {
						outarray = badges.map(obj => {
							return obj.description;
						});
					} else if (isarray) {
						outarray = badges;
					} else {
						//
						// assume string
						//
						outarray = badges.split(/[, ]/);
					}
					tmplarray = outarray.map(thing => {
						return '<span class="badge">' + thing + '</span>';
					});
					return tmplarray.join(' ');
				}
			};
		});
})();
