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
	errorHandler  = require (path.resolve ('./modules/core/server/controllers/errors.server.controller')),
	helpers       = require (path.resolve ('./modules/core/server/controllers/core.server.helpers')),
	_             = require ('lodash'),
	Notifications = require (path.resolve ('./modules/notifications/server/controllers/notifications.server.controller'))
	;

// -------------------------------------------------------------------------
//
// create a new capability. the user doing the creation will be set as the
// administrator
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
// this just takes the already queried object and pass it back
//
// -------------------------------------------------------------------------
exports.read = function (req, res) {
	res.json (req.capability);
};

// -------------------------------------------------------------------------
//
// update the document, make sure to apply audit. We don't mess with the
// code if they change the name as that would mean reworking all the roles
//
// -------------------------------------------------------------------------
exports.update = function (req, res) {
	//
	// copy over everything passed in. This will overwrite the
	// audit fields, but they get updated in the following step
	//
	var capability = _.assign (req.capability, req.body);
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
// return a list of all capabilities
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
	Capability.find ({})
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
		Capability.findById (id).exec (callback);
	}
	else {
		Capability.findOne ({code:id}).exec (callback);
	}
};
