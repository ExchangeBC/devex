'use strict';

import { IAttributes } from 'angular';

export default class FormTemplate {
	// methods for actualy doing the different types
	public static date(attrs: IAttributes): string {
		return new FormTemplate(JSON.parse(attrs.options))
			.open()
			.label()
			.dateControl()
			.error()
			.close()
			.template();
	}

	public static input(attrs: IAttributes): string {
		return new FormTemplate(JSON.parse(attrs.options))
			.open()
			.label()
			.inputControl(attrs)
			.error()
			.close()
			.template();
	}

	public static transclude(attrs: IAttributes): string {
		return new FormTemplate(JSON.parse(attrs.options))
			.open()
			.label()
			.transcludeControl()
			.error()
			.close()
			.template();
	}

	private options: any;
	private tmpl: string;
	private required: boolean;
	private isRequired: boolean;
	private name: string;
	private title: string;
	private isTitle: string;
	private help: string;
	private titleTransclude: boolean;

	private constructor(options: any) {
		this.options = options;
		this.help = options.hasOwnProperty('help') ? options.help : null;
		this.tmpl = options.hasOwnProperty('tmpl') ? options.tmpl : '';
		this.isTitle = options.hasOwnProperty('title');
		this.title = this.isTitle ? options.title : '';
		this.name = options.name;
		this.titleTransclude = options.hasOwnProperty('titleTransclude') && options.titleTransclude;
		this.isRequired = options.hasOwnProperty('required');
		this.required = this.isRequired && typeof options.required === 'string' ? options.required : this.isTitle ? this.title + ' is required' : 'This field is required';
		return this;
	}

	// start and end the div
	private open(): FormTemplate {
		this.tmpl += '<div ';
		if (!this.options.horizontal) {
			this.tmpl += 'class="form-group "';
		}
		if (this.isRequired) {
			this.tmpl += "show-errors ng-class=\"{'has-error': (parentForm.$submitted && parentForm." + this.name + '.$error)}" ';
		}
		this.tmpl += '>';
		return this;
	}

	private close() {
		this.tmpl += '</div>';
		return this;
	}

	// make a label
	private label(): FormTemplate {
		if (this.isTitle) {
			const fieldtoggle = 'fieldtoggle' + this.name;
			this.tmpl += '<label class="label-form" for="' + this.name + '">' + this.title + '</label>';
			if (this.isRequired) {
				this.tmpl += ' <span class="text-muted" title="This field is required">*</span>';
			}
			if (this.help) {
				this.tmpl += ' &nbsp; <span class="p-0 m-0" ng-click="$scope.' + fieldtoggle + ' = !$scope.' + fieldtoggle + '"><i class="fas fa-sm fa-question-circle input-help-source"></i></span>';
				this.tmpl += '<div class="alert alert-info" data-field="' + this.name + '" ng-show="$scope.' + fieldtoggle + '">';
				this.tmpl += '<p>' + this.help + '</p>';
				this.tmpl += '</div>';
			}
		}
		if (this.titleTransclude) {
			this.tmpl += '<label class="label-form" for="' + this.name + '" ng-transclude></label>';
		}
		return this;
	}

	// this generates the required message
	private error(): FormTemplate {
		if (this.isRequired) {
			this.tmpl += '<div ng-messages="parentForm.$submitted && parentForm.' + this.name + '.$error" role="alert">';
			this.tmpl += '<p class="help-block error-text" ng-message="required">' + this.required + '</p>';
			this.tmpl += '</div>';
		}
		return this;
	}

	// make an input box
	private inputControl(attrs: IAttributes): FormTemplate {
		this.tmpl += '<input ';
		if (this.options.hasOwnProperty('type')) {
			this.tmpl += ' type="' + this.options.type + '"';
		} else {
			this.tmpl += ' type="text"';
		}

		this.tmpl += ' id="' + this.options.id + '" name="' + this.options.name + '" class="form-control ';

		// Format as number
		if (this.options.hasOwnProperty('number')) {
			this.tmpl += ' format-as-number text-right';
		}

		this.tmpl += '" ng-model="ngModel"';

		// Placeholder
		if (this.options.hasOwnProperty('placeholder')) {
			this.tmpl += ' placeholder="' + this.options.placeholder + '"';
		}

		// Validator
		if (attrs.hasOwnProperty('validate')) {
			this.tmpl += ' ng-change="processValidator()"';
		} else if (attrs.hasOwnProperty('validateOf')) {
			this.tmpl += ' ng-change="callValidator(\'' + attrs.validateOf + '\')"';
		}

		if (attrs.hasOwnProperty('onchange')) {
			this.tmpl += ' ng-change="' + attrs.onchange + '()"';
		}

		if (this.options.hasOwnProperty('required')) {
			this.tmpl += ' required';
		}

		if (this.options.hasOwnProperty('disabled')) {
			this.tmpl += ' disabled';
		}

		if (this.options.hasOwnProperty('ng-currency')) {
			this.tmpl += ' ng-currency';
		}

		if (this.options.hasOwnProperty('select-on-click')) {
			this.tmpl += ' onclick="this.select()"';
		}

		if (this.options.hasOwnProperty('select-on-focus')) {
			this.tmpl += ' onfocus="this.select()"';
		}
		this.tmpl += '/>';
		return this;
	}

	// make a date control
	private dateControl(): FormTemplate {
		const dateformat = this.options.hasOwnProperty('format') ? this.options.format : 'dd-MMMM-yyyy';
		this.tmpl += '<div class="input-group">';
		this.tmpl += '<input uib-datepicker-popup="' + dateformat + '" type="text" is-open="popupDate.opened" datepicker-options="dateOptions" show-button-bar="false"';
		this.tmpl += ' id="' + this.options.id + '" name="' + this.name + '" class="form-control " ng-model="ngModel"';
		if (this.options.hasOwnProperty('placeholder')) {
			this.tmpl += ' placeholder="' + this.options.placeholder + '"';
		}
		if (this.isRequired) {
			this.tmpl += ' required';
		}
		this.tmpl += '/>';
		this.tmpl += '<span class="input-group-btn">';
		this.tmpl += '<button type="button" class="btn btn-default" ng-click="openPopupDate()"><i class="fas fa-calendar"></i></button>';
		this.tmpl += '</span>';
		this.tmpl += '</div>';
		return this;
	}

	// just pass through contents
	private transcludeControl(): FormTemplate {
		this.tmpl += '<p class="form-control-static" ng-transclude></p>';
		return this;
	}

	// just return the template
	private template(): string {
		return this.tmpl;
	}
}
