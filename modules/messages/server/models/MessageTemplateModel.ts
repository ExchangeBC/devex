'use strict';

import { Document, model, Model, Schema } from 'mongoose';
import { IMessageTemplate } from '../../shared/IMessageDTO';

export interface IMessageTemplateModel extends IMessageTemplate, Document {}

const MessageTemplateSchema = new Schema({
	messageCd: { type: String, default: '', unique: true },
	description: { type: String, default: '' },
	isSubscriptionType: { type: Boolean, default: false },
	messageBodyTemplate: { type: String, default: '' },
	messageShortTemplate: { type: String, default: '' },
	messageTitleTemplate: { type: String, default: '' },
	emailBodyTemplate: { type: String, default: '' },
	emailSubjectTemplate: { type: String, default: '' },
	modelsRequired: { type: [String], default: [] },
	daysToArchive: { type: Number, default: 14 },
	linkTemplate: { type: String, default: '' },
	actions: [
		{
			actionCd: { type: String, default: '' },
			linkTitleTemplate: { type: String, default: '' },
			isDefault: { type: Boolean, default: false }
		}
	]
});

export const MessageTemplateModel: Model<IMessageTemplateModel> = model<IMessageTemplateModel>('MessageTemplate', MessageTemplateSchema);
