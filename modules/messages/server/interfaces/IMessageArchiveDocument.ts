import { Document } from 'mongoose';
import { IUserDocument } from '../../../users/server/interfaces/IUserDocument';
import { IMessageEmailsDocument } from './IMessageDocument';
import { IMessageAction } from './IMessageTemplateDocument';

export interface IMessageArchiveDocument extends Document {
	messageCd: string;
	user: IUserDocument;
	userEmail: string;
	messageBody: string;
	messageShort: string;
	messageTitle: string;
	emailBody: string;
	emailSubject: string;
	link: string;
	actions: [IMessageAction];
	email: [IMessageEmailsDocument];
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
