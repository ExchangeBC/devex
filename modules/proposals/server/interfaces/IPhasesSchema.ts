import { Document } from 'mongoose';
import { ICapabilityDocument } from '../../../capabilities/server/interfaces/ICapabilityDocument';
import { ICapabilitySkillDocument } from '../../../capabilities/server/interfaces/ICapabilitySkillDocument';
import { IUserDocument } from '../../../users/server/interfaces/IUserDocument';

export interface IPhaseDocument extends Document {
	isImplementation: boolean;
	isInception: boolean;
	isPrototype: boolean;
	team: [IUserDocument];
	capabilities: [ICapabilityDocument];
	capabilitySkills: [ICapabilitySkillDocument];
	cost: number;
}

export interface IPhasesDocument extends Document {
	aggregate: IPhaseDocument;
	implementation: IPhaseDocument;
	inception: IPhaseDocument;
	proto: IPhaseDocument;
}
