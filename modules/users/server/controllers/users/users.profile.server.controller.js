'use strict';

/**
 * Module dependencies
 */
var _ = require('lodash'),
	fs = require('fs'),
	path = require('path'),
	errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
	mongoose = require('mongoose'),
	multer = require('multer'),
	config = require(path.resolve('./config/config')),
	User = mongoose.model('User'),
	validator = require('validator'),
	notifier = require(path.resolve('./modules/core/server/controllers/core.server.notifier.js')).notifier;

 // CC:  USERFIELDS
var whitelistedFields = ['firstName', 'lastName', 'email', 'username', 'government', 'notifyOpportunities', 'subscribeOpportunitiesId', 'notifyEvents', 'notifyBlogs', 'userTitle'];
var oppEmailNotifier = notifier(process.env.NOTIFY_BC_HOST, process.env.NOTIFY_BC_PORT, 'opportunities', 'email');
/**
 * Update user details
 */
exports.update = function (req, res) {
	// Init Variables
	var user = req.user;

	if (user) {
		// Update whitelisted fields only
		user = _.extend(user, _.pick(req.body, whitelistedFields));

		// Previous state of user
		var oldUser = User.find({_id: user._id});
		//
		// this deals with marking the user as government or not
		//
		if (req.body.addRequest) {
			user.addRoles (['gov-request']);
		}
		if (req.body.removeRequest) {
			user.removeRoles (['gov-request']);
		}

		user.updated = Date.now();
		user.displayName = user.firstName + ' ' + user.lastName;
		var saveCallback = function (err) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				req.login(user, function (err) {
					if (err) {
						res.status(400).send(err);
					} else {
						res.json(user);
					}
				});
			}
		}
		var notifyOppChanged = user.notifyOpportunities !== oldUser.notifyOpportunities;
		var emailChanged = user.email !== oldUser.email;
		// user is subscribed before record save so that we can save the subscription
		// id to use when unsubscribing.
		if (notifyOppChanged && user.notifyOpportunities && user.subscribeOpportunitiesId === null) {
			oppEmailNotifier.subscribe(user.email)
				.then(function(json) {
					// we save the id for the subscription so that was can unsubscribe at
					// a later point.
					user.subscribeOpportunitiesId = json.id;
				})
				.catch(function(err) {
					// if there was an error, reset the notifyOpportunites flag
					console.error('Could not subscribe user due to error from notification ' +
						'service:' + err);
					user.notifyOpportunites = false;
				})
				.then(function() {
					// this will always get executed, even if a catch is raised
					user.save(saveCallback);
				});
		}
		else if (emailChanged && user.notifyOpportunities && user.subscribeOpportunitiesId !== null ) {
			// we need to update the subscription
			oppEmailNotifier.subscribeUpdate(user.subscribeOpportunitiesId, user.email)
				.catch(function(err) {
					// if there was an error, reset the notifyOpportunites flag
					console.error('Could not update subscription for user due to error from notification ' +
						'service:' + err);
				})
				.then(function() {
					// this will always get executed, even if a catch is raised
					user.save(saveCallback);
				});
		}
		else if (notifyOppChanged && !user.notifyOpportunities && user.subscribeOpportunitiesId != null) {
			oppEmailNotifier.unsubscribe(user.subscribeOpportunitiesId)
				.then(function() {
					user.subscribeOpportunitiesId = null;
				})
				.catch(function(err) {
					// if there was an error, reset the notifyOpportunites flag
				})
				.then(function() {
					user.save(saveCallback);
				});
		}
		else {
			user.save(saveCallback);
		}
	}
	else {
		res.status(401).send({
			message: 'User is not signed in'
		});
	}
};

/**
 * Update profile picture
 */
exports.changeProfilePicture = function (req, res) {
	var user = req.user;
	var storage = multer.diskStorage (config.uploads.diskStorage);
	var upload = multer({storage: storage}).single('newProfilePicture');
	// var upload = multer(config.uploads.profileUpload).single('newProfilePicture');
	var profileUploadFileFilter = require(path.resolve('./config/lib/multer')).profileUploadFileFilter;
	var existingImageUrl;

	// Filtering to upload only images
	upload.fileFilter = profileUploadFileFilter;

	if (user) {
		existingImageUrl = user.profileImageURL;
		uploadImage()
			.then(updateUser)
			// .then(deleteOldImage)
			.then(login)
			.then(function () {
				res.json(user);
			})
			.catch(function (err) {
				res.status(422).send(err);
			});
	} else {
		res.status(401).send({
			message: 'User is not signed in'
		});
	}

	function uploadImage () {
		return new Promise(function (resolve, reject) {

			upload(req, res, function (uploadError) {
				if (uploadError) {
					// console.log ('error uploading');
					reject(errorHandler.getErrorMessage(uploadError));
				} else {
					// console.log ('uploaded');
					resolve();
				}
			});
		});
	}

	function updateUser () {
		return new Promise(function (resolve, reject) {
			// console.log ('req.file.filename', req.file);
			user.profileImageURL = '/'+config.uploads.profileUpload.display + req.file.filename;
			// console.log ('new profile = ', user.profileImageURL);
			user.save(function (err, theuser) {
				// console.log ('the user', theuser);
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	function deleteOldImage () {
		return new Promise(function (resolve, reject) {
			if (existingImageUrl !== User.schema.path('profileImageURL').defaultValue) {
				fs.unlink(existingImageUrl, function (unlinkError) {
					if (unlinkError) {
						// console.log(unlinkError);
						reject({
							message: 'Error occurred while deleting old profile picture'
						});
					} else {
						resolve();
					}
				});
			} else {
				resolve();
			}
		});
	}

	function login () {
		return new Promise(function (resolve, reject) {
			req.login(user, function (err) {
				if (err) {
					res.status(400).send(err);
				} else {
					resolve();
				}
			});
		});
	}
};

/**
 * Send User
 */
exports.me = function (req, res) {
	// Sanitize the user - short term solution. Copied from core.server.controller.js
	// TODO create proper passport mock: See https://gist.github.com/mweibel/5219403
	 // CC:  USERFIELDS
	var safeUserObject = null;
	if (req.user) {
		safeUserObject = {
			displayName             : validator.escape(req.user.displayName),
			provider                : validator.escape(req.user.provider),
			username                : validator.escape(req.user.username),
			created                 : req.user.created.toString(),
			roles                   : req.user.roles,
			profileImageURL         : req.user.profileImageURL,
			email                   : validator.escape(req.user.email),
			lastName                : validator.escape(req.user.lastName),
			firstName               : validator.escape(req.user.firstName),
			additionalProvidersData : req.user.additionalProvidersData,
			government              : req.user.government,
			notifyOpportunities     : req.user.notifyOpportunities,
			notifyEvents            : req.user.notifyEvents,
			notifyBlogs             : req.user.notifyBlogs,
      		userTitle               : req.user.userTitle

		};
	}

	res.json(safeUserObject || null);
};

exports.count = function (req, res) {
	User.count ({}, function (err, cnt) {
		if (err) res.status(400).send(err);
		else res.json ({count:cnt});
	});
};
