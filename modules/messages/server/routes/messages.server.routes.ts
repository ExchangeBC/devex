'use strict';

// Routes for messages and the internal messaging system.
//
// Currently the messaging system is internal and uses internal bindings.
// this means that the routes are pretty sparse and mostly deal with
// configuring the system form outside.

import { model, Types } from 'mongoose';
import { MessagesController } from '../controllers/messages.server.controller';
import { MessagesPolicy } from '../policies/messages.server.policies';

export class MessagesRouter {
	private messagesController = new MessagesController();
	private messagesPolicy = new MessagesPolicy();

	public setupRoutes = app => {
		// Get a list/count of messages for the logged in user, either current or archived
		app.route('/api/messages')
			.all(this.messagesPolicy.isAllowed)
			.get(this.messagesController.list);

		app.route('/api/messages/count')
			.all(this.messagesPolicy.isAllowed)
			.get(this.messagesController.mycount);

		// Get a specific message for the logged in user
		app.route('/api/messages/:messageId')
			.all(this.messagesPolicy.isAllowed)
			.get((req, res) => {
				return res.json(req.message);
			})
			.delete(this.messagesController.archive);

		// Specific actions taken for a message by the user
		app.route('/api/messages/:messageId/viewed')
			.all(this.messagesPolicy.isAllowed)
			.put(this.messagesController.viewed);

		app.route('/api/messages/:messageId/action')
			.all(this.messagesPolicy.isAllowed)
			.put(this.messagesController.actioned);

		app.route('/api/messagestemplates')
			.all(this.messagesPolicy.isAllowed)
			.get(this.messagesController.listTemplates)
			.post(this.messagesController.createTemplate);

		app.route('/api/messagestemplates/:templateId')
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
