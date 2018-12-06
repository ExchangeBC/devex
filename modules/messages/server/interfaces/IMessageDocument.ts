import { Document } from 'mongoose';
import IUserDocument from '../../../users/server/interfaces/IUserDocument';
import IMessageActionDocument from './IMessageActionDocument';
import IMessageEmailsDocument from './IMessageEmailsDocument';

export default interface IMessageDocument extends Document {
	messageCd: string;
	messageLevel: string;
	user: IUserDocument;
	userEmail: string;
	messageBody: string;
	messageShort: string;
	messageTitle: string;
	emailBody: string;
	emailSubject: string;
	link: string;
	actions: [IMessageActionDocument];
	emails: [IMessageEmailsDocument];
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
