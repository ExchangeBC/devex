import { Document } from 'mongoose';
import IUserDocument from '../../../users/server/interfaces/IUserDocument';

export default interface IProgramDocument extends Document {
	code: string;
	title: string;
	short: string;
	description: string;
	owner: string;
	website: string;
	logo: string;
	tags: string[];
	isPublished: boolean;
	created: Date;
	createdBy: IUserDocument;
	updated: Date;
	updatedBy: IUserDocument;
}
