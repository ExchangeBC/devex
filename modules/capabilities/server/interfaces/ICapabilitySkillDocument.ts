import { Document } from 'mongoose';

export interface ICapabilitySkillDocument extends Document {
	code: string;
	name: string;
}
