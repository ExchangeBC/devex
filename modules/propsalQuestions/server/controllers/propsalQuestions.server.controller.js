'use strict';
/*

Notes about propsalQuestions


*/

/**
 * Module dependencies.
 */
var path          = require ('path'),
	mongoose      = require ('mongoose'),
	PropsalQuestion    = mongoose.model ('PropsalQuestion'),
	errorHandler  = require (path.resolve ('./modules/core/server/controllers/errors.server.controller')),
	helpers       = require (path.resolve ('./modules/core/server/controllers/core.server.helpers')),
	_             = require ('lodash'),
	Notifications = require (path.resolve ('./modules/notifications/server/controllers/notifications.server.controller'))
	;

// -------------------------------------------------------------------------
//
// create a new propsalQuestion. the user doing the creation will be set as the
// administrator
//
// -------------------------------------------------------------------------
exports.create = function (req, res) {
	var propsalQuestion = new PropsalQuestion (req.body);
	//
	// set the code, this is used for setting roles and other stuff
	//
	PropsalQuestion.findUniqueCode (propsalQuestion.name, null, function (newcode) {
		propsalQuestion.code = newcode;
		//
		// save and return
		//
		propsalQuestion.save (function (err) {
			if (err) {
				return res.status (422).send ({
					message: errorHandler.getErrorMessage (err)
				});
			} else {
				res.json (propsalQuestion);
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
	res.json (req.propsalQuestion);
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
	var propsalQuestion = _.assign (req.propsalQuestion, req.body);
	//
	// save
	//
	propsalQuestion.save (function (err) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (propsalQuestion);
		}
	});
};

// -------------------------------------------------------------------------
//
// delete the propsalQuestion
//
// -------------------------------------------------------------------------
exports.delete = function (req, res) {
	var propsalQuestion = req.propsalQuestion;
	propsalQuestion.remove (function (err) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (propsalQuestion);
		}
	});
};

// -------------------------------------------------------------------------
//
// return a list of all propsalQuestions
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
	PropsalQuestion.find ({})
	.exec (function (err, propsalQuestions) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (propsalQuestions);
		}
	});
};

// -------------------------------------------------------------------------
//
// magic that populates the propsalQuestion on the request
//
// -------------------------------------------------------------------------
exports.propsalQuestionByID = function (req, res, next, id) {
	var callback = function (err, propsalQuestion) {
		if (err) {
			return next (err);
		}
		else if (!propsalQuestion) {
			return res.status (404).send ({
				message: 'No propsalQuestion with that identifier has been found'
			});
		}
		else {
			req.propsalQuestion = propsalQuestion;
			return next ();
		}
	};
	if (mongoose.Types.ObjectId.isValid (id)) {
		PropsalQuestion.findById (id).exec (callback);
	}
	else {
		PropsalQuestion.findOne ({code:id}).exec (callback);
	}
};
