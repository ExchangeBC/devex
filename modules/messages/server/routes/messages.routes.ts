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
import * as mongoose from 'mongoose';
import { MessagesController } from '../controllers/messages.controller';

export class MessagesRouter {
	private messagesController = new MessagesController();

	public setupRoutes = app => {
		// -------------------------------------------------------------------------
		//
		// message id parameter stuff
		//
		// -------------------------------------------------------------------------
		app.param('messageId', (req, res, next, id) => {
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).send({ message: 'Invalid Message Id' });
			} else {
				mongoose
					.model('Message')
					.findById(id)
					.exec((err, message) => {
						if (err) {
							return next(err);
						} else if (!message) {
							mongoose
								.model('MessageArchive')
								.findById(id)
								.exec((findErr, findMsg) => {
									if (findErr) {
										return next(findErr);
									} else if (!findMsg) {
										return res.status(400).send({ message: 'Message not found' });
									} else {
										req.message = findMsg;
										next();
									}
								});
						} else {
							req.message = message;
							next();
						}
					});
			}
		});
		app.param('amessageId', (req, res, next, id) => {
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).send({ message: 'Invalid Message Id' });
			} else {
				require('mongoose')
					.model('MessageArchive')
					.findById(id)
					.exec((err, message) => {
						if (err) {
							return next(err);
						} else if (!message) {
							return res.status(400).send({ message: 'Message not found' });
						} else {
							req.amessage = message;
							next();
						}
					});
			}
		});
		// -------------------------------------------------------------------------
		//
		// get a list of messages for the logged in user, either current or archived
		//
		// -------------------------------------------------------------------------
		app.route('/api/my/messages').get(this.isAllowed('user'), this.messagesController.list);
		app.route('/api/my/archivedmessages').get(this.isAllowed('user'), this.messagesController.listarchived);
		app.route('/api/my/messages/count').get(this.isAllowed('user'), this.messagesController.mycount);
		app.route('/api/my/archivedmessages/count').get(this.isAllowed('user'), this.messagesController.myarchivedcount);
		// -------------------------------------------------------------------------
		//
		// for the logged in user,
		// get a spcific message
		// archive a message
		//
		// -------------------------------------------------------------------------
		app.route('/api/archivedmessages/:amessageId').get(this.isAllowed('user'), (req, res) => {
			return res.json(req.amessage);
		});
		app.route('/api/messages/:messageId')
			.all(this.isAllowed('user'))
			.get((req, res) => {
				return res.json(req.message);
			})
			.delete(this.messagesController.archive);
		// -------------------------------------------------------------------------
		//
		// specific actions taken for a message by the user
		//
		// -------------------------------------------------------------------------
		app.route('/api/messages/:messageId/viewed').get(this.isAllowed('user'), this.messagesController.viewed);
		app.route('/api/messages/:messageId/actioned/:action').get(this.isAllowed('user'), this.messagesController.actioned);
		// -------------------------------------------------------------------------
		//
		// maintenance routes
		// these will likely be run as admin and by a scheduler to auto-archive
		// old messages and to retry sending failed emails
		//
		// -------------------------------------------------------------------------
		app.route('/api/adminmessages/archiveold').get(this.isAllowed('admin'), this.messagesController.archiveold);
		app.route('/api/adminmessages/emailretry').get(this.isAllowed('admin'), this.messagesController.emailRetry);
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
		app.route('/api/messages/sendmessage/:messagecd').put(this.isAllowed('admin'), this.messagesController.send);
		// =========================================================================
		//
		// Templates
		//
		// =========================================================================
		app.param('templateId', (req, res, next, id) => {
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).send({ message: 'Invalid Message Template Id' });
			} else {
				require('mongoose')
					.model('MessageTemplate')
					.findById(id)
					.exec((err, template) => {
						if (err) {
							return next(err);
						} else if (!template) {
							return res.status(400).send({ message: 'Message not found' });
						} else {
							req.template = template;
							next();
						}
					});
			}
		});
		app.route('/api/messagetemplates')
			.all(this.isAllowed('admin'))
			.get(this.messagesController.listTemplates)
			.post(this.messagesController.createTemplate);
		app.route('/api/messagetemplates/:templateId')
			.all(this.isAllowed('admin'))
			.get((req, res) => {
				return res.json(req.template);
			})
			.put(this.messagesController.updateTemplate)
			.delete(this.messagesController.removeTemplate);
	};

	// -------------------------------------------------------------------------
	//
	// check that the user has the allowed role
	//
	// -------------------------------------------------------------------------
	private isAllowed = allowedRole => {
		return (req, res, next) => {
			const roles = req.user ? req.user.roles : ['guest'];
			if (roles.indexOf(allowedRole) !== -1) {
				return next();
			} else {
				return res.status(403).json({ message: 'User is not authorized' });
			}
		};
	};
}
