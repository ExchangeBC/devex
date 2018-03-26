'use strict';
/*

Notes about capabilities


*/

/**
 * Module dependencies.
 */
var path          = require ('path'),
	mongoose      = require ('mongoose'),
	Capability    = mongoose.model ('Capability'),
	CapabilitySkill    = mongoose.model ('CapabilitySkill'),
	errorHandler  = require (path.resolve ('./modules/core/server/controllers/errors.server.controller')),
	helpers       = require (path.resolve ('./modules/core/server/controllers/core.server.helpers')),
	_             = require ('lodash'),
	Notifications = require (path.resolve ('./modules/notifications/server/controllers/notifications.server.controller'))
	;

// -------------------------------------------------------------------------
//
// create a new capability.
//
// -------------------------------------------------------------------------
exports.create = function (req, res) {
	var capability = new Capability (req.body);
	//
	// set the code, this is used for setting roles and other stuff
	//
	Capability.findUniqueCode (capability.name, null, function (newcode) {
		capability.code = newcode;
		//
		// save and return
		//
		capability.save (function (err) {
			if (err) {
				return res.status (422).send ({
					message: errorHandler.getErrorMessage (err)
				});
			} else {
				res.json (capability);
			}
		});
	});

};
// -------------------------------------------------------------------------
//
// create a new capability skill.
//
// -------------------------------------------------------------------------
exports.skillCreate = function (req, res) {
	var capabilitySkill = new CapabilitySkill (req.body);
	//
	// set the code, this is used for setting roles and other stuff
	//
	CapabilitySkill.findUniqueCode (capabilitySkill.name, null, function (newcode) {
		capabilitySkill.code = newcode;
		//
		// save and return
		//
		capabilitySkill.save (function (err) {
			if (err) {
				return res.status (422).send ({
					message: errorHandler.getErrorMessage (err)
				});
			} else {
				res.json (capabilitySkill);
			}
		});
	});
};

// -------------------------------------------------------------------------
//
// this just takes the already queried object and pass it back
//
// -------------------------------------------------------------------------
exports.read = function (req, res) {
	res.json (req.capability);
};

// -------------------------------------------------------------------------
//
// update the document
//
// -------------------------------------------------------------------------
exports.update = function (req, res) {
	//
	// copy over everything passed in. This will overwrite the
	// audit fields, but they get updated in the following step
	//
	var capability = _.assign (req.capability, req.body);
	capability.markModified ('skills');
	//
	// save
	//
	capability.save (function (err) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (capability);
		}
	});
};
// -------------------------------------------------------------------------
//
// update the document
//
// -------------------------------------------------------------------------
exports.skillUpdate = function (req, res) {
	//
	// copy over everything passed in. This will overwrite the
	// audit fields, but they get updated in the following step
	//
	var capabilitySkill = _.assign (req.capabilitySkill, req.body);
	//
	// save
	//
	capabilitySkill.save (function (err) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (capabilitySkill);
		}
	});
};

// -------------------------------------------------------------------------
//
// delete the capability
//
// -------------------------------------------------------------------------
exports.delete = function (req, res) {
	var capability = req.capability;
	capability.remove (function (err) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (capability);
		}
	});
};
// -------------------------------------------------------------------------
//
// delete the capability skill
//
// -------------------------------------------------------------------------
exports.skillDelete = function (req, res) {
	var capabilitySkill = req.capabilitySkill;
	capabilitySkill.remove (function (err) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (capabilitySkill);
		}
	});
};

// -------------------------------------------------------------------------
//
// return a list of all capabilities
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
	Capability.find ({}).populate ('skills')
	.exec (function (err, capabilities) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (capabilities);
		}
	});
};

// -------------------------------------------------------------------------
//
// magic that populates the capability on the request
//
// -------------------------------------------------------------------------
exports.capabilityByID = function (req, res, next, id) {
	var callback = function (err, capability) {
		if (err) {
			return next (err);
		}
		else if (!capability) {
			return res.status (404).send ({
				message: 'No capability with that identifier has been found'
			});
		}
		else {
			req.capability = capability;
			return next ();
		}
	};
	if (mongoose.Types.ObjectId.isValid (id)) {
		Capability.findById (id).populate ('skills').exec (callback);
	}
	else {
		Capability.findOne ({code:id}).populate ('skills').exec (callback);
	}
};
// -------------------------------------------------------------------------
//
// magic that populates the capability skill on the request
//
// -------------------------------------------------------------------------
exports.capabilitySkillByID = function (req, res, next, id) {
	var callback = function (err, capabilitySkill) {
		if (err) {
			return next (err);
		}
		else if (!capabilitySkill) {
			return res.status (404).send ({
				message: 'No capabilitySkill with that identifier has been found'
			});
		}
		else {
			req.capabilitySkill = capabilitySkill;
			return next ();
		}
	};
	if (mongoose.Types.ObjectId.isValid (id)) {
		CapabilitySkill.findById (id).exec (callback);
	}
	else {
		CapabilitySkill.findOne ({code:id}).exec (callback);
	}
};
