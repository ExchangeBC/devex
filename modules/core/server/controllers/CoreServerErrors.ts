'use strict';

import config from '../../../../config/ApplicationConfig';

class CoreServerErrors {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: CoreServerErrors;

	private constructor() {}

	// Get the error message from error object
	public getErrorMessage = err => {
		let message = '';

		if (err.code) {
			switch (err.code) {
				case 11000:
				case 11001:
					message = this.getUniqueErrorMessage(err);
					break;
				case 'LIMIT_FILE_SIZE':
					message = 'Image too big. Please maximum ' + (config.uploads.profileUpload.limits.fileSize / (1024 * 1024)).toFixed(2) + ' Mb files.';
					break;
				case 'LIMIT_UNEXPECTED_FILE':
					message = 'Missing `newProfilePicture` field';
					break;
				default:
					message = 'Something went wrong';
			}
		} else if (err.message && !err.errors) {
			message = err.message;
		} else {
			for (const errName in err.errors) {
				if (err.errors[errName].message) {
					message = err.errors[errName].message;
				}
			}
		}

		return message;
	};

	// Get unique error field name
	private getUniqueErrorMessage = err => {
		let output;

		try {
			let begin;
			if (err.errmsg.lastIndexOf('.$') !== -1) {
				begin = err.errmsg.lastIndexOf('.$') + 2;
			} else {
				begin = err.errmsg.lastIndexOf('index: ') + 7;
			}
			const fieldName = err.errmsg.substring(begin, err.errmsg.lastIndexOf('_1'));
			output = fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' already exists';
		} catch (ex) {
			output = 'Unique field already exists';
		}

		return output;
	};
}

export default CoreServerErrors.getInstance();
