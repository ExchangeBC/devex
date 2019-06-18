'use strict';

import { Document, Model, Schema } from 'mongoose';
import MongooseController from '../../../../config/lib/MongooseController';
import { IMessage } from '../../shared/IMessageDTO';

export interface IMessageModel extends IMessage, Document {
	_id: string;
}

export const MessageModel: Model<IMessageModel> = MongooseController.mongoose.model<IMessageModel>(
	'Message',
	new Schema({
		messageCd: { type: String, default: '' },
		messageLevel: { type: String, default: 'info', enum: ['info', 'request', 'alert'] },
		user: { type: 'ObjectId', default: null, ref: 'User' },
		userEmail: { type: String, default: '' },
		messageBody: { type: String, default: '' },
		messageShort: { type: String, default: '' },
		messageTitle: { type: String, default: '' },
		emailBody: { type: String, default: '' },
		emailSubject: { type: String, default: '' },
		link: { type: String, default: '' },
		actions: [
			{
				actionCd: { type: String, default: '' },
				linkTitle: { type: String, default: '' },
				isDefault: { type: Boolean, default: false }
			}
		],
		emails: [
			{
				dateSent: { type: Date, default: null },
				isOk: { type: Boolean, default: false },
				error: { type: Object, default: {} }
			}
		],
		emailSent: { type: Boolean, default: false },
		emailRetries: { type: Number, default: 0 },
		datePosted: { type: Date, default: null },
		date2Archive: { type: Date, default: null },
		dateArchived: { type: Date, default: null },
		dateViewed: { type: Date, default: null },
		dateActioned: { type: Date, default: null },
		actionTaken: { type: String, default: '' },
		isOpen: { type: Boolean, default: true }
	})
);
