(() => {
	'use strict';

	const templateClass = {
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
		new(options) {
			this.options = options;
			this.help = options.hasOwnProperty('help') ? options.help : null;
			this.tmpl = options.hasOwnProperty('tmpl') ? options.tmpl : '';
			this.isTitle = options.hasOwnProperty('title');
			this.title = this.isTitle ? options.title : '';
			this.name = options.name;
			this.titleTransclude =
				options.hasOwnProperty('titleTransclude') &&
				options.titleTransclude;
			this.isRequired = options.hasOwnProperty('required');
			this.required =
				this.isRequired && typeof options.required === 'string'
					? options.required
					: this.isTitle
					? this.title + ' is required'
					: 'This field is required';
			return this;
		},
		// -------------------------------------------------------------------------
		//
		// start and end the div
		//
		// -------------------------------------------------------------------------
		open() {
			this.tmpl += '<div ';
			if (!this.options.horizontal) {
				this.tmpl += 'class="form-group "';
			}
			if (this.isRequired) {
				this.tmpl +=
					'show-errors ng-class="{\'has-error\': (parentForm.$submitted && parentForm.' +
					this.name +
					'.$error)}" ';
			}
			this.tmpl += '>';
			return this;
		},
		close() {
			this.tmpl += '</div>';
			return this;
		},
		// -------------------------------------------------------------------------
		//
		// make a label
		//
		// -------------------------------------------------------------------------
		label() {
			if (this.isTitle) {
				const fieldtoggle = 'fieldtoggle' + this.name;
				this.tmpl +=
					'<label class="label-form" for="' +
					this.name +
					'">' +
					this.title +
					'</label>';
				if (this.isRequired) {
					this.tmpl +=
						' <span class="text-muted" title="This field is required">*</span>';
				}
				if (this.help) {
					this.tmpl +=
						' &nbsp; <span class="p-0 m-0" ng-click="$scope.' +
						fieldtoggle +
						' = !$scope.' +
						fieldtoggle +
						'"><i class="fas fa-sm fa-question-circle input-help-source"></i></span>';
					this.tmpl +=
						'<div class="alert alert-info" data-field="' +
						this.name +
						'" ng-show="$scope.' +
						fieldtoggle +
						'">';
					this.tmpl += '<p>' + this.help + '</p>';
					this.tmpl += '</div>';
				}
			}
			if (this.titleTransclude) {
				this.tmpl +=
					'<label class="label-form" for="' +
					this.name +
					'" ng-transclude></label>';
			}
			return this;
		},
		// -------------------------------------------------------------------------
		//
		// this generates the required message
		//
		// -------------------------------------------------------------------------
		error() {
			if (this.isRequired) {
				this.tmpl +=
					'<div ng-messages="parentForm.$submitted && parentForm.' +
					this.name +
					'.$error" role="alert">';
				this.tmpl +=
					'<p class="help-block error-text" ng-message="required">' +
					this.required +
					'</p>';
				this.tmpl += '</div>';
			}
			return this;
		},
		// -------------------------------------------------------------------------
		//
		// make an input box
		//
		// -------------------------------------------------------------------------
		inputControl(attrs) {
			this.tmpl += '<input ';
			// ----------------------------------------------------------------------------------
			if (this.options.hasOwnProperty('type')) {
				this.tmpl += ' type="' + this.options.type + '"';
			} else {
				this.tmpl += ' type="text"';
			}
			// ----------------------------------------------------------------------------------
			this.tmpl +=
				' id="' +
				this.options.id +
				'" name="' +
				this.options.name +
				'" class="form-control ';
			// ----------------------------------------------------------------------------------
			// Format as number
			if (this.options.hasOwnProperty('number')) {
				this.tmpl += ' format-as-number text-right';
			}
			// ----------------------------------------------------------------------------------
			this.tmpl += '" ng-model="ngModel"';
			// ----------------------------------------------------------------------------------
			// Placeholder
			if (this.options.hasOwnProperty('placeholder')) {
				this.tmpl += ' placeholder="' + this.options.placeholder + '"';
			}
			// Validator
			if (attrs.hasOwnProperty('validate')) {
				this.tmpl += ' ng-change="processValidator()"';
			} else if (attrs.hasOwnProperty('validateOf')) {
				this.tmpl +=
					' ng-change="callValidator(\'' + attrs.validateOf + '\')"';
			}
			if (attrs.hasOwnProperty('onchange')) {
				this.tmpl += ' ng-change="' + attrs.onchange + '()"';
			}
			// ----------------------------------------------------------------------------------
			if (this.options.hasOwnProperty('required')) {
				this.tmpl += ' required';
			}
			if (this.options.hasOwnProperty('disabled')) {
				this.tmpl += ' disabled';
			}
			if (this.options.hasOwnProperty('ng-currency')) {
				this.tmpl += ' ng-currency';
			}
			this.tmpl += '/>';
			return this;
		},
		// -------------------------------------------------------------------------
		//
		// make a date control
		//
		// -------------------------------------------------------------------------
		dateControl() {
			const dateformat = this.options.hasOwnProperty('format')
				? this.options.format
				: 'dd-MMMM-yyyy';
			this.tmpl += '<div class="input-group">';
			this.tmpl +=
				'<input uib-datepicker-popup="' +
				dateformat +
				'" type="text" is-open="popupDate.opened" datepicker-options="dateOptions" show-button-bar="false"';
			this.tmpl +=
				' id="' +
				this.options.id +
				'" name="' +
				this.name +
				'" class="form-control " ng-model="ngModel"';
			if (this.options.hasOwnProperty('placeholder')) {
				this.tmpl += ' placeholder="' + this.options.placeholder + '"';
			}
			if (this.isRequired) {
				this.tmpl += ' required';
			}
			this.tmpl += '/>';
			this.tmpl += '<span class="input-group-btn">';
			this.tmpl +=
				'<button type="button" class="btn btn-default" ng-click="openPopupDate()"><i class="fas fa-calendar"></i></button>';
			this.tmpl += '</span>';
			this.tmpl += '</div>';
			return this;
		},
		// -------------------------------------------------------------------------
		//
		// just pass through contents
		//
		// -------------------------------------------------------------------------
		transcludeControl() {
			this.tmpl += '<p class="form-control-static" ng-transclude></p>';
			return this;
		},
		// -------------------------------------------------------------------------
		//
		// just return the template
		//
		// -------------------------------------------------------------------------
		template() {
			return this.tmpl;
		},
		// -------------------------------------------------------------------------
		//
		// methods for actualy doing the different types
		//
		// -------------------------------------------------------------------------
		date(attrs) {
			return this.new(JSON.parse(attrs.options))
				.open()
				.label()
				.dateControl()
				.error()
				.close()
				.template();
		},
		input(attrs) {
			return this.new(JSON.parse(attrs.options))
				.open()
				.label()
				.inputControl(attrs)
				.error()
				.close()
				.template();
		},
		transclude(attrs) {
			return this.new(JSON.parse(attrs.options))
				.open()
				.label()
				.transcludeControl()
				.error()
				.close()
				.template();
		}
	};
	// -------------------------------------------------------------------------
	//
	// for-input makes an input control
	//
	// -------------------------------------------------------------------------
	angular
		.module('core')
		.directive('formInput', () => {
			interface IFormInputScope extends ng.IScope {
				processValidator?: () => void;
				validate?: any;
				parentForm?: any;
				callValidator?: (name: string) => void;
			}

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
				template(elem, attrs) {
					if (attrs.hasOwnProperty('draw') && !attrs.draw) {
						return '';
					}
					return templateClass.input(attrs);
				},
				restrict: 'E',
				link($scope: IFormInputScope, elem, attrs, modelCtrl) {
					// ----------------------------------------------------------------------------------
					const options = JSON.parse(attrs.options);
					// ----------------------------------------------------------------------------------
					if (attrs.hasOwnProperty('disabled')) {
						$scope.$watch('disabled', newValue => {
							if (newValue) {
								angular
									.element(elem)
									.find('input')
									.attr('disabled', 'disabled');
							} else {
								angular
									.element(elem)
									.find('input')
									.removeAttr('disabled');
							}
						});
					}
					// ----------------------------------------------------------------------------------
					// if validation is set, run the validation to set validity of parent form
					$scope.processValidator = () => {
						$scope
							.validate(
								$scope.parentForm[options.name].$viewValue
							)
							.then(resp => {
								$scope.parentForm[options.name].$setValidity(
									options.name,
									resp
								);
								$scope.$apply();
							});
					};
					// change event handler to trigger another element's validator
					$scope.callValidator = name => {
						$scope.$parent.$broadcast(
							'rpc.input.validator.' + name
						);
					};
					// ----------------------------------------------------------------------------------
					// event handler for other elements who wants trigger this element's validator
					if (attrs.hasOwnProperty('validateOf')) {
						$scope.$on(
							'rpc.input.validator.' + options.name,
							() => {
								$scope.processValidator();
							}
						);
					}
				}
			};
		})
		// -------------------------------------------------------------------------
		//
		// form-date-input makes a date control (uib-date)
		//
		// -------------------------------------------------------------------------
		.directive('formDateInput', () => {

			interface IPreCompileScope extends ng.IScope {
				dateOptions?: any;
			}

			interface IPostCompileScope extends ng.IScope {
				popupDate?: any;
				openPopupDate?: any;
			}

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
				template(elem, attrs) {
					if (attrs.hasOwnProperty('draw') && !attrs.draw) {
						return '';
					}
					return templateClass.date(attrs);
				},
				restrict: 'E',
				compile() {
					return {
						pre($scope: IPreCompileScope, elem, attrs) {
							$scope.dateOptions = {};
							$scope.dateOptions.showWeeks = false;
						},
						post($scope: IPostCompileScope, elem, attrs) {
							// ----------------------------------------------------------------------------------
							if (attrs.hasOwnProperty('disabled')) {
								$scope.$watch('disabled', newValue => {
									if (newValue) {
										angular
											.element(elem)
											.find('input')
											.attr('disabled', 'disabled');
									} else {
										angular
											.element(elem)
											.find('input')
											.removeAttr('disabled');
									}
								});
							}
							// ----------------------------------------------------------------------------------
							$scope.popupDate = {
								opened: false
							};
							// ----------------------------------------------------------------------------------
							$scope.openPopupDate = () => {
								$scope.popupDate.opened = true;
							};
						}
					};
				}
			};
		})
		// -------------------------------------------------------------------------
		//
		// form-display wraps whatever control you put here with label and required
		//
		// -------------------------------------------------------------------------
		.directive('formDisplay', () => {
			return {
				require: 'ngModel',
				replace: true,
				transclude: true,
				scope: {
					options: '='
				},
				template(elem, attrs) {
					return templateClass.transclude(attrs);
				},
				restrict: 'E'
			};
		})
		.directive('warnOnExit', () => {

			interface ILinkScope extends ng.IScope {
				parentForm?: any;
			}

			return {
				restrict: 'A',
				scope: {
					parentForm: '=name'
				},
				link($scope: ILinkScope, elem, attrs) {
					window.onbeforeunload = () => {
						if ($scope.parentForm.$dirty) {
							return 'You are about to leave the page with unsaved data. Click Cancel to remain here.';
						}
					};
					const $stateChangeStartUnbind = $scope.$on(
						'$stateChangeStart',
						(event, next, current) => {
							if ($scope.parentForm.$dirty) {
								if (
									!confirm(
										'You are about to leave the page with unsaved data. Click Cancel to remain here.'
									)
								) {
									// Stay on current route if user cancels.
									event.preventDefault();
								}
							}
						}
					);
					$scope.$on('destroy', () => {
						window.onbeforeunload = null;
						$stateChangeStartUnbind();
					});
				}
			};
		})
		.directive('formSaveRevert', () => {

			interface ILinkScope extends ng.IScope {
				revert?: () => void;
				override?: boolean;
				form?: any;
				revertAction?: () => void;
				revertCallback?: () => void;
				$parent: ILinkScope;
				allowCancel?: boolean;
			}

			return {
				replace: true,
				restrict: 'E',
				scope: {
					form: '=',
					revertCallback: '=',
					override: '=',
					stayPage: '='
				},
				templateUrl:
					'/modules/core/client/views/form-save-revert.client.view.html',
				link(scope: ILinkScope, elem, attrs) {
					scope.$parent.allowCancel = false;
					// ----------------------------------------------------------------------------------
					// Revert
					// If the project has not been created, abandon and reroute to project list.
					// If the projec thas already been saved, restore the previous save.
					//
					scope.revert = () => {
						if (scope.$parent.allowCancel || scope.override) {
							scope.form.$setPristine();
						}
						scope.revertAction();
					};
					scope.revertAction = () => {
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
		.directive('myEnter', () => {
			return (scope, element, attrs) => {
				element.bind('keydown keypress', event => {
					if (event.which === 13) {
						scope.$apply(() => {
							scope.$eval(attrs.myEnter);
						});
						event.preventDefault();
					}
				});
			};
		});
})();
