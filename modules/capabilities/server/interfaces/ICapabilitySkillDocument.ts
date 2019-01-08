import { Document } from 'mongoose';

export default interface ICapabilitySkillDocument extends Document {
	code: string;
	name: string;
}
