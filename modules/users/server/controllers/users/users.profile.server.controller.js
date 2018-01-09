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
	// notifier = require(path.resolve('./modules/core/server/controllers/core.server.notifier.js')).notifier
	Notifications = require(path.resolve('./modules/notifications/server/controllers/notifications.server.controller'))
	;

 // CC:  USERFIELDS
var whitelistedFields = [
	'orgsAdmin',
	'orgsMember',
	'orgsPending',
	'_id',
	'firstName',
	'lastName',
	'email',
	'username',
	'government',
	'notifyOpportunities',
	'subscribeOpportunitiesId',
	'notifyEvents',
	'notifyBlogs',
	'userTitle',
	'isDisplayEmail',
	'isDeveloper'      ,
	'paymentMethod'    ,
	'phone'              ,
	'address'            ,
	'businessContactName'     ,
	'businessContactEmail'    ,
	'businessContactPhone'    ,
	'businessName'     ,
	'businessAddress'  ,
	'businessAddress2' ,
	'businessCity'     ,
	'businessProvince' ,
	'businessCode',
	'location',
	'description',
	'website',
	'skills',
	'skillsData',
	'badges',
	'capabilities',
	'endorsements',
	'github',
	'stackOverflow',
	'stackExchange',
	'linkedIn',
	'isPublicProfile',
	'isAutoAdd',
	'c01_flag',
	'c02_flag',
	'c03_flag',
	'c04_flag',
	'c05_flag',
	'c06_flag',
	'c07_flag',
	'c08_flag',
	'c09_flag',
	'c10_flag',
	'c11_flag',
	'c12_flag',
	'c13_flag',
	'c01_tags',
	'c02_tags',
	'c03_tags',
	'c04_tags',
	'c05_tags',
	'c06_tags',
	'c07_tags',
	'c08_tags',
	'c09_tags',
	'c10_tags',
	'c11_tags',
	'c12_tags',
	'c13_tags',
	'c01_experience',
	'c02_experience',
	'c03_experience',
	'c04_experience',
	'c05_experience',
	'c06_experience',
	'c07_experience',
	'c08_experience',
	'c09_experience',
	'c10_experience',
	'c11_experience',
	'c12_experience',
	'c13_experience',
	'c01_years',
	'c02_years',
	'c03_years',
	'c04_years',
	'c05_years',
	'c06_years',
	'c07_years',
	'c08_years',
	'c09_years',
	'c10_years',
	'c11_years',
	'c12_years',
	'c13_years'

];

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

		subscriptionHandler(user)
		.then(function() {
			return user.save(function (err) {
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
			});
		});

	}
	else {
		res.status(401).send({
			message: 'User is not signed in'
		});
	}
};


function subscriptionHandler(user) {
	var promise = Promise.resolve();
	if (user.email == null || user.email === '') {
		return promise;
	}
	if (user.notifyOpportunities) {
		promise = Notifications.subscribe ('not-add-opportunity', user)
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
			});
	}
	else if (!user.notifyOpportunities ) {
		// promise = oppEmailNotifier.unsubscribe(user.subscribeOpportunitiesId)
		promise = Notifications.unsubscribeUserNotification ('not-add-opportunity', user)
			.then(function() {
				user.subscribeOpportunitiesId = null;
			})
			.catch(function() {
				// if there was an error, reset the notifyOpportunites flag
			})
	}

	return promise;
}

exports.subscriptionHandler = subscriptionHandler;
/**
 * Update profile picture
 */
