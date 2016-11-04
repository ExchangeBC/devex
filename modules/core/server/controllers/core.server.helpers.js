'use strict';

exports.generateCode = function (s) {
	return s.toLowerCase().replace(/\W/g,'-').replace(/-+/,'-');
};

exports.applyAudit = function (model, user) {
	model.updated   = Date.now ();
	model.updatedBy = (user) ? user : null;
	if (!model.created) {
		model.created   = model.updated;
		model.createdBy = model.updatedBy;
	}
};

