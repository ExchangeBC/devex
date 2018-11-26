import * as handlebars from 'handlebars';
import { Document } from 'mongoose';

export interface IMessageAction {
	actionCd: string;
	linkTitleTemplate?: string;
	isDefault: boolean;
	linkTitle: string;
	linkResolver?: handlebars.TemplateDelegate<any>;
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
	actions: [IMessageAction],
	messageBody?: handlebars.TemplateDelegate<any>;
	messageShort?: handlebars.TemplateDelegate<any>;
	messageTitle?: handlebars.TemplateDelegate<any>;
	emailBody?: handlebars.TemplateDelegate<any>;
	emailSubject?: handlebars.TemplateDelegate<any>;
	link?: handlebars.TemplateDelegate<any>;
}
