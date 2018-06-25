'use strict';
// =========================================================================
//
// part of the set of controllers for the messaging system
//
// these ones deal with the messages tables and their interactions
//
// =========================================================================
var mongoose        = require ('mongoose');
var User            = mongoose.model ('User');
var Message         = mongoose.model ('Message');
var MessageTemplate = mongoose.model ('MessageTemplate');
var MessageArchive  = mongoose.model ('MessageArchive');
var path            = require ('path');
var errorHandler    = require (path.resolve ('./modules/core/server/controllers/errors.server.controller'));
var handlebars      = require ('handlebars');
var htmlToText      = require ('html-to-text');
var config          = require (path.resolve ('./config/config'));
var nodemailer      = require('nodemailer');
var smtpTransport   = nodemailer.createTransport (config.mailer.options);
var chalk           = require('chalk');
var helpers         = require(path.resolve('./modules/core/server/controllers/core.server.helpers'));
var _               = require ('lodash');

// =========================================================================
//
// Common Functions
//
// =========================================================================
// -------------------------------------------------------------------------
//
// perform a query on the messages table
// HIDE THE LINKS - they hsould never get to the front end as they pose a
// security risk
//
// -------------------------------------------------------------------------
var query = function (table, q) {
	return new Promise (function (resolve, reject) {
		table.find (q)
		.select ('-link')
		.sort ({dateSent:-1, dateExpired: 1})
		.populate ('user', 'displayName email')
		.exec (function (err, messages) {
			if (err) reject (errorHandler.getErrorMessage(err));
			else resolve (messages);
		});
	});
};
var count = function (table, q) {
	return new Promise (function (resolve, reject) {
		table.count (q, function (err, c) {
			if (err) reject (errorHandler.getErrorMessage(err));
			else resolve (c);
		});
	});
};
var appendNotificationLink = function (messagebody) {
	var link = '<a href="{{domain}}/messages/{{messageid}}">BCDevExchange</a>';
	var m = 'Sign in to the '+link+' to respond to this message. This message will expire on {{date2Archive}}';
	return messagebody+'<p><br/>'+m+'<br/></p>';
}
// -------------------------------------------------------------------------
//
// archive a message
//
// -------------------------------------------------------------------------
var archiveMessage = function (message) {
	message.dateArchived = Date.now ();
	var archive = new MessageArchive (message.toObject ());
	return new Promise (function (resolve, reject) {
		archive.save (function (err, amessage) {
			if (err) reject (errorHandler.getErrorMessage(err));
			else {
				message.remove (function (err) {
					if (err) reject (errorHandler.getErrorMessage(err));
					else resolve ({happiness:true});
				});
			}
		});
	});
};
var archiveMessages = function (messages) {
	return Promise.all (messages.map (function (message) {
		return archiveMessage (message);
	}));
};
// -------------------------------------------------------------------------
//
// save a message
//
// -------------------------------------------------------------------------
var saveMessage = function (message) {
	return new Promise (function (resolve, reject) {
		message.save (function (err, message) {
			if (err) reject (errorHandler.getErrorMessage(err));
			else resolve (message);
		});
	});
};
// -------------------------------------------------------------------------
//
// this does the actual work
//
// -------------------------------------------------------------------------
var sendmail = function (message) {
	var opts = {
		to      : message.userEmail,
		from    : config.mailer.from,
		subject : message.emailSubject,
		html    : message.emailBody,
		text    : htmlToText.fromString ( message.emailBody, { wordwrap: 130 })
	}
	var result = {
		dateSent : Date.now (),
		isOk     : true,
		error    : {}
	};
	return new Promise (function (resolve, reject) {
		smtpTransport.sendMail (opts, function (err) {
			if (err) {
				console.error (chalk.red ('+++ Error sending email: '));
				console.error (err);
				result.error = err;
				result.isOk  = false;
			}
		});
		message.emailSent    = result.isOk;
		message.emailRetries = message.emailRetries+1;
		message.emails.push (result);
		resolve (message);
	});
};
// -------------------------------------------------------------------------
//
// get a user from an id
//
// -------------------------------------------------------------------------
var getUser = function (userid) {
	return new Promise (function (resolve, reject) {
		User.findById (userid, '_id firstName lastName displayName email username').exec (function (err, user) {
			if (err) reject (err);
			else resolve (user);
		});
	});
};
// -------------------------------------------------------------------------
//
// Gets the domain and uses the correct protocol based on configuration
//
// -------------------------------------------------------------------------
var getDomain = function () {
	var domain = '';
	if (config.secure && config.secure.ssl) {
		domain += 'https://';
	}
	else {
		domain += 'http://';
	}

	domain += 'localhost:3000';
	return domain;
}
var getHostInfoFromDomain = function (o) {
	var domain = getDomain ();
	var part1 = domain.split ('://');
	var part2 = part1[1].split (':');
	var protocol = part1[0];
	var host     = part2[0];
	var port = (protocol === 'https') ? 443 : 80;
	port = part2[1] ? part2[1] : port;
	o._protocol = protocol;
	o.host      = host;
	o.port      = port;
	o.url       = domain+o.path;
	return o;
}
// -------------------------------------------------------------------------
//
// prepare a single message
//
// -------------------------------------------------------------------------
var prepareMessage = function (template, data) {
	//
	// deal with archive and current dates
	//
	var datePosted = new Date (Date.now ());
	var date2Archive = new Date (datePosted);
	date2Archive.setDate(date2Archive.getDate() + template.daysToArchive);
	//
	// put them in the data as well
	//
	data.datePosted   = helpers.formatDate (datePosted);
	data.date2Archive = helpers.formatDate (date2Archive);
	//
	// make the new message by applying the templates with data
	//
	var messageUser = (!data.user || !data.user._id) ? null : data.user;
	var message = new Message ({
		messageCd    : template.messageCd,
		user         : messageUser,
		userEmail    : data.user.email,
		datePosted   : Date.now ()
	});
	//
	// include the id in the data so the links can be built
	//
	data.messageid = message._id;
	//
	// run the templates
	//
	message.messageBody  = template.messageBody (data);
	message.messageShort = template.messageShort (data);
	message.messageTitle = template.messageTitle (data);
	message.emailBody    = template.emailBody (data);
	message.emailSubject = template.emailSubject (data);
	message.link         = template.link (data);
	//
	// now run the action tempaltes
	//
	template.actions.forEach (function (action) {
		message.actions.push ({
			actionCd  : action.actionCd,
			// link      : action.link (data),
			linkTitle : action.linkTitle (data),
			isDefault : action.isDefault
		})
	});
	return message;
};
// -------------------------------------------------------------------------
//
// send a particular template to a particular user
// returns a promise
//
// -------------------------------------------------------------------------
var sendMessage = function (template, user, data) {
	data.user = user;

	if (data.opportunity) {
		// eslint-disable-next-line new-cap
		data.formattedEarnings = Intl.NumberFormat('en', {
			style: 'currency',
			currency: 'USD'
		}).format(data.opportunity.earn);
		// eslint-disable-next-line new-cap
		data.formattedBudget = Intl.NumberFormat('en', {
			style: 'currency',
			currency: 'USD'
		}).format(data.opportunity.budget);
	}

	var message = prepareMessage (template, data);
	return sendmail (message)
	.then (saveMessage)
	.catch (function (err) {
		console.error (chalk.red ('+++ Error saving message: '));
		console.error (err);
		return err;
	});
};

