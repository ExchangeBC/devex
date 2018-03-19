'use strict';
/*

Notes about notifications

*/

/**
 * Module dependencies.
 */
var path             = require('path'),
	mongoose         = require('mongoose'),
	Notification     = mongoose.model('Notification'),
	Subscription     = mongoose.model('Subscription'),
	errorHandler     = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
	helpers          = require(path.resolve('./modules/core/server/controllers/core.server.helpers')),
	fs               = require('fs'),
	markdown         = require('helper-markdown'),
	Handlebars       = require('handlebars'),
	htmlToText       = require('html-to-text'),
	config           = require(path.resolve('./config/config')),
	chalk            = require('chalk'),
	_                = require('lodash');
var nodemailer   = require('nodemailer');
var smtpTransport = nodemailer.createTransport (config.mailer.options);




Handlebars.registerHelper('markdown', markdown({ breaks: true, xhtmlOut: false }));

// -------------------------------------------------------------------------
//
// this does the actual work
// opts: {
// 	to:
// 	from:
// 	subject:
// 	html:
// 	text:
// 	attachments: [{
// 		filename: 'blah.pdf',
// 		path: '/path/to/blah.pdf'
// 	}]
// }
//
// -------------------------------------------------------------------------
var sendmail = function (opts) {
	opts.from = config.mailer.from;
	return new Promise (function (resolve, reject) {
		smtpTransport.sendMail (opts, function (err) {
			if (err) {
				console.error(chalk.red ('+++ Error sending email: '));
				console.error (err);
				reject (err);
			}
			else resolve (true);
		});
	});
};
exports.send = sendmail;

