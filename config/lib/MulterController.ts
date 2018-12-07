'use strict';

class MulterController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: MulterController;

	private images = {
		'image/jpg': true,
		'image/jpeg': true,
		'image/gif': true
	};

	private documents = {
		'application/pdf': true,
		'application/x-pdf': true,
		'application/msword': true,
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
		'application/vnd.openxmlformats-officedocument.wordprocessingml.template': true,
		'application/vnd.ms-word.document.macroEnabled.12': true,
		'application/vnd.ms-word.template.macroEnabled.12': true,
		'application/vnd.ms-excel': true,
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
		'application/vnd.openxmlformats-officedocument.spreadsheetml.template': true,
		'application/vnd.ms-excel.sheet.macroEnabled.12': true,
		'application/vnd.ms-excel.template.macroEnabled.12': true,
		'application/vnd.ms-excel.addin.macroEnabled.12': true,
		'application/vnd.ms-excel.sheet.binary.macroEnabled.12': true,
		'application/vnd.ms-powerpoint': true,
		'application/vnd.openxmlformats-officedocument.presentationml.presentation': true,
		'application/vnd.openxmlformats-officedocument.presentationml.template': true,
		'application/vnd.openxmlformats-officedocument.presentationml.slideshow': true,
		'application/vnd.ms-powerpoint.addin.macroEnabled.12': true,
		'application/vnd.ms-powerpoint.presentation.macroEnabled.12': true,
		'application/vnd.ms-powerpoint.template.macroEnabled.12': true,
		'application/vnd.ms-powerpoint.slideshow.macroEnabled.12': true
	};

	private constructor() {}

	public profileUploadFileFilter = (req, file, cb) => {
		if (!this.images[file.mimetype]) {
			return cb(new Error('Only image files are allowed!'), false);
		}
		cb(null, true);
	};

	public fileUploadFileFilter = (req, file, cb) => {
		if (!this.images[file.mimetype] && !this.documents[file.mimetype]) {
			return cb(new Error('Only image files are allowed!'), false);
		}
		cb(null, true);
	};
}

export default MulterController.getInstance();
