import { Document } from 'mongoose';
import IUserDocument from '../../../users/server/interfaces/IUserDocument';

export default interface IProjectDocument extends Document {
	code: string;
	name: string;
	short: string;
	description: string;
	github: string;
	isPublished: boolean;
	wasPublished: boolean;
	created: Date;
	createdBy: IUserDocument;
	updated: Date;
	updatedBy: IUserDocument;
	program: any;
	user: IUserDocument;
	activity: number;
	tags: [string];
}
