'use strict';

import { angularFileUpload, IController, IRootScopeService, IScope, ITimeoutService, ui, uiNotification } from 'angular';
import { IOrg } from '../../../orgs/shared/IOrgDTO';
import { IUser } from '../../../users/shared/IUserDTO';

export class EditAvatarDialogController implements IController {
	public static $inject = ['$rootScope', '$timeout', 'org', 'user', '$uibModalInstance', 'Upload', 'Notification'];
	public fileSelected: boolean;
	public uploadUrl: string;
	public picFile: any;

	constructor(
		private $rootScope: IRootScopeService,
		private $timeout: ITimeoutService,
		public org: IOrg,
		public user: IUser,
		private $uibModalInstance: ui.bootstrap.IModalInstanceService,
		private Upload: angularFileUpload.IUploadService,
		private Notification: uiNotification.INotificationService
	) {
		this.uploadUrl = this.org ? `/api/org/${this.org._id}/upload/logo` : '/api/users/picture';
	}

	public getCurrentImageUrl(): string {
		return this.org ? this.org.orgImageURL : this.user.profileImageURL;
	}

	public getSourceName(): string {
		return this.org ? this.org.name : this.user.displayName;
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
			let data: any;
			data = this.org ? { orgImageURL: this.Upload.rename(croppedFile, 'pic') } : { newProfilePicture: this.Upload.rename(croppedFile, 'pic') };

			const uploadResponse = (await this.Upload.upload({
				url: this.uploadUrl,
				data,
				method: 'POST'
			})) as any;

			if (this.org) {
				this.org.orgImageURL = uploadResponse.data.orgImageURL;
			} else {
				this.user.profileImageURL = uploadResponse.data.profileImageURL;
				this.$rootScope.$broadcast('userImageUpdated');
			}

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
