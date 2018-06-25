'use strict';
// =========================================================================
//
// routes for messages and the internal messaging system.
//
// currently the messaging system is internal and uses internal bindings.
// this means that the routes are pretty sparse and mostly deal with
// configuring the system form outside.
//
// FUTURE:
// in the future the system should be
// accessed through a rest API and dealt with as a standalone module with
// its own set of data - regalrdless of whether or not it shares a
// database
//
// =========================================================================
var messages = require ('../controllers/messages.controller');
var mongoose  = require ('mongoose');
// -------------------------------------------------------------------------
//
// check that the user has the allowed role
//
// -------------------------------------------------------------------------
var isAllowed = function (allowedRole) {
	return function (req, res, next) {
		// console.log (req.user);
		var roles = (req.user) ? req.user.roles : ['guest'];
		if (!!~roles.indexOf (allowedRole)) return next ();
		else return res.status (403).json ({message: 'User is not authorized'});
	};
};

module.exports = function (app) {
	// -------------------------------------------------------------------------
	//
	// message id parameter stuff
	//
	// -------------------------------------------------------------------------
	app.param('messageId', function (req, res, next, id) {
		if (!mongoose.Types.ObjectId.isValid (id)) return res.status (400).send ({message: 'Invalid Message Id'});
		else {
			mongoose.model ('Message').findById (id).exec (function (err, message) {
				if (err) {
					return next (err);
				}
				else if (!message) {
					mongoose.model ('MessageArchive').findById (id).exec(function (err, message) {
						if (err) {
							return next (err);
						}
						else if (!message) {
							return res.status (400).send ({message: 'Message not found'});
						}
						else {
							req.message = message;
							next ();
						}
					});
				}
				else {
					req.message = message;
					next ();
				}
			});
		}
	});
	app.param('amessageId', function (req, res, next, id) {
		if (!mongoose.Types.ObjectId.isValid (id)) return res.status (400).send ({message: 'Invalid Message Id'});
		else {
			require ('mongoose').model ('MessageArchive').findById (id).exec (function (err, message) {
				if (err) return next (err);
				else if (!message) return res.status (400).send ({message: 'Message not found'});
				else {
					req.amessage = message;
					next ();
				}
			});
		}
	});
	// -------------------------------------------------------------------------
	//
	// get a list of messages for the logged in user, either current or archived
	//
	// -------------------------------------------------------------------------
	app.route('/api/my/messages').get (isAllowed ('user'), messages.list);
	app.route('/api/my/archivedmessages').get (isAllowed ('user'), messages.listarchived);
	app.route('/api/my/messages/count').get (isAllowed ('user'), messages.mycount);
	app.route('/api/my/archivedmessages/count').get (isAllowed ('user'), messages.myarchivedcount);
	// -------------------------------------------------------------------------
	//
	// for the logged in user,
	// get a spcific message
	// archive a message
	//
	// -------------------------------------------------------------------------
	app.route('/api/archivedmessages/:amessageId').get (isAllowed ('user'), function (req, res) { return res.json (req.amessage); });
	app.route('/api/messages/:messageId')
		.all (isAllowed ('user'))
		.get (function (req, res) { return res.json (req.message); })
		.delete (messages.archive);
	// -------------------------------------------------------------------------
	//
	// specific actions taken for a message by the user
	//
	// -------------------------------------------------------------------------
	app.route('/api/messages/:messageId/viewed').get (isAllowed ('user'), messages.viewed);
	app.route('/api/messages/:messageId/actioned/:action').get (isAllowed ('user'), messages.actioned);
	// -------------------------------------------------------------------------
	//
	// maintenance routes
	// these will likely be run as admin and by a scheduler to auto-archive
	// old messages and to retry sending failed emails
	//
	// -------------------------------------------------------------------------
	app.route('/api/adminmessages/archiveold').get (isAllowed ('admin'), messages.archiveold);
	app.route('/api/adminmessages/emailretry').get (isAllowed ('admin'), messages.emailRetry);
	// -------------------------------------------------------------------------
	//
	// external call to send messages - this will ONLY be used when the message
	// module is running as its own standalone service - this is what an ESB
	// would call. Since a bus would likely be thinking in terms of events, we
	// will make the messageCd the main thing on the URL and have the payload
	// be the body. The payload would take the form:
	//
	// {
	// 		users: [userid, userid, ... userid]
	// 		data: {}
	// }
	//
	// where users is an array of userids and data is whatever supporting data
	// is required for the message.
	//
	// -------------------------------------------------------------------------
	app.route('/api/messages/sendmessage/:messagecd').put (isAllowed ('admin'), messages.send);
	// =========================================================================
	//
	// Templates
	//
	// =========================================================================
	app.param('templateId', function (req, res, next, id) {
		if (!mongoose.Types.ObjectId.isValid (id)) return res.status (400).send ({message: 'Invalid Message Template Id'});
		else {
			require ('mongoose').model ('MessageTemplate').findById (id).exec (function (err, template) {
				if (err) return next (err);
				else if (!template) return res.status (400).send ({message: 'Message not found'});
				else {
					req.template = template;
					next ();
				}
			});
		}
	});
	app.route('/api/messagetemplates')
		.all (isAllowed ('admin'))
		.get (messages.listTemplates)
		.post (messages.createTemplate);
	app.route('/api/messagetemplates/:templateId')
		.all (isAllowed ('admin'))
		.get (function (req, res) { return res.json (req.template); })
		.put (messages.updateTemplate)
		.delete (messages.removeTemplate);

};
