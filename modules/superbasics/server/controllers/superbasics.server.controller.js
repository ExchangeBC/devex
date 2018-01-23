'use strict';
/*

Notes about superbasics


*/

/**
 * Module dependencies.
 */
var path          = require ('path'),
	mongoose      = require ('mongoose'),
	Superbasic    = mongoose.model ('Superbasic'),
	errorHandler  = require (path.resolve ('./modules/core/server/controllers/errors.server.controller')),
	helpers       = require (path.resolve ('./modules/core/server/controllers/core.server.helpers')),
	_             = require ('lodash'),
	Notifications = require (path.resolve ('./modules/notifications/server/controllers/notifications.server.controller'))
	;

// -------------------------------------------------------------------------
//
// create a new superbasic. the user doing the creation will be set as the
// administrator
//
// -------------------------------------------------------------------------
exports.create = function (req, res) {
	var superbasic = new Superbasic (req.body);
	//
	// set the code, this is used for setting roles and other stuff
	//
	Superbasic.findUniqueCode (superbasic.name, null, function (newcode) {
		superbasic.code = newcode;
		//
		// save and return
		//
		superbasic.save (function (err) {
			if (err) {
				return res.status (422).send ({
					message: errorHandler.getErrorMessage (err)
				});
			} else {
				res.json (superbasic);
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
	res.json (req.superbasic);
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
	var superbasic = _.assign (req.superbasic, req.body);
	//
	// save
	//
	superbasic.save (function (err) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (superbasic);
		}
	});
};

// -------------------------------------------------------------------------
//
// delete the superbasic
//
// -------------------------------------------------------------------------
exports.delete = function (req, res) {
	var superbasic = req.superbasic;
	superbasic.remove (function (err) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (superbasic);
		}
	});
};

// -------------------------------------------------------------------------
//
// return a list of all superbasics
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
	Superbasic.find ({})
	.exec (function (err, superbasics) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (superbasics);
		}
	});
};

// -------------------------------------------------------------------------
//
// magic that populates the superbasic on the request
//
// -------------------------------------------------------------------------
exports.superbasicByID = function (req, res, next, id) {
	var callback = function (err, superbasic) {
		if (err) {
			return next (err);
		}
		else if (!superbasic) {
			return res.status (404).send ({
				message: 'No superbasic with that identifier has been found'
			});
		}
		else {
			req.superbasic = superbasic;
			return next ();
		}
	};
	if (mongoose.Types.ObjectId.isValid (id)) {
		Superbasic.findById (id).exec (callback);
	}
	else {
		Superbasic.findOne ({code:id}).exec (callback);
	}
};
