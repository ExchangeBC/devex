import { Document } from 'mongoose';

export default interface IAttachmentDocument extends Document {
	name: string;
	path: string;
	type: string;
}