// -------------------------------------------------------------------------
//
// compile subject and body in the object and put the results into
// subjectTemplate and bodyTemplate
//
// -------------------------------------------------------------------------
var compileTemplates = function (obj) {
	obj.bodyTemplate    = Handlebars.compile(obj.body);
	obj.subjectTemplate = Handlebars.compile(obj.subject);
	return obj;
};
// -------------------------------------------------------------------------
//
// if domain has http.... in front, then leave it, otherwise append
// http.  We beleive that if https is used then the env variable will
// prefix correctly with https
//
// -------------------------------------------------------------------------
var getDomain = function () {
	var domain = 'http://localhost:3030';
	if (process.env.DOMAIN) {
		var d = process.env.DOMAIN;
		if (d.substr (0,4) === 'http') {
			domain = d;
		} else {
			domain = 'http://' + d;
		}
	}
	return domain;
}
var getTemplates = function (notification, data) {
	data.domain = getDomain ();
	var fname     = notification.target.toLowerCase()+'-'+notification.event.toLowerCase();
	var template  =  compileTemplates ({
		body    : fs.readFileSync(path.resolve('./modules/core/server/email_templates/'+fname+'-body.md'), 'utf8'),
		subject : fs.readFileSync(path.resolve('./modules/core/server/email_templates/'+fname+'-subject.md'), 'utf8')
	});

	var attachment      = path.resolve('./modules/core/server/email_templates/'+fname+'-attachment.pdf');
	template.attachment = (fs.existsSync (attachment)) ? attachment : '';
	template.subject    = template.subjectTemplate ({data: data});
	template.htmlBody   = template.bodyTemplate ({data: data});
	template.textBody   = htmlToText.fromString (template.htmlBody, { wordwrap: 130 });
	return template;
};
//
// this is for internal use where we do the merge
//
var getTemplatesMerge = function (subscriptions, notification, data) {
	data.domain = getDomain ();
	var fname     = notification.target.toLowerCase()+'-'+notification.event.toLowerCase();
	var template  =  compileTemplates ({
		body    : fs.readFileSync(path.resolve('./modules/core/server/email_templates/'+fname+'-body.md'), 'utf8'),
		subject : fs.readFileSync(path.resolve('./modules/core/server/email_templates/'+fname+'-subject.md'), 'utf8'),
		attachment : path.resolve('./modules/core/server/email_templates/'+fname+'-attachment.pdf')
	});
	var attachment = path.resolve('./modules/core/server/email_templates/'+fname+'-attachment.pdf');
	template.attachment = (fs.existsSync (attachment)) ? attachment : '';
	return subscriptions.map (function (sub) {
		data.username = sub.user.displayName;
		data.subscriptionId = sub.subscriptionId;
		var htmlbody = template.bodyTemplate ({data: data});
		var textbody = htmlToText.fromString (htmlbody, { wordwrap: 130 });
		return {
			to      : sub.user.email,
			subject : template.subjectTemplate ({data: data}),
			html    : htmlbody,
			text    : textbody
		};
	});
};
// -------------------------------------------------------------------------
//
// notification
//
// -------------------------------------------------------------------------
var getNotificationByID = function (id) {
	return new Promise (function (resolve, reject) {
		if (id.substr && id.substr (0, 3) === 'not' ) {
			Notification.findOne({code:id}).exec(function (err, notification) {
				if (err) {
					reject (err);
				}
				else if (!notification) {
					reject ({empty:true, message: 'No notification with that identifier has been found'});
				}
				else {
					resolve (notification)
				}
			});
		} else {
			if (!mongoose.Types.ObjectId.isValid (id)) {
				reject ({message: 'Notification is invalid'});
			}
			else {
				Notification.findById(id).exec(function (err, notification) {
					if (err) {
						reject (err);
					}
					else if (!notification) {
						reject ({empty:true, message: 'No notification with that identifier has been found'});
					}
					else {
						resolve (notification);
					}
				});
			}
		}
	});
};
var resolveNotification = function (notification) {
	if (typeof (notification) === 'object' && notification._id) {
		return Promise.resolve (notification);
	} else {
		return getNotificationByID (notification);
	}
};
// -------------------------------------------------------------------------
//
// subscription
//
// -------------------------------------------------------------------------
var getSubscriptionByID = function (id) {
	return new Promise (function (resolve, reject) {
		if (!mongoose.Types.ObjectId.isValid (id)) {
			reject ({message: 'Subscription is invalid'});
		}
		else {
			Subscription.findById(id).populate('notification').exec(function (err, subscription) {
				if (err) {
					reject (err);
				}
				else if (!subscription) {
					reject ({empty:true, message: 'No subscription with that identifier has been found'});
				}
				else {
					resolve (subscription);
				}
			});
		}
	});
};
var getSubscriptionByExternalID = function (id) {
	return new Promise (function (resolve, reject) {
		Subscription.findOne({subscriptionId:id}).populate('notification').populate('user','displayName email').exec(function (err, subscription) {
			if (err) {
				reject (err);
			}
			else if (!subscription) {
				reject ({empty:true, message: 'No subscription with that identifier has been found'});
			}
			else {
				resolve (subscription);
			}
		});
	});
};
var getSubscriptionByUserNotification = function (notification, user) {
	return new Promise (function (resolve, reject) {
		Subscription.findOne({notification:notification._id, user:user._id}).populate('notification').exec(function (err, subscription) {
			if (err) {
				reject (err);
			}
			else if (!subscription) {
				reject ({empty:true, message: 'No subscription found'});
			}
			else {
				resolve (subscription);
			}
		});
	});
};
var resolveSubscription = function (subscription) {
	if (typeof (subscription) === 'object' && subscription._id) {
		return Promise.resolve (subscription);
	} else {
		return getSubscriptionByID (subscription);
	}
};
var getSubscribedUsers = function (notificationCode) {
	return new Promise (function (resolve, reject) {
		getNotificationByID (notificationCode).then (function () {
			Subscription.find ({notificationCode:notificationCode})
			.populate ('user', 'email displayName')
			.exec (function (err, subs) {
				if (err) reject (err);
				else {
					resolve ( subs.map (function (sub) {
						return sub.user.email;
					}));
				}
			});
		});
	});
};
var getSubscriptionsForNotification = function (notificationCode) {
	return new Promise (function (resolve, reject) {
			Subscription.find ({notificationCode:notificationCode})
			.populate ('user', 'email displayName')
			.exec (function (err, subs) {
				if (err) reject (err);
				else resolve (subs);
			});
	});
};
var removeSubscriptionsForUser = function (user) {
	return new Promise (function (resolve, reject) {
		Subscription.remove ({user:user._id}, function (err) {
			if (err) reject (err);
			else resolve ({ok:true});
		});
	});
};

