import { Document } from 'mongoose';

export interface IAttachmentDocument extends Document {
	name: string;
	path: string;
	type: string;
}
