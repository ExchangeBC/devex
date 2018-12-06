import ICapabilityDocument from '../../../capabilities/server/interfaces/ICapabilityDocument';
import ICapabilitySkillDocument from '../../../capabilities/server/interfaces/ICapabilitySkillDocument';
import IUserDocument from '../../../users/server/interfaces/IUserDocument';

export default interface IPhaseDocument extends Document {
	isImplementation: boolean;
	isInception: boolean;
	isPrototype: boolean;
	team: [IUserDocument];
	capabilities: [ICapabilityDocument];
	capabilitySkills: [ICapabilitySkillDocument];
	cost: number;
}