// =========================================================================
// =========================================================================
//
// Internal API
// These can be called by other modules directly - they are NOT rest
// handlers themselves but could also be called by the rest handlers
//
// =========================================================================
// =========================================================================
// -------------------------------------------------------------------------
//
// sends messages to an array of users
// first pre-compile templates, then loop and send
//
// -------------------------------------------------------------------------
exports.sendMessages = function (messageCd, users, data) {
	if (users.length === 0) return;
	//
	// ensure the domain is set properly
	//
	data.domain = config.app.domain ? config.app.domain : 'http://localhost:3000';
	//
	// get the template and then send
	//
	return new Promise (function (resolve, reject) {
		MessageTemplate.findOne ({messageCd: messageCd})
		.exec (function (err, template) {
			//
			// compile all the templates
			//
			template.messageBody  = handlebars.compile(template.messageBodyTemplate);
			template.messageShort = handlebars.compile(template.messageShortTemplate);
			template.messageTitle = handlebars.compile(template.messageTitleTemplate);
			template.emailBody    = handlebars.compile(appendNotificationLink (template.emailBodyTemplate));
			template.emailSubject = handlebars.compile(template.emailSubjectTemplate);
			template.link         = handlebars.compile(template.linkTemplate);
			template.actions.forEach (function (action) {
				// action.link      = handlebars.compile(action.linkTemplate);
				action.linkTitle = handlebars.compile(action.linkTitleTemplate);
			});
			var promise;
			//
			// if this is a list of userids
			//
			if (mongoose.Types.ObjectId.isValid (users[0])) {
				promise = Promise.all (users.map (function (userid) {
					return getUser (userid)
					.then (function (user) {
						return sendMessage (template, user, data);
					});
				}));
			}
			//
			// or it is a list of user objects already
			//
			else {
				promise = Promise.all (users.map (function (user) {
					return sendMessage (template, user, data);
				}));
			}
			//
			// do it
			//
			promise.then (resolve, reject);
		});
	});
};
// -------------------------------------------------------------------------
//
// if a new user has messages but has just signed up this sets those messages
// to link to her user account
//
// -------------------------------------------------------------------------
exports.claimMessages = function (user) {
	return query (Message, {
		userEmail : user.email
	})
	.then (function (messages) {
		return Promise.all (messages.map (function (message) {
			message.user = user;
			return saveMessage (message);
		}));
	});
};
// =========================================================================
//
// REST Handlers and functions
//
// =========================================================================
var sendError = function (res, message) {
	return res.status (400).send ({ message: message });
};
var resError = function (res) {
	return function (message) {
		return sendError (res, message);
	};
};
var resResults = function (res) {
	return function (messages) {
		return res.status (200).json (messages);
	};
};
// -------------------------------------------------------------------------
//
// return a list of this users' messages
//
// we are ignoring the ability for admin to view all users' messages for now
// as that should likely be in a different endpoint
//
// -------------------------------------------------------------------------
exports.list = function (req, res) {
	if (!req.user) return sendError (res, 'No user context supplied');
	query (Message, {user: req.user._id})
	.then (resResults (res))
	.catch (resError (res));
};
exports.listarchived = function (req, res) {
	if (!req.user) return sendError (res, 'No user context supplied');
	query (MessageArchive, {user: req.user._id})
	.then (resResults (res))
	.catch (resError (res));
};
// -------------------------------------------------------------------------
//
// count the number of messages for the curent user
//
// -------------------------------------------------------------------------
exports.mycount = function (req, res) {
	if (!req.user) return sendError (res, 'No user context supplied');
	count (Message, {user: req.user._id})
	.then (resResults (res))
	.catch (resError (res));
};
exports.myarchivedcount = function (req, res) {
	if (!req.user) return sendError (res, 'No user context supplied');
	count (MessageArchive, {user: req.user._id})
	.then (resResults (res))
	.catch (resError (res));
};
// -------------------------------------------------------------------------
//
// this gets called when the user views the message
//
// -------------------------------------------------------------------------
exports.viewed = function (req, res) {
	if (!req.user) return sendError (res, 'No user context supplied');
	if (req.user._id.toString () !== req.message.user.toString ()) return sendError (res, 'Not owner of message');
	req.message.dateViewed = Date.now ();
	saveMessage (req.message)
	.then (resResults (res))
	.catch (resError (res));
};
// -------------------------------------------------------------------------
//
// this gets called when the user actions the message
//
// -------------------------------------------------------------------------
exports.actioned = function (req, res) {
	if (!req.user) return sendError (res, 'No user context supplied');
	if (req.user._id.toString () !== req.message.user.toString ()) return sendError (res, 'Not owner of message');
	//
	// get the local domain, port, host, protocol info
	// this gets over a potential risk by disallowing any calls to outside APIs through this
	// mechanism
	//
	var domain = getDomain ();
	var options = getHostInfoFromDomain ({
		path : '/api/message/handler/action/'+req.params.action+'/user/'+req.user._id+req.message.link,
		method : 'GET'
	});
	helpers.getJSON (options)
	.then (function (data) {
		req.message.actionTaken  = req.params.action
		req.message.dateActioned = Date.now ();
		archiveMessage (req.message);
		return res.status (200).json (data);
	})
	.catch (function (data) {
		return res.status (299).send (data);
	})
};
// -------------------------------------------------------------------------
//
// a user purposely archives a given message
// do not worry about admin etc as that should be a seperate endpoint
//
// -------------------------------------------------------------------------
exports.archive = function (req, res) {
	if (!req.user) return sendError (res, 'No user context supplied');
	if (req.user._id.toString () !== req.message.user) return sendError (res, 'Not owner of message');
	archiveMessage (req.message)
	.then (resResults (res))
	.catch (resError (res));
};
// -------------------------------------------------------------------------
//
// a user purposely archives a given message
// do not worry about admin etc as that should be a seperate endpoint
//
// -------------------------------------------------------------------------
exports.archiveold = function (req, res) {
	if (!req.user) return sendError (res, 'No user context supplied');
	if (!~req.user.roles.indexOf ('admin')) return sendError (res, 'Only admin can auto archive');
	query (Message, { date2Archive: { $lte: Date.now () }})
	.then (archiveMessages)
	.then (resResults (res))
	.catch (resError (res));
};
// -------------------------------------------------------------------------
//
// send messages - called from the outside world somehow - for now limited
// to admin, but intended for the future ESB
// this does open the possibility of the admin sending legitimate system
// messages to users
//
// -------------------------------------------------------------------------
exports.send = function (req, res) {
	if (!~req.user.roles.indexOf ('admin')) return sendError (res, 'Only admin can send via REST');
	req.body.users = req.body.users || [];
	req.body.data  = req.body.data  || {};
	exports.sendMessages (req.params.messagecd, req.body.users, req.body.data)
	.then (resResults (res))
	.catch (resError (res));
};
// -------------------------------------------------------------------------
//
// retry sending failed emails
//
// -------------------------------------------------------------------------
exports.emailRetry = function (req, res) {
	if (!~req.user.roles.indexOf ('admin')) return sendError (res, 'Only admin can send via REST');
	query ({
		emailSent : false,
		emailRetries : { $lt : 3 }
	})
	.then (function (messages) {
		return Promise.all (messages.map (function (message) {
			return sendmail (message).then (saveMessage);
		}));
	})
	.then (function () { return {ok:true}; })
	.then (resResults (res))
	.catch (resError (res));
};
// =========================================================================
//
// Message Templates CRUD
//
// =========================================================================
exports.listTemplates = function (req, res) {
	MessageTemplate.find().sort({messageCd:1})
	.exec ()
	.then (resResults (res))
	.catch (resError (res));
};
exports.createTemplate = function (req, res) {
	var template = new MessageTemplate (req.body);
		template.save (function (err) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (template);
		}
	});
};
exports.updateTemplate = function (req, res) {
	//
	// copy over everything passed in. This will overwrite the
	// audit fields, but they get updated in the following step
	//
	var template = _.assign (req.template, req.body);
	//
	// save
	//
	template.save (function (err) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (template);
		}
	});

};
exports.removeTemplate = function (req, res) {
	var template = req.template;
	template.remove (function (err) {
		if (err) {
			return res.status (422).send ({
				message: errorHandler.getErrorMessage (err)
			});
		} else {
			res.json (template);
		}
	});

};

