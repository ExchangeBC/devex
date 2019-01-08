'use strict';

import { model, Model, Schema } from 'mongoose';
import IMessageArchiveDocument from '../interfaces/IMessageArchiveDocument';

interface IMessageArchiveModel extends Model<IMessageArchiveDocument> {}
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

const MessageArchiveModel: IMessageArchiveModel = model<IMessageArchiveDocument, IMessageArchiveModel>('MessageArchive', MessageArchiveSchema);

export default MessageArchiveModel;
