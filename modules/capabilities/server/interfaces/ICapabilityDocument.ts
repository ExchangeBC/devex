import { Document } from 'mongoose';

export default interface ICapabilityDocument extends Document {
	code: string;
	name: string;
	description: string;
	skills: [object];
	isRequired: boolean;
	isInception: boolean;
	isPrototype: boolean;
	isImplementation: boolean;
	labelClass: string;
	fullTime?: boolean;
}
