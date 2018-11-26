import { Document } from 'mongoose';

export interface IMessageActionsDocument extends Document {
	actionCd: string;
	linkTitleTemplate: string;
	isDefault: boolean;
}

export interface IMessageTemplateDocument extends Document {
	messageCd: string;
	description: string;
	isSubscriptionType: boolean;
	messageBodyTemplate: string;
	messageShortTemplate: string;
	messageTitleTemplate: string;
	emailBodyTemplate: string;
	emailSubjectTemplate: string;
	modelsRequired: [string];
	daysToArchive: number;
	linkTemplate: string;
	actions: [IMessageActionsDocument]
}
