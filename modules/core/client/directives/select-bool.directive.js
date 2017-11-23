'use strict';


angular.module('core')
.directive('selectBoolean', function() {
	return {
		require: 'ngModel',
		transclude: true,
		replace: true,
		scope: {
			ngModel: '=',
			disabled: '=?',
			eventAfter: '@?'
		},
		template: function(elem, attrs) {
			var options = {};
			if (attrs.options) {
				options = JSON.parse(attrs.options);
			}
			var tmpl = '<div';
			// if the label is included with the configuration, add the form-group class, otherwise the
			// label is external and the form-group class should be too.
			if ( !options.horizontal) {
				tmpl += ' show-errors class="form-group  ';
			} else {
				tmpl += ' class="';
			}
			tmpl += 'select-bool-control' + (options.stacked ? ' select-bool-stacked' : '') + '"';
			if ( options.hasOwnProperty('required') ) {
				tmpl += 'ng-class="{\'has-error\': (parentForm.$submitted && parentForm.' + options.name + '.$error)}"';
			}
			tmpl += '>';
			tmpl += '<div type="button" id="' + options.id + '" name="' + options.name + '" ng-click="toggleValue($event)" class="btn btn-full-left ' + (options.icon ? ' btn-has-icon' : '') + '" ng-class="{\'btn-default\':!ngModel, \'btn-{{ ' + options.trueClass + '|| \'info\' }}\': ngModel}">';
			if (options.title) {
				tmpl += '<span>' + options.title + '</span>';
			}
			if (options.icon) {
				tmpl += '<span ng-if="ngModel" class="glyphicon glyphicon-ok guttered" aria-hidden="true"> &nbsp;</span>';
				tmpl += '<span ng-if="!ngModel" class="glyphicon glyphicon-remove guttered" aria-hidden="true"> &nbsp;</span>';
			}
			tmpl += '<span ng-transclude></span>';
			tmpl += '</div></div>';
			return tmpl;
		},
		restrict: 'E',
		compile: function(elem, attrs){
			return {
				post: function(scope, elem, attrs, ngModelCtrl) {
					//
					scope.toggleValue = function(event) {
						if (!scope.disabled) {
							// if a child tag is clicked that requires input, do not bubble the click.
							if (angular.element(event.target).prop('tagName') === 'INPUT'){
								event.stopPropagation();
							} else {
								scope.ngModel = !scope.ngModel;
								ngModelCtrl.$setViewValue(scope.ngModel);
								ngModelCtrl.$render();
								// if event call back, fire it.
								if (scope.eventAfter) {
									scope.$emit(scope.eventAfter, {'title': attrs.name, 'value': scope.ngModel});
								}
							}
						}
					};
					//
					if ( attrs.hasOwnProperty('disabled') ) {
						scope.$watch('disabled', function (newValue, oldValue) {
							if (newValue) {
								angular.element(elem).find('button').attr('disabled', 'disabled');
							} else {
								angular.element(elem).find('button').removeAttr('disabled');
							}
						});
					}
					//
				}
			};
		}
	};
});
