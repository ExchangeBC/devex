'use strict';

import { Document, Model, Schema } from 'mongoose';
import MongooseController from '../../../../config/lib/MongooseController';
import { IMessageArchive } from '../../shared/IMessageDTO';

export interface IMessageArchiveModel extends IMessageArchive, Document {}
const MessageArchiveSchema = new Schema({
	messageCd: { type: String },
	user: { type: 'ObjectId', ref: 'User' },
	userEmail: { type: String },
	messageBody: { type: String },
	messageShort: { type: String },
	messageTitle: { type: String },
	emailBody: { type: String },
	emailSubject: { type: String },
	link: { type: String },
	actions: [
		{
			actionCd: { type: String },
			linkTitle: { type: String, default: '' },
			isDefault: { type: Boolean }
		}
	],
	emails: [
		{
			dateSent: { type: Date, default: null },
			isOk: { type: Boolean, default: false },
			error: {}
		}
	],
	emailSent: { type: Boolean, default: false },
	emailRetries: { type: Number, default: 0 },
	datePosted: { type: Date, default: null },
	date2Archive: { type: Date },
	dateArchived: { type: Date },
	dateViewed: { type: Date },
	dateActioned: { type: Date },
	actionTaken: { type: String },
	isArchived: { type: Boolean, default: true }
});

export const MessageArchiveModel: Model<IMessageArchiveModel> = MongooseController.mongoose.model<IMessageArchiveModel>('MessageArchive', MessageArchiveSchema);
