'use strict';

/**
 * Module dependencies
 */
var _             = require ('lodash');
var fs            = require ('fs');
var path          = require ('path');
var errorHandler  = require (path.resolve ('./modules/core/server/controllers/errors.server.controller'));
var mongoose      = require ('mongoose');
var multer        = require ('multer');
var config        = require (path.resolve ('./config/config'));
var User          = mongoose.model ('User');
var validator     = require ('validator');
var orgController = require (path.resolve ('./modules/orgs/server/controllers/orgs.server.controller'));
var claimMessages = require (path.resolve ('./modules/messages/server/controllers/messages.controller')).claimMessages;

 // CC:  USERFIELDS
var whitelistedFields = [
	'orgsAdmin'                ,
	'orgsMember'               ,
	'orgsPending'              ,
	'_id'                      ,
	'firstName'                ,
	'lastName'                 ,
	'email'                    ,
	'username'                 ,
	'government'               ,
	'notifyOpportunities'      ,
	'subscribeOpportunitiesId' ,
	'notifyEvents'             ,
	'notifyBlogs'              ,
	'userTitle'                ,
	'isDisplayEmail'           ,
	'isDeveloper'              ,
	'paymentMethod'            ,
	'phone'                    ,
	'address'                  ,
	'businessContactName'      ,
	'businessContactEmail'     ,
	'businessContactPhone'     ,
	'businessName'             ,
	'businessAddress'          ,
	'businessAddress2'         ,
	'businessCity'             ,
	'businessProvince'         ,
	'businessCode'             ,
	'location'                 ,
	'description'              ,
	'website'                  ,
	'skills'                   ,
	'skillsData'               ,
	'badges'                   ,
	'capabilities'             ,
	'endorsements'             ,
	'github'                   ,
	'stackOverflow'            ,
	'stackExchange'            ,
	'linkedIn'                 ,
	'isPublicProfile'          ,
	'isAutoAdd'                ,
	'capabilityDetails'        ,
	'capabilitySkills'
];

var updateOrgs = function (orglist) {
	return Promise.all (orglist.map (function (orgid) {
		return orgController.updateOrgCapabilities (orgid);
	}));
};



/**
 * Update user details
 */
exports.update = function (req, res) {
	// Init Variables
	var user = req.user;
	// console.log (user.orgsMember);
	if (user) {
		// Update whitelisted fields only
		var isClaimMessages = (!user.email && req.body.email);

		user = _.extend(user, _.pick(req.body, whitelistedFields));
		user.email = user.email.toLowerCase ();
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

		// subscriptionHandler(user)
		// .then(function() {
			return user.save(function (err) {
				if (err) {
					return res.status(422).send({
						message: errorHandler.getErrorMessage(err)
					});
				} else {
					if (isClaimMessages) claimMessages (user);
					updateOrgs (user.orgsMember);
					req.login(user, function (err) {
						if (err) {
							res.status(400).send(err);
						} else {
							res.json(user);
						}
					});
				}
			});
		// });

	}
	else {
		res.status(401).send({
			message: 'User is not signed in'
		});
	}
};


// function subscriptionHandler(user) {
// 	var promise = Promise.resolve();
// 	if (user.email == null || user.email === '') {
// 		return promise;
// 	}
// 	if (user.notifyOpportunities) {
// 		promise = Notifications.subscribe ('not-add-opportunity', user)
// 			.then(function(json) {
// 				// we save the id for the subscription so that was can unsubscribe at
// 				// a later point.
// 				user.subscribeOpportunitiesId = json.id;
// 			})
// 			.catch(function(err) {
// 				// if there was an error, reset the notifyOpportunites flag
// 				console.error('Could not subscribe user due to error from notification ' +
// 					'service:' + err);
// 				user.notifyOpportunites = false;
// 			});
// 	}
// 	else if (!user.notifyOpportunities ) {
// 		// promise = oppEmailNotifier.unsubscribe(user.subscribeOpportunitiesId)
// 		promise = Notifications.unsubscribeUserNotification ('not-add-opportunity', user)
// 			.then(function() {
// 				user.subscribeOpportunitiesId = null;
// 			})
// 			.catch(function() {
// 				// if there was an error, reset the notifyOpportunites flag
// 			})
// 	}

// 	return promise;
// }

// exports.subscriptionHandler = subscriptionHandler;
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
			.then(deleteOldImage)
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
					resolve();
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
			capabilityDetails : req.user.capabilityDetails,
			capabilitySkills : req.user.capabilitySkills

		};
	}

	res.json(safeUserObject || null);
};

exports.count = function (req, res) {
	User.countDocuments ({}, function (err, cnt) {
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
