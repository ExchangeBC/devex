import { ICapabilitySkill } from "./ICapabilitySkillDTO";

export interface ICapability {
    _id: string;
	code: string;
	name: string;
	description: string;
	skills: ICapabilitySkill[];
	isRequired: boolean;
	isInception: boolean;
	isPrototype: boolean;
	isImplementation: boolean;
	labelClass: string;
	fullTime?: boolean;
}