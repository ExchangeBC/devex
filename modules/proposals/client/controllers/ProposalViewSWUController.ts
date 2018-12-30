'use strict';

import angular from 'angular';
import { IProposalResource } from '../services/ProposalService';

export default class ProposalViewSWUController {
	public static $inject = ['proposal', '$uibModalInstance'];

	constructor(public proposal: IProposalResource, private $uibModalInstance: ng.ui.bootstrap.IModalInstanceService) {}

	public close(): void {
		this.$uibModalInstance.close();
	}

	public getIconName(type: string): string {
		if (type.indexOf('pdf') > -1) {
			return 'fa-file-pdf';
		} else if (type.indexOf('image') > -1) {
			return 'fa-file-image';
		} else if (type.indexOf('word') > -1) {
			return 'fa-file-word';
		} else if (type.indexOf('excel') > -1 || type.indexOf('sheet') > -1) {
			return 'fa-file-excel';
		} else if (type.indexOf('powerpoint') > -1) {
			return 'fa-file-powerpoint';
		} else {
			return 'fa-file';
		}
	}
}

angular.module('proposals').controller('ProposalViewSWUController', ProposalViewSWUController);
