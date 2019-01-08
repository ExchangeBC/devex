import { TemplateDelegate } from 'handlebars';
import { Document } from 'mongoose';
import IMessageActionDocument from './IMessageActionDocument';

export default interface IMessageTemplateDocument extends Document {
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
	actions: [IMessageActionDocument];
	messageBody?: TemplateDelegate<any>;
	messageShort?: TemplateDelegate<any>;
	messageTitle?: TemplateDelegate<any>;
	emailBody?: TemplateDelegate<any>;
	emailSubject?: TemplateDelegate<any>;
	link?: TemplateDelegate<any>;
}
