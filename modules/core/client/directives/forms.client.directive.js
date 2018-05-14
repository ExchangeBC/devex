(function () {
	'use strict';

	var templateClass = {
		options: null,
		tmpl: '',
		isRequired: false,
		requiredText: '',
		name: '',
		title: '',
		isTitle: '',
		id: '',
		help: '',
		titleTransclude: false,
		// -------------------------------------------------------------------------
		//
		// this generates the standard first bit of all form displays
		//
		// -------------------------------------------------------------------------
		new: function (options) {
			this.options         = options;
			this.help            = (options.hasOwnProperty('help')) ? options.help : null;
			this.tmpl            = (options.hasOwnProperty('tmpl')) ? options.tmpl : '';
			this.isTitle         = (options.hasOwnProperty('title'));
			this.title           = (this.isTitle) ? options.title : '';
			this.name            = options.name;
			this.titleTransclude = (options.hasOwnProperty('titleTransclude') && options.titleTransclude);
			this.isRequired      = (options.hasOwnProperty('required'));
			this.required        = (this.isRequired && typeof (options.required) === 'string') ? options.required : (this.isTitle ? this.title+' is required' : 'This field is required');
			return this;
		},
		// -------------------------------------------------------------------------
		//
		// start and end the div
		//
		// -------------------------------------------------------------------------
		open: function () {
			this.tmpl += '<div ';
			if (!this.options.horizontal) {
				this.tmpl += 'class="form-group "';
			}
			if (this.isRequired) {
				this.tmpl += 'show-errors ng-class="{\'has-error\': (parentForm.$submitted && parentForm.' + this.name + '.$error)}" ';
			}
			this.tmpl += '>';
			return this;
		},
		close: function () {
			this.tmpl += '</div>';
			return this;
		},
		// -------------------------------------------------------------------------
		//
		// make a label
		//
		// -------------------------------------------------------------------------
		label: function () {
			if (this.isTitle) {
				var fieldtoggle = 'fieldtoggle'+this.name;
				this.tmpl += '<label class="" for="' + this.name + '">' + this.title + '</label>';
				if (this.isRequired) {
					this.tmpl += ' <span class="text-muted" title="This field is required">*</span>';
				}
				if (this.help) {
					this.tmpl += ' &nbsp; <i class="glyphicon glyphicon-question-sign input-help-source" ng-click="$scope.'+fieldtoggle+' = !$scope.'+fieldtoggle+'"></i>';
					this.tmpl += '<div class="input-help alert alert-info" data-field="'+this.name+'" ng-show="$scope.'+fieldtoggle+'">';
					this.tmpl += '<p>'+this.help+'</p>';
					this.tmpl += '</div>';
				}
			}
			if (this.titleTransclude) {
				this.tmpl += '<label class="" for="' + this.name + '" ng-transclude></label>';
			}
			return this;
		},
		// -------------------------------------------------------------------------
		//
		// this generates the required message
		//
		// -------------------------------------------------------------------------
		error: function () {
			if (this.isRequired) {
				this.tmpl += '<div ng-messages="parentForm.$submitted && parentForm.' + this.name + '.$error" role="alert">';
				this.tmpl += '<p class="help-block error-text" ng-message="required">' + this.required + '</p>';
				this.tmpl += '</div>';
			}
			return this;
		},
		// -------------------------------------------------------------------------
		//
		// make an input box
		//
		// -------------------------------------------------------------------------
		inputControl: function (attrs) {
			this.tmpl += '<input ';
			// ----------------------------------------------------------------------------------
			if ( this.options.hasOwnProperty('type') ) {
				this.tmpl += ' type="' + this.options.type + '"';
			} else {
				this.tmpl += ' type="text"';
			}
			// ----------------------------------------------------------------------------------
			this.tmpl += ' id="' + this.options.id + '" name="' + this.options.name + '" class="form-control ';
			// ----------------------------------------------------------------------------------
			// Format as number
			if ( this.options.hasOwnProperty('number') ) {
				this.tmpl += ' format-as-number text-right';
			}
			// ----------------------------------------------------------------------------------
			this.tmpl += '" ng-model="ngModel"';
			// ----------------------------------------------------------------------------------
			// Placeholder
			if ( this.options.hasOwnProperty('placeholder') ) {
				this.tmpl += ' placeholder="' + this.options.placeholder + '"';
			}
			// Validator
			if ( attrs.hasOwnProperty('validate') ) {
				this.tmpl += ' ng-change="processValidator()"';
			} else if ( attrs.hasOwnProperty('validateOf') ) {
				this.tmpl += ' ng-change="callValidator(\'' + attrs.validateOf + '\')"';
			}
			if (attrs.hasOwnProperty ('onchange')) {
				this.tmpl += ' ng-change="'+attrs.onchange+'()"';
			}
			// ----------------------------------------------------------------------------------
			if ( this.options.hasOwnProperty('required') ) {
				this.tmpl += ' required';
			}
			if ( this.options.hasOwnProperty('disabled') ) {
				this.tmpl += ' disabled';
			}
			this.tmpl += '/>';
			return this;
		},
		// -------------------------------------------------------------------------
		//
		// make a date control
		//
		// -------------------------------------------------------------------------
		dateControl: function () {
			var dateformat = (this.options.hasOwnProperty('format')) ? this.options.format : 'dd-MMMM-yyyy';
			this.tmpl += '<div class="input-group">'
			this.tmpl += '<input uib-datepicker-popup="'+dateformat+'" type="text" is-open="popupDate.opened" datepicker-options="dateOptions" show-button-bar="false"';
			this.tmpl += ' id="' + this.options.id + '" name="' + this.name + '" class="form-control " ng-model="ngModel"';
			if ( this.options.hasOwnProperty('placeholder') ) {
				this.tmpl += ' placeholder="' + this.options.placeholder + '"';
			}
			if (this.isRequired) {
				this.tmpl += ' required';
			}
			this.tmpl += '/>';
			this.tmpl += '<span class="input-group-btn">';
			this.tmpl += '<button type="button" class="btn btn-default" ng-click="openPopupDate()"><i class="glyphicon glyphicon-calendar"></i></button>';
			this.tmpl += '</span>';
			this.tmpl += '</div>';
			return this;
		},
		// -------------------------------------------------------------------------
		//
		// just pass through contents
		//
		// -------------------------------------------------------------------------
		transcludeControl: function () {
			this.tmpl += '<p class="form-control-static" ng-transclude></p>';
			return this;
		},
		// -------------------------------------------------------------------------
		//
		// just return the template
		//
		// -------------------------------------------------------------------------
		template: function () {
			return this.tmpl;
		},
		// -------------------------------------------------------------------------
		//
		// methods for actualy doing the different types
		//
		// -------------------------------------------------------------------------
		date: function (attrs) {
			return this.new (JSON.parse(attrs.options)).open().label().dateControl().error().close().template();
		},
		input: function (attrs) {
			return this.new (JSON.parse(attrs.options)).open().label().inputControl(attrs).error().close().template();
		},
		transclude: function (attrs) {
			return this.new (JSON.parse(attrs.options)).open().label().transcludeControl().error().close().template();
		}
	};
	// -------------------------------------------------------------------------
	//
	// for-input makes an input control
	//
	// -------------------------------------------------------------------------
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
				onchange: '@',
				options: '='
			},
			template: function(elem, attrs) {
				if (attrs.hasOwnProperty('draw') && !attrs.draw ) {
					return '';
				}
				return templateClass.input (attrs);
			},
			restrict: 'E',
			link: function($scope, elem, attrs, modelCtrl) {
				// ----------------------------------------------------------------------------------
				var options = JSON.parse(attrs.options);
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
	// -------------------------------------------------------------------------
	//
	// form-date-input makes a date control (uib-date)
	//
	// -------------------------------------------------------------------------
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
				if (attrs.hasOwnProperty('draw') && !attrs.draw ) {
					return '';
				}
				return templateClass.date (attrs);
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
	// -------------------------------------------------------------------------
	//
	// form-display wraps whatever control you put here with label and required
	//
	// -------------------------------------------------------------------------
	.directive('formDisplay', function() {
		return {
			require: 'ngModel',
			replace: true,
			transclude: true,
			scope: {
				options: '='
			},
			template: function(elem, attrs) {
				return templateClass.transclude (attrs);
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
				var $stateChangeStartUnbind = $scope.$on('$stateChangeStart', function(event, next, current) {
					if ($scope.parentForm.$dirty) {
						if (!confirm('You are about to leave the page with unsaved data. Click Cancel to remain here.') ) {
							// Stay on current route if user cancels.
							event.preventDefault();
						}
					}
				});
				$scope.$on('destroy', function () {
					window.onbeforeunload = null;
					$stateChangeStartUnbind();
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
	})
	.directive ('myEnter', function () {
		return function (scope, element, attrs) {
			element.bind ('keydown keypress', function (event) {
				if (event.which === 13) {
					scope.$apply (function (){
						scope.$eval (attrs.myEnter);
					});
					event.preventDefault ();
				}
			});
		};
	})
	;

}());
