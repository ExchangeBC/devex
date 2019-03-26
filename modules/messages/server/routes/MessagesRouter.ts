'use strict';

// Routes for messages and the internal messaging system.
//
// Currently the messaging system is internal and uses internal bindings.
// this means that the routes are pretty sparse and mostly deal with
// configuring the system form outside.

import express from 'express';
import { Types } from 'mongoose';
import MongooseController from '../../../../config/lib/MongooseController';
import MessagesServerController from '../controllers/MessagesServerController';
import { IMessageModel } from '../models/MessageModel';
import { IMessageTemplateModel } from '../models/MessageTemplateModel';
import MessagesPolicy from '../policies/MessagesPolicy';

class MessagesRouter {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: MessagesRouter;

	private constructor() {
		MessagesPolicy.invokeRolesPolicies();
	}

	public setupRoutes(app: express.Application): void {
		// Get a list/count of messages for the logged in user, either current or archived
		app.route('/api/messages')
			.all(MessagesPolicy.isAllowed)
			.get(MessagesServerController.list);

		app.route('/api/messages/count')
			.all(MessagesPolicy.isAllowed)
			.get(MessagesServerController.mycount);

		// Get a specific message for the logged in user
		app.route('/api/messages/:messageId')
			.all(MessagesPolicy.isAllowed)
			.get((req, res) => {
				return res.json(req.message);
			});

		// Specific actions taken for a message by the user
		app.route('/api/messages/:messageId/action')
			.all(MessagesPolicy.isAllowed)
			.put(MessagesServerController.actioned);

		// Define route parameters
		app.param('messageId', (req, res, next, id) => {
			if (!Types.ObjectId.isValid(id)) {
				return res.status(400).send({ message: 'Invalid Message Id' });
			} else {
				MongooseController.mongoose.model('Message')
					.findById(id)
					.exec((err, message) => {
						if (err) {
							return next(err);
						} else if (!message) {
							MongooseController.mongoose.model('MessageArchive')
								.findById(id)
								.exec((findErr, findMsg) => {
									if (findErr) {
										return next(findErr);
									} else if (!findMsg) {
										return res.status(400).send({ message: 'Message not found' });
									} else {
										req.message = findMsg as IMessageModel;
										next();
									}
								});
						} else {
							req.message = message as IMessageModel;
							next();
						}
					});
			}
		});

		app.param('templateId', (req, res, next, id) => {
			if (!Types.ObjectId.isValid(id)) {
				return res.status(400).send({ message: 'Invalid Message Template Id' });
			} else {
				MongooseController.mongoose.model('MessageTemplate')
					.findById(id)
					.exec((err, template) => {
						if (err) {
							return next(err);
						} else if (!template) {
							return res.status(400).send({ message: 'Message not found' });
						} else {
							req.template = template as IMessageTemplateModel;
							next();
						}
					});
			}
		});
	}
}

export default MessagesRouter.getInstance();
