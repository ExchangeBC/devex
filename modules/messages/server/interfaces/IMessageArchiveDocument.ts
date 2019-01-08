import { Document } from 'mongoose';
import IUserDocument from '../../../users/server/interfaces/IUserDocument';
import IMessageActionDocument from './IMessageActionDocument';
import IMessageEmailsDocument from './IMessageDocument';

export default interface IMessageArchiveDocument extends Document {
	messageCd: string;
	user: IUserDocument;
	userEmail: string;
	messageBody: string;
	messageShort: string;
	messageTitle: string;
	emailBody: string;
	emailSubject: string;
	link: string;
	actions: [IMessageActionDocument];
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