exports.changeProfilePicture = function (req, res) {
	var user = req.user;
	var storage = multer.diskStorage (config.uploads.diskStorage);
	var upload = multer({storage: storage}).single('newProfilePicture');
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
					reject(errorHandler.getErrorMessage(uploadError));
				} else {
					resolve();
				}
			});
		});
	}

	function updateUser () {
		return new Promise(function (resolve, reject) {
			user.profileImageURL = '/'+config.uploads.profileUpload.display + req.file.filename;
			user.save(function (err) {
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
	 // CC:  USERFIELDS
	var safeUserObject = null;
	if (req.user) {
		safeUserObject = {
			displayName             : validator.escape(req.user.displayName),
			provider                : validator.escape(req.user.provider),
			username                : validator.escape(req.user.username),
			created                 : req.user.created.toString(),
			roles                   : req.user.roles,
			orgsAdmin                     : req.user.orgsAdmin,
			orgsMember                     : req.user.orgsMember,
			orgsPending                     : req.user.orgsPending,
			profileImageURL         : req.user.profileImageURL,
			email                   : validator.escape(req.user.email),
			lastName                : validator.escape(req.user.lastName),
			firstName               : validator.escape(req.user.firstName),
			additionalProvidersData : req.user.additionalProvidersData,
			government              : req.user.government,
			notifyOpportunities     : req.user.notifyOpportunities,
			notifyEvents            : req.user.notifyEvents,
			notifyBlogs             : req.user.notifyBlogs,
			userTitle               : req.user.userTitle,
			isDisplayEmail          : req.user.isDisplayEmail,
			phone                   : req.user.phone,
			address                 : req.user.address,
			businessContactName     : validator.escape(req.user.businessContactName),
			businessContactEmail    : validator.escape(req.user.businessContactEmail),
			businessContactPhone    : validator.escape(req.user.businessContactPhone),
			isDeveloper             : req.user.isDeveloper,
			paymentMethod           : req.user.paymentMethod,
			businessName            : validator.escape(req.user.businessName),
			businessAddress         : validator.escape(req.user.businessAddress),
			businessAddress2        : validator.escape(req.user.businessAddress2),
			businessCity            : validator.escape(req.user.businessCity),
			businessProvince        : req.user.businessProvince,
			businessCode            : validator.escape(req.user.businessCode),
			location                : req.user.location,
			description             : validator.escape(req.user.description),
			website                 : req.user.website,
			skills                  : req.user.skills,
			skillsData              : req.user.skillsData,
			badges                  : req.user.badges,
			capabilities            : req.user.capabilities,
			endorsements            : req.user.endorsements,
			github                  : req.user.github,
			stackOverflow           : req.user.stackOverflow,
			stackExchange           : req.user.stackExchange,
			linkedIn                : req.user.linkedIn,
			isPublicProfile         : req.user.isPublicProfile,
			isAutoAdd               : req.user.isAutoAdd,
			c01_flag : req.user.c01_flag,
			c02_flag : req.user.c02_flag,
			c03_flag : req.user.c03_flag,
			c04_flag : req.user.c04_flag,
			c05_flag : req.user.c05_flag,
			c06_flag : req.user.c06_flag,
			c07_flag : req.user.c07_flag,
			c08_flag : req.user.c08_flag,
			c09_flag : req.user.c09_flag,
			c10_flag : req.user.c10_flag,
			c11_flag : req.user.c11_flag,
			c12_flag : req.user.c12_flag,
			c13_flag : req.user.c13_flag,
			c01_tags : req.user.c01_tags,
			c02_tags : req.user.c02_tags,
			c03_tags : req.user.c03_tags,
			c04_tags : req.user.c04_tags,
			c05_tags : req.user.c05_tags,
			c06_tags : req.user.c06_tags,
			c07_tags : req.user.c07_tags,
			c08_tags : req.user.c08_tags,
			c09_tags : req.user.c09_tags,
			c10_tags : req.user.c10_tags,
			c11_tags : req.user.c11_tags,
			c12_tags : req.user.c12_tags,
			c13_tags : req.user.c13_tags,
			c01_experience : req.user.c01_experience,
			c02_experience : req.user.c02_experience,
			c03_experience : req.user.c03_experience,
			c04_experience : req.user.c04_experience,
			c05_experience : req.user.c05_experience,
			c06_experience : req.user.c06_experience,
			c07_experience : req.user.c07_experience,
			c08_experience : req.user.c08_experience,
			c09_experience : req.user.c09_experience,
			c10_experience : req.user.c10_experience,
			c11_experience : req.user.c11_experience,
			c12_experience : req.user.c12_experience,
			c13_experience : req.user.c13_experience,
			c01_years : req.user.c01_years,
			c02_years : req.user.c02_years,
			c03_years : req.user.c03_years,
			c04_years : req.user.c04_years,
			c05_years : req.user.c05_years,
			c06_years : req.user.c06_years,
			c07_years : req.user.c07_years,
			c08_years : req.user.c08_years,
			c09_years : req.user.c09_years,
			c10_years : req.user.c10_years,
			c11_years : req.user.c11_years,
			c12_years : req.user.c12_years,
			c13_years : req.user.c13_years

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

exports.removeSelf = function (req, res) {
	if (req.user) {
		var id = req.user._id;
		req.logout();
		res.redirect('/');
		User.remove({_id: id}, function () {});

	}
};