// -------------------------------------------------------------------------
//
// remove a subscription
//
// -------------------------------------------------------------------------
var removeSubscription = function (subscription) {
	return new Promise (function (resolve, reject) {
		subscription.remove (function (err) {
			if (err) reject (err);
			else resolve (subscription);
		});
	});
};
// -------------------------------------------------------------------------
//
// add a subscription
//
// -------------------------------------------------------------------------
var saveNotification = function (subscription) {
	return new Promise (function (resolve, reject) {
		subscription.save (function (err) {
			if (err) {
				reject (err);
			} else {
				resolve (subscription);
			}
		});
	});
};
var createSubscription = function (model) {
	return saveNotification (new Subscription (model));
};
// -------------------------------------------------------------------------
//
// all notification functions return a promise
// these can be passed an Id (our internal ids) or a mongoose document, it should
// figure it out for itself
//
// -------------------------------------------------------------------------
exports.subscribe = function (notificationidOrObject, user) {
	return resolveNotification (notificationidOrObject)
	.then (function (notification) {
		var p = new Subscription ();
		return createSubscription ({
			subscriptionId   : p._id.toString (),
			notification     : notification._id,
			notificationCode : notification.code,
			user             : user._id
		});
	});
};
exports.unsubscribe = function (subscriptionIdOrObject) {
	return resolveSubscription (subscriptionIdOrObject)
	.then (function (subscription) {
		return removeSubscription (subscription);
	});
};
exports.unsubscribeUserNotification = function (notificationidOrObject, user) {
	return resolveNotification (notificationidOrObject)
	.then (function (notification) {
		return getSubscriptionByUserNotification (notification, user);
	})
	.then (function (subscription) {
		return exports.unsubscribe (subscription, user);
	});
};
exports.unsubscribeUserAll = function (user) {
	return removeSubscriptionsForUser (user)
	.then (function (notification) {
		return getSubscriptionByUserNotification (notification, user);
	})
	.then (function (subscription) {
		return exports.unsubscribe (subscription, user);
	});
};
exports.notifyObject = function (notificationidOrObject, data) {

	return resolveNotification (notificationidOrObject)
	.then (function (notification) {
		//
		// for internal use, message is
		// {
		// 	to:
		// 	from:
		// 	subject:
		// 	html:
		// 	text:
		// }
		//
		return getSubscriptionsForNotification (notification.code)
		.then (function (subscriptions) {
			var subs = [];
			subscriptions.map (function (s) {
				if (s.user && s.user.email) subs.push (s);
			});
			return subs;
		})
		.then (function (subscriptions) {
			return getTemplatesMerge (subscriptions, notification, data);
		})
		.then (function (emails) {
			return Promise.all (emails.map (function (message) {
				return sendmail (message);
			}));
		});
	});
};
// -------------------------------------------------------------------------
//
// send a notification ad hoc, just needs to match up with a template
// data will be the data object we are binding. it should also contain:
// username : user name as wanted in template
// useremail: the email to send to
// filename: if there is an attachment, the real name of it
//
// -------------------------------------------------------------------------
exports.notifyUserAdHoc = function (templatename, data) {
	data.domain = getDomain ();
	var template  =  compileTemplates ({
		body    : fs.readFileSync(path.resolve('./modules/core/server/email_templates/'+templatename+'-body.md'), 'utf8'),
		subject : fs.readFileSync(path.resolve('./modules/core/server/email_templates/'+templatename+'-subject.md'), 'utf8')
	});
	var attachment = path.resolve('./modules/core/server/email_templates/'+data.filename);
	if (fs.existsSync (attachment)) template.attachment = attachment ;
	var htmlbody = template.bodyTemplate ({data: data});
	var textbody = htmlToText.fromString (htmlbody, { wordwrap: 130 });
	var mailopts = {
		to      : data.useremail,
		subject : template.subjectTemplate ({data: data}),
		html    : htmlbody,
		text    : textbody
	};
	if (template.attachment) {
		mailopts.attachments = [{
			filename: data.filename,
			path: template.attachment
		}];
	}
	return sendmail (mailopts);
};

