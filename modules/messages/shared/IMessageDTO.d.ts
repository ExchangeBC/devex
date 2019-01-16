import { IUser } from "../../users/shared/IUserDTO";
import { TemplateDelegate } from "handlebars";

export interface IMessage {
	_id: string;
	messageCd: string;
	messageLevel: string;
	user: IUser;
	userEmail: string;
	messageBody: string;
	messageShort: string;
	messageTitle: string;
	emailBody: string;
	emailSubject: string;
	link: string;
	actions: IMessageAction[];
	emails: IMessageEmails[];
	emailSent: boolean;
	emailRetries: number;
	datePosted: Date;
	date2Archive: Date;
	dateArchived: Date;
	dateViewed: Date;
	dateActioned: Date;
	actionTaken: string;
	isOpen: boolean;
}

export interface IMessageAction {
	actionCd: string;
	linkTitleTemplate?: string;
	isDefault: boolean;
	linkTitle: string;
	linkResolver?: TemplateDelegate<any>;
}

export interface IMessageArchive {
	messageCd: string;
	user: IUser;
	userEmail: string;
	messageBody: string;
	messageShort: string;
	messageTitle: string;
	emailBody: string;
	emailSubject: string;
	link: string;
	actions: IMessageAction[];
	email: IMessageEmails[];
	emailSent: boolean;
	emailRetries: number;
	datePosted: Date;
	date2Archive: Date;
	dateArchived: Date;
	dateViewed: Date;
	dateActioned: Date;
	actionTaken: string;
	isArchived: boolean;
}

export interface IMessageEmails {
	dateSent: Date;
	isOk: boolean;
	error: any;
}

export interface IMessageTemplate {
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
	actions: IMessageAction[];
	messageBody?: TemplateDelegate<any>;
	messageShort?: TemplateDelegate<any>;
	messageTitle?: TemplateDelegate<any>;
	emailBody?: TemplateDelegate<any>;
	emailSubject?: TemplateDelegate<any>;
	link?: TemplateDelegate<any>;
}

export interface IMessageCountResponse {
	count: number;
}