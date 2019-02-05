'use strict';

import angular, { IRootScopeService } from 'angular';
import _ from 'lodash';
import { ICapabilitiesService } from '../../../capabilities/client/services/CapabilitiesService';
import { ICapability } from '../../../capabilities/shared/ICapabilityDTO';
import { IOrg } from '../../shared/IOrgDTO';

export interface IOrgCommonService {
	hasOrgMetRFQ(org: IOrg): boolean;
	isOrgCapable(org: IOrg): boolean;
}

class OrgCommonService implements IOrgCommonService {
	private allCapabilities: ICapability[];

	constructor(private $rootScope: IRootScopeService, private CapabilitiesService: ICapabilitiesService) {
		this.allCapabilities = this.CapabilitiesService.list();
		this.$rootScope.$on('capabilitiesChanged', () => {
			this.allCapabilities = this.CapabilitiesService.list();
		});
	}

	// Checks that the given org has met the RFQ by checking:
	// - that the org has at least 2 team members
	// - that the org team members collectively cover all capabilities
	// - that the org has accepted the terms of the RFQ
	public hasOrgMetRFQ(org: IOrg): boolean {
		return org.members.length >= 2 && org.isAcceptedTerms && this.isOrgCapable(org);
	}

	public isOrgCapable(org: IOrg): boolean {
		const orgCapabilities = this.getOrgCapabilities(org);
		const overlap = _.intersectionWith(this.allCapabilities, orgCapabilities, (cap1, cap2) => cap1.code === cap2.code);
		return overlap.length === this.allCapabilities.length;
	}

	private getOrgCapabilities(org: IOrg): ICapability[] {
		const memberCaps = org.members ? _.flatten(org.members.map(member => member.capabilities)) : [];
		return _.uniqWith(memberCaps, (cap1, cap2) => cap1.code === cap2.code);
	}
}

angular
	.module('orgs.services')
	.factory('OrgCommonService', [
		'$rootScope',
		'CapabilitiesService',
		($rootScope: IRootScopeService, CapabilitiesService: ICapabilitiesService) => new OrgCommonService($rootScope, CapabilitiesService)
	]);