// -------------------------------------------------------------------------
//
// get a list of all my notification subscriptions
//
// -------------------------------------------------------------------------
exports.myList = function (req, res) {
	if (!req.user) {
		return res.json([]);
	}
	Subscription.find ({
		user: req.user._id
	})
	.populate ('notification')
	.sort ('notification.name')
	.exec (function (err, subscriptions) {
		if (err) {
			return res.status(422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (subscriptions);
		}
	});
};
// -------------------------------------------------------------------------
//
// delete (unsubscribe) from a notification, but do not display an html page
// this is used in context of the application, not as an endpoint
//
// -------------------------------------------------------------------------
exports.myDelete = function (req, res) {
	//
	// if the subscription is actually for this user delete it, or if the user
	// is the admin
	//
	if (!!~req.user.roles.indexOf ('admin') || req.subscription.user === req.user._id) {
		exports.unsubscribe (req.subscription)
		.then (function () {
			res.json (req.subscription);
		})
		.catch (function (err) {
			res.status(422).send ({ message: errorHandler.getErrorMessage(err) });
		})
	} else {
		return res.status(422).send ({
			message: 'This is not your subscription, I cannot delete it'
		});
	}
};
exports.subscribeMe = function (req, res) {
	if (!req.user) return res.status(422).send ({
		message: 'You do not appear to be logged in, sorry I can\'t help you right now.'
	});
	exports.subscribe (req.notification, req.user)
		.then (function () {
			res.json (req.notification);
		})
		.catch (function (err) {
			res.status(422).send ({ message: errorHandler.getErrorMessage(err) });
		})
};
exports.unsubscribeMe = function (req, res) {
	if (!req.user) return res.status(422).send ({
		message: 'You do not appear to be logged in, sorry I can\'t help you right now.'
	});
	exports.unsubscribeUserNotification (req.notification, req.user)
		.then (function () {
			res.json (req.notification);
		})
		.catch (function (err) {
			res.status(422).send ({ message: errorHandler.getErrorMessage(err) });
		})
};
// -------------------------------------------------------------------------
//
// list subscriptions for either a user or for a notification
//
// -------------------------------------------------------------------------
exports.forNotification = function (req, res) {
	Subscription.find ({
		notification: req.notification._id
	})
	.populate ('notification', 'name')
	.populate ('user', 'displayName')
	.sort ('notification.name')
	.exec (function (err, subscriptions) {
		if (err) {
			return res.status(422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (subscriptions);
		}
	});
};
exports.forUser = function (req, res) {
	Subscription.find ({
		user: req.model._id
	})
	.populate ('notification', 'name')
	.populate ('user', 'displayName')
	.sort ('notification.name')
	.exec (function (err, subscriptions) {
		if (err) {
			return res.status(422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (subscriptions);
		}
	});
};
// -------------------------------------------------------------------------
//
// unsubscribe from a notification, return an html message indicating such
//
// -------------------------------------------------------------------------
exports.unsubscribeExternal = function (req, res) {
	var message = '<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo.png"/><h4>This action has already been performed.</h4>';
	message += '<p>Please sign in on the ';
	message += '<a href=\'https://bcdevexchange.org\'>BCDevExchange.org</a> to manage your notifications.</p>';
	message += '<p>Thanks for using the BCDevExchange!</p>';
	if (!req.subscription) return res.send (message);
	message = '<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo.png"/><h4>You are no longer following:</h4><h4>'+req.subscription.notification.name+'</h4>';
	message += '<p>Please sign in on the ';
	message += '<a href=\'https://bcdevexchange.org\'>BCDevExchange.org</a> to manage your notifications.</p>';
	message += '<p>Thanks for using the BCDevExchange!</p>';
	exports.unsubscribe (req.subscription)
	.then (function () {
		res.send (message);
	})
	.catch (function () {
		res.send (message);
	});
};

exports.subscribeExternal = function (req, res) {
	var message = '<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo.png"/><h4>You are now following this oppoprtunity:</h4><h4>'+req.notification.name+'</h4>';
	message += '<p>Please sign in on the ';
	message += '<a href=\'https://bcdevexchange.org\'>BCDevExchange.org</a> to manage your notifications.</p>';
	message += '<p>Thanks for using the BCDevExchange!</p>';
	if (!req.subscription) return res.send (message);
	exports.subscribe (req.notification, req.subscription.user)
	.then (function () {
		res.send (message);
	})
	.catch (function () {
		res.send (message);
	});
};
/**
 * Create / Save a Notification
 */
// -------------------------------------------------------------------------
//
// create a new notification.
//
// -------------------------------------------------------------------------
var addNotificationCode = function (notification) {
	//
	// if the notification laready has a proper code set, then leave it alone
	//
	if (notification.code && notification.code.substr (0, 4) === 'not-') {
		return Promise.resolve (notification);
	}
	else return new Promise (function (resolve) {
		Notification.findUniqueCode (notification.name, null, function (newcode) {
			notification.code = newcode;
			resolve (notification);
		});
	});
};
exports.saveNotification = function (notification) {
	return new Promise (function (resolve, reject) {
		notification.save (function (err) {
			if (err) {
				reject (err);
			} else {
				resolve (notification);
			}
		});
	});
};
exports.createNotification = function (model) {
	return addNotificationCode (new Notification(model)).then (exports.saveNotification);
};
exports.create = function (req, res) {
	exports.createNotification (req.body)
	.then (function (notification) {
		res.json(notification);
	})
	.catch (function (err) {
		res.status(422).send ({
			message: errorHandler.getErrorMessage(err)
		});
	});
};
// -------------------------------------------------------------------------
//
// this is meant to be used by other modules for adding a new notification
// programmatically.
//
// The caller really only knows so much, they can name the notification
// following the standard of not-<event>-<object>, and let us know the event
// and the overall target.  this information will be used to select the
// appropriate template from the file system as well
//
// -------------------------------------------------------------------------
exports.addNotification = function (obj) {
	return exports.createNotification ({
		code   : obj.code,
		name   : obj.name,
		target : obj.target,
		event  : obj.event
	});
};

// -------------------------------------------------------------------------
//
// this just takes the already queried object and pass it back
//
// -------------------------------------------------------------------------
exports.read = function (req, res) {
	res.json (req.notification);
};
exports.readSubscription = function (req, res) {
	res.json (req.subscription);
};

// -------------------------------------------------------------------------
//
// update the document,
//
// -------------------------------------------------------------------------
exports.update = function (req, res) {
	var notification = _.assign (req.notification, req.body);
	exports.saveNotification (notification)
	.then (function (notification) {
		res.json(notification);
	})
	.catch (function (err) {
		res.status(422).send ({
			message: errorHandler.getErrorMessage(err)
		});
	});
};

// -------------------------------------------------------------------------
//
// delete the notification
// TBD: We really should also unsubscribe all related subscriptions
//
// -------------------------------------------------------------------------
exports.delete = function (req, res) {
		var notification = req.notification;
		notification.remove(function (err) {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.json(notification);
			}
		});
};

// -------------------------------------------------------------------------
//
// return a list of all notifications
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
	Notification.find({}).sort('name')
	.exec(function (err, notifications) {
		if (err) {
			return res.status(422).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json (notifications);
		}
	});
};



// -------------------------------------------------------------------------
//
// new empty notification
//
// -------------------------------------------------------------------------
exports.new = function (req, res) {
	var p = new Notification ();
	res.json(p);
};


// -------------------------------------------------------------------------
//
// magic that populates the notification on the request
//
// -------------------------------------------------------------------------
exports.notificationByID = function (req, res, next, id) {
	getNotificationByID (id)
	.then (function (notification) {
		req.notification = notification;
		next();
	})
	.catch (function (err) {
		if (err.empty) {
			return res.status(404).send (err);
		} else {
			return next (err);
		}
	});
};
// -------------------------------------------------------------------------
//
// magic that populates the subscription on the request
//
// -------------------------------------------------------------------------
exports.subscriptionById = function (req, res, next, id) {
	getSubscriptionByID (id)
	.then (function (subscription) {
		req.subscription = subscription;
		next();
	})
	.catch (function (err) {
		if (err.empty) {
			return res.status(404).send (err);
		} else {
			return next (err);
		}
	});
};
exports.externalSubscriptionById = function (req, res, next, id) {
	getSubscriptionByExternalID (id)
	.then (function (subscription) {
		req.subscription = subscription;
		next();
	})
	.catch (function () {
		req.subscription = null;
		next();
	});
};



exports.reApplySubscriptions = function (req, res) {
	if (!!~req.user.roles.indexOf ('admin')) {
	    var User = mongoose.model ('User');
		User.find ({notifyOpportunities:true}, function (err, users) {
			users.map (function (u) {
				return exports.subscribe ('not-add-opportunity', u);
			});
			res.json ({ok:true});
		});
	}
	else {
		res.status(404).json({ok:false});
	}
};
exports.checkSubscriptions = function (req, res) {
	if (!!~req.user.roles.indexOf ('admin')) {
	    var User = mongoose.model ('User');
		User.find ({notifyOpportunities:true}, function (err, users) {
			users.map (function (u) {
				return exports.subscribe ('not-add-opportunity', u);
			});
			res.json ({ok:true});
		});
	}
	else {
		res.status(404).json({ok:false});
	}
};
exports.countFollowingOpportunity = function (oppcode) {
	var notcode = 'not-update-'+oppcode;
	return new Promise (function (resolve, reject) {
		Notification.count ({code:notcode} , function (err, result) {
			if (err) reject (err);
			else resolve (result);
		});

	});
};
exports.tryme = function (req, res) {
	getTemplates ({target:'program', event:'add'}, {});
	res.json({ok:true});
};
