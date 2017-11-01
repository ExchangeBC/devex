(function () {
	'use strict';

	angular.module('core')
	.directive('formInput', function() {
		return {
			require: 'ngModel',
			replace: true,
			transclude: true,
			scope: {
				ngModel: '=',
				draw: '=?',
				disabled: '=?',
				parentForm: '=form',
				validate: '=',
				validateOf: '=',
				options: '='
			},
			template: function(elem, attrs) {
				// if draw equates to true
				if (attrs.hasOwnProperty('draw') && !attrs.draw ) {
					return '';
				}
				var options = JSON.parse(attrs.options);
				var tmpl = '<div ';
				// if the label is included with the configuration, add the form-group class, otherwise the
				// label is external and the form-group class should be too.
				if ( !options.horizontal) {
					tmpl += ' show-errors class="form-group "';
				}
				if ( options.hasOwnProperty('required') ) {
					tmpl += 'ng-class="{\'has-error\': (parentForm.$submitted && parentForm.' + options.name + '.$invalid)}"';
				}
				tmpl += '>';
				if ( options.hasOwnProperty('title') ) {
					tmpl += '<label class="" for="' + options.name + '">' + options.title;
					if ( options.hasOwnProperty('required') ) {
						tmpl += ' <span class="text-muted" title="This field is required">*</span>';
					}
					tmpl += '</label>';
				}
				if ( options.hasOwnProperty('titleTransclude') && options.titleTransclude ) {
					tmpl += '<label class="" for="' + options.name + '" ng-transclude></label>';
				}
				tmpl += '<input ';
				// ----------------------------------------------------------------------------------
				if ( options.hasOwnProperty('type') ) {
					tmpl += ' type="' + options.type + '"';
				} else {
					tmpl += ' type="text"';
				}
				// ----------------------------------------------------------------------------------
				tmpl += ' id="' + options.id + '" name="' + options.name + '" class="form-control ';
				// ----------------------------------------------------------------------------------
				// Format as number
				if ( options.hasOwnProperty('number') ) {
					tmpl += ' format-as-number text-right';
				}
				// ----------------------------------------------------------------------------------
				tmpl += '" ng-model="ngModel"';
				// ----------------------------------------------------------------------------------
				// Placeholder
				if ( options.hasOwnProperty('placeholder') ) {
					tmpl += ' placeholder="' + options.placeholder + '"';
				}
				// Validator
				if ( attrs.hasOwnProperty('validate') ) {
					tmpl += ' ng-change="processValidator()"';
				} else if ( attrs.hasOwnProperty('validateOf') ) {
					tmpl += ' ng-change="callValidator(\'' + attrs.validateOf + '\')"';
				}
				// ----------------------------------------------------------------------------------
				if ( options.hasOwnProperty('required') ) {
					tmpl += ' required';
				}
				tmpl += '/>';
				// ----------------------------------------------------------------------------------
				if ( options.hasOwnProperty('required') ) {
					tmpl += '<div ng-messages="parentForm.$submitted && parentForm.' + options.name + '.$invalid" role="alert">';
					tmpl += '<p class="help-block error-text" ng-message="required">' + options.required + '</p>';
					tmpl += '</div>';
				}
				tmpl += '</div>';
				return tmpl;
			},
			restrict: 'E',
			link: function($scope, elem, attrs, modelCtrl) {
				// ----------------------------------------------------------------------------------
				var options = JSON.parse(attrs.options);
				// ----------------------------------------------------------------------------------
				if ( options.hasOwnProperty('number') ) {
					var precision = 3;
					if ( options.hasOwnProperty('numberPrecision') ) {
						precision = parseInt(options.numberPrecision);
					}
					// ERROR: 'number' is not a function
					// $(elem).find('input').number(true, precision, '.', ',', true).on('focus', function () {
					// 	this.select();
					// });
				}
				// ----------------------------------------------------------------------------------
				if ( attrs.hasOwnProperty('disabled') ) {

					$scope.$watch('disabled', function (newValue, oldValue) {
						if (newValue) {
							angular.element(elem).find('input').attr('disabled', 'disabled');
						} else {
							angular.element(elem).find('input').removeAttr('disabled');
						}
					});
				}
				// ----------------------------------------------------------------------------------
				// if validation is set, run the validation to set validity of parent form
				$scope.processValidator = function() {
					$scope.validate( $scope.parentForm[options.name].$viewValue ).then( function(resp) {
						$scope.parentForm[options.name].$setValidity( options.name, resp );
						$scope.$apply();
					});
					//
				};
				// change event handler to trigger another element's validator
				$scope.callValidator = function(name) {
					$scope.$parent.$broadcast('rpc.input.validator.' + name);
				};
				// ----------------------------------------------------------------------------------
				// event handler for other elements who wants trigger this element's validator
				if (attrs.hasOwnProperty('validateOf')) {
					$scope.$on('rpc.input.validator.' + options.name, function(event, data) {
						$scope.processValidator();
					});
				}
			}
		};
	})

	.directive('formDateInput', function() {
		return {
			require: 'ngModel',
			replace: true,
			transclude: true,
			scope: {
				ngModel: '=',
				draw: '=?',
				disabled: '=?',
				parentForm: '=form',
				options: '='
			},
			template: function(elem, attrs) {
				// if draw equates to true
				if (attrs.hasOwnProperty('draw') && !attrs.draw ) {
					return '';
				}
				var options = JSON.parse(attrs.options);

				var tmpl = '<div ';
				// if the label is included with the configuration, add the form-group class, otherwise the
				// label is external and the form-group class should be too.
				if ( !options.horizontal) {
					tmpl += ' show-errors class="form-group "';
				}
				if ( options.hasOwnProperty('required') ) {
					tmpl += 'ng-class="{\'has-error\': (parentForm.$submitted && parentForm.' + options.name + '.$error)}"';
				}
				tmpl += '>';
				if ( options.hasOwnProperty('title') ) {
					tmpl += '<label class="" for="' + options.name + '">' + options.title + '</label>';
				}
				if ( options.hasOwnProperty('titleTransclude') && options.titleTransclude ) {
					tmpl += '<label class="" for="' + options.name + '" ng-transclude></label>';
				}
				tmpl += '<div class="input-group">'
				tmpl += '<input uib-datepicker-popup="dd-MMMM-yyyy" type="text" is-open="popupDate.opened" datepicker-options="dateOptions" show-button-bar="false"';
				tmpl += ' id="' + options.id + '" name="' + options.name + '" class="form-control " ng-model="ngModel"';
				if ( options.hasOwnProperty('placeholder') ) {
					tmpl += ' placeholder="' + options.placeholder + '"';
				}
				if ( options.hasOwnProperty('required') ) {
					tmpl += ' required';
				}
				tmpl += '/>';
				tmpl += '<span class="input-group-btn">';
				tmpl += '<button type="button" class="btn btn-default btn-sm" ng-click="openPopupDate()"><i class="glyphicon glyphicon-calendar"></i></button>';
				tmpl += '</span>';

				if ( options.hasOwnProperty('required') ) {
					tmpl += '<div ng-messages="parentForm.$submitted && parentForm.' + options.name + '.$error" role="alert">';
					tmpl += '<p class="help-block error-text" ng-message="required">' + options.required + '</p>';
					tmpl += '</div>';
				}
				tmpl += '</div>';
				tmpl += '</div>';
				return tmpl;
			},
			restrict: 'E',
			compile: function(element, attributes){
				return {
					pre: function($scope, elem, attrs){
						$scope.dateOptions = {};
						$scope.dateOptions.showWeeks = false;
					},
					post: function($scope, elem, attrs){
						// ----------------------------------------------------------------------------------
						if ( attrs.hasOwnProperty('disabled') ) {
							$scope.$watch('disabled', function (newValue, oldValue) {
								if (newValue) {
									angular.element(elem).find('input').attr('disabled', 'disabled');
								} else {
									angular.element(elem).find('input').removeAttr('disabled');
								}
							});
						}
						// ----------------------------------------------------------------------------------
						$scope.popupDate = {
							opened: false
						};
						// ----------------------------------------------------------------------------------
						$scope.openPopupDate = function() {
							$scope.popupDate.opened = true;
						};
					}
				}
			}
		};
	})
	.directive('formDisplay', function() {
		return {
			require: 'ngModel',
			replace: true,
			transclude: true,
			scope: {
				options: '='
			},
			template: function(elem, attrs) {

				var options = JSON.parse(attrs.options);

				var tmpl = '<div class="form-group ">';
				if ( options.hasOwnProperty('title') ) {
					tmpl += '<label class="" for="' + options.name + '">' + options.title + '</label>';
				}
				tmpl += '<p class="form-control-static" ng-transclude></p>';
				tmpl += '</div>';

				return tmpl;
			},
			restrict: 'E'
		};
	})
	.directive('warnOnExit', function() {
		return {
			restrict: 'A',
			scope: {
				parentForm: '=name'
			},
			link: function($scope, elem, attrs) {
				window.onbeforeunload = function() {
					if ($scope.parentForm.$dirty) {
						return 'You are about to leave the page with unsaved data. Click Cancel to remain here.';
					}
				};
				var $locationChangeStartUnbind = $scope.$on('$locationChangeStart', function(event, next, current) {
					if ($scope.parentForm.$dirty) {
						if ( !confirm('You are about to leave the page with unsaved data. Click Cancel to remain here.') ) {
							// cancel to not allow.
							event.preventDefault();
							return false;
						}
					}
				});
				$scope.$on('destroy', function () {
					window.onbeforeunload = null;
					$locationChangeStartUnbind ();
				})
			}
		};
	})
	.directive('formSaveRevert', function() {
		return {
			replace: true,
			restrict: 'E',
			scope: {
				form: '=',
				revertCallback: '=',
				override: '=',
				stayPage: '='
			},
			templateUrl: '/modules/core/client/views/form-save-revert.client.view.html',
			link: function(scope, elem, attrs) {
				scope.$parent.allowCancel = false;
				// ----------------------------------------------------------------------------------
				// Revert
				// If the project has not been created, abandon and reroute to project list.
				// If the projec thas already been saved, restore the previous save.
				//
				scope.revert = function() {
					if (scope.$parent.allowCancel || scope.override) {
						scope.form.$setPristine();
					}
					scope.revertAction();
				};
				scope.revertAction = function() {
					if (scope.$parent.allowCancel || scope.override) {
						scope.$parent.allowCancel = false;
						if (scope.revertCallback) {
							scope.revertCallback();
						}
					} else {
						scope.$parent.allowCancel = true;
					}
				};
				// ----------------------------------------------------------------------------------
			}
		};
	});

}());
