'use strict';

import { angularFileUpload, IController, IRootScopeService, IScope, ITimeoutService, ui, uiNotification } from 'angular';
import { IOrg } from '../../shared/IOrgDTO';

interface EditLogoDialogScope extends IScope {
	myPic?: any;
}

export class EditOrgImageDialogController implements IController {
	public static $inject = ['$scope', '$rootScope', '$timeout', 'org', '$uibModalInstance', 'Upload', 'Notification'];
	public fileSelected: boolean;
	public uploadUrl: string;
	public picFile: any;

	constructor(
		private $scope: EditLogoDialogScope,
		private $rootScope: IRootScopeService,
		private $timeout: ITimeoutService,
		public org: IOrg,
		private $uibModalInstance: ui.bootstrap.IModalInstanceService,
		private Upload: angularFileUpload.IUploadService,
		private Notification: uiNotification.INotificationService
	) {
		this.uploadUrl = `/api/org/${this.org._id}/upload/logo`;
	}

	public onSelectPicture(file: File): void {
		if (!file) {
			return;
		}

		if (file.size > 1 * 1024 * 1024) {
			this.Notification.error({
				delay: 6000,
				message: 'This file exceeds the max allowed size of 1M. Please select another image, or reduce the size or density of this image.'
			});
		} else {
			this.fileSelected = true;
		}
	}

	public async upload(base64File: string): Promise<void> {
		try {
			const croppedFile = this.dataUrlToFile(base64File, this.picFile.name);
			const uploadResponse = (await this.Upload.upload({
				url: this.uploadUrl,
				data: {
					orgImageURL: this.Upload.rename(croppedFile, `${this.org.name}-pic`)
				},
				method: 'POST'
			})) as any;

			this.org.orgImageURL = uploadResponse.data.orgImageURL;
			this.$rootScope.$broadcast('orgImageUpdated', uploadResponse.data.orgImageURL);
			this.$uibModalInstance.dismiss('cancel');
			this.$timeout(() => {
				this.onSuccessItem(uploadResponse.data);
			});
		} catch (error) {
			this.onErrorItem(error);
		}
	}

	public quitnow(): void {
		this.$uibModalInstance.dismiss('cancel');
	}

	private onSuccessItem(response: any) {
		this.Notification.success({
			message: '<i class="fas fa-check-circle"></i> Company logo updated'
		});

		this.fileSelected = false;
	}

	private onErrorItem(response: any) {
		this.Notification.error({
			message: '<i class="fas fa-exclamation-triangle"></i> Error occured updating company logo'
		});

		this.fileSelected = false;
	}

	private dataUrlToFile(dataUrl: string, fileName: string): File {
		const arr = dataUrl.split(',');
		const mime = arr[0].match(/:(.*?);/)[1];
		const bstr = atob(arr[1]);
		let n = bstr.length;
		const u8arr = new Uint8Array(n);
		while (n--) {
			u8arr[n] = bstr.charCodeAt(n);
		}
		return new File([u8arr], fileName, { type: mime });
	}
}
