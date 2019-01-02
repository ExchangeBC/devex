'use strict';

import angular, { IController } from 'angular';
import { ICapabilityResource } from '../../../capabilities/client/services/CapabilitiesService';
import { IOrgResource } from '../services/OrgService';

export class OrgProfileController implements IController {
	public static $inject = ['capabilities', 'org', 'dataService', 'TINYMCE_OPTIONS'];

	public cities: string[];

	constructor(public capabilities: ICapabilityResource[], public org: IOrgResource, private dataService: any, public TINYMCE_OPTIONS) {
		this.cities = this.dataService.cities;
	}
}

angular.module('orgs').controller('OrgProfileController', OrgProfileController);
