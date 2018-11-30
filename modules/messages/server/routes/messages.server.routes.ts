'use strict';

// Routes for messages and the internal messaging system.
//
// Currently the messaging system is internal and uses internal bindings.
// this means that the routes are pretty sparse and mostly deal with
// configuring the system form outside.

import { model, Types } from 'mongoose';
import { MessagesController } from '../controllers/messages.controller';
import { MessagesPolicy } from '../policies/messages.server.policies';

export class MessagesRouter {
	private messagesController = new MessagesController();
	private messagesPolicy = new MessagesPolicy();

	public setupRoutes = app => {
		// Get a list/count of messages for the logged in user, either current or archived
		app.route('/api/my/messages')
			.all(this.messagesPolicy.isAllowed)
			.get(this.messagesController.list);

		app.route('/api/my/archivedmessages')
			.all(this.messagesPolicy.isAllowed)
			.get(this.messagesController.listarchived);

		app.route('/api/my/messages/count')
			.all(this.messagesPolicy.isAllowed)
			.get(this.messagesController.mycount);

		app.route('/api/my/archivedmessages/count')
			.all(this.messagesPolicy.isAllowed)
			.get(this.messagesController.myarchivedcount);

		// Get a specific message or archived message for the logged in user
		app.route('/api/archivedmessages/:amessageId')
			.all(this.messagesPolicy.isAllowed)
			.get((req, res) => {
				return res.json(req.amessage);
			});

		app.route('/api/messages/:messageId')
			.all(this.messagesPolicy.isAllowed)
			.get((req, res) => {
				return res.json(req.message);
			})
			.delete(this.messagesController.archive);

		// Specific actions taken for a message by the user
		app.route('/api/messages/:messageId/viewed')
			.all(this.messagesPolicy.isAllowed)
			.get(this.messagesController.viewed);

		app.route('/api/messages/:messageId/actioned/:action')
			.all(this.messagesPolicy.isAllowed)
			.get(this.messagesController.actioned);

		// Routes for admins/scheduled tasks to archive old messages, retry failed emails
		app.route('/api/adminmessages/archiveold')
			.all(this.messagesPolicy.isAllowed)
			.get(this.messagesController.archiveold);

		app.route('/api/adminmessages/emailretry')
			.all(this.messagesPolicy.isAllowed)
			.get(this.messagesController.emailRetry);
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
		app.route('/api/messages/sendmessage/:messagecd')
			.all(this.messagesPolicy.isAllowed)
			.put(this.messagesController.send);

		app.route('/api/messagetemplates')
			.all(this.messagesPolicy.isAllowed)
			.get(this.messagesController.listTemplates)
			.post(this.messagesController.createTemplate);

		app.route('/api/messagetemplates/:templateId')
			.all(this.messagesPolicy.isAllowed)
			.get((req, res) => {
				return res.json(req.template);
			})
			.put(this.messagesController.updateTemplate)
			.delete(this.messagesController.removeTemplate);

		// Define route parameters
		app.param('messageId', (req, res, next, id) => {
			if (!Types.ObjectId.isValid(id)) {
				return res.status(400).send({ message: 'Invalid Message Id' });
			} else {
				model('Message')
					.findById(id)
					.exec((err, message) => {
						if (err) {
							return next(err);
						} else if (!message) {
							model('MessageArchive')
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
			if (!Types.ObjectId.isValid(id)) {
				return res.status(400).send({ message: 'Invalid Message Id' });
			} else {
				model('MessageArchive')
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

		app.param('templateId', (req, res, next, id) => {
			if (!Types.ObjectId.isValid(id)) {
				return res.status(400).send({ message: 'Invalid Message Template Id' });
			} else {
				model('MessageTemplate')
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
	};
}
