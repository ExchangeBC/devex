// (function () {
// 	'use strict';
// 	// <form-input
// 	// 	ng-model="org.organization.zip"
// 	// 	x-form="organizationForm"
// 	// 	x-options='{
// 	// 		"title":"Zip",
// 	// 		"id":"zip",
// 	// 		"name":"zip"
// 	// 	}'></form-input>
// 	angular.module('core')
// 	.directive('formInput', function() {
// 		return {
// 			require: 'ngModel',
// 			replace: true,
// 			scope: {
// 				ngModel: '=',
// 				draw: '=',
// 				parentForm: '=form',
// 				options: '='
// 			},
// 			template: function(elem, attrs) {
// 				// if draw equates to true
// 				if (attrs.hasOwnProperty('draw') && !attrs.draw ) {
// 					return '';
// 				}
// 				var options = JSON.parse(attrs.options);

// 				var tmp = '<div show-errors class="form-group form-group-sm">';
// 				if ( options.hasOwnProperty('title') ) {
// 					tmp += '<label class="small" for="' + options.name + '">' + options.title + '</label>';
// 				}
// 				tmp += '<input ';

// 				if ( options.hasOwnProperty('type') ) {
// 					tmp += ' type="' + options.type + '"';
// 				} else {
// 					tmp += ' type="text"';
// 				}
// 				tmp += ' id="' + options.id + '" name="' + options.name + '" class="form-control input-sm" ng-model="ngModel"';

// 				if ( options.hasOwnProperty('placeholder') ) {
// 					tmp += ' placeholder="' + options.placeholder + '"';
// 				}
// 				if ( options.hasOwnProperty('required') ) {
// 					tmp += ' required';
// 				}
// 				tmp += '/>';

// 				if ( options.hasOwnProperty('required') ) {
// 					tmp += '<div ng-messages="parentForm.$submitted && parentForm.' + options.name + '.$error" role="alert">';
// 					tmp += '<p class="help-block error-text" ng-message="required">' + options.required + '</p>';
// 					tmp += '</div>';
// 				}
// 				tmp += '</div>';

// 				return tmp;
// 			},
// 			restrict: 'E'
// 		};
// 	})
// 	.directive('formDisplay', function() {
// 		return {
// 			require: 'ngModel',
// 			replace: true,
// 			transclude: true,
// 			scope: {
// 				options: '='
// 			},
// 			template: function(elem, attrs) {

// 				var options = JSON.parse(attrs.options);

// 				var tmp = '<div class="form-group form-group-sm">';
// 				if ( options.hasOwnProperty('title') ) {
// 					tmp += '<label class="small" for="' + options.name + '">' + options.title + '</label>';
// 				}
// 				tmp += '<p class="form-control-static" ng-transclude></p>';
// 				tmp += '</div>';

// 				return tmp;
// 			},
// 			restrict: 'E'
// 		};
// 	})
// 	.directive('warnOnExit', function() {
// 		return {
// 			restrict: 'A',
// 			scope: {
// 				parentForm: '=name'
// 			},
// 			link: function($scope, elem, attrs) {
// 				window.onbeforeunload = function() {
// 					if ($scope.parentForm.$dirty) {
// 						return 'onbeforeunload: You are about to leave the page with unsaved data. Click Cancel to remain here.';
// 					}
// 				};
// 				var $locationChangeStartUnbind = $scope.$on('$stateChangeStart', function (event) {
// 					if ( ($scope.parentForm.$dirty)  && ( !confirm('You are about to leave the page with unsaved data. Click Cancel to remain here.') )  ) {							// cancel to not allow.
// 							event.preventDefault();
// 							return false;

// 					}
// 				});
// 				$scope.$on('destroy', function () {
// 					window.onbeforeunload = null;
// 					$locationChangeStartUnbind ();
// 				})
// 			}
// 		};
//     });

// }());
