import { ICapability } from "../../capabilities/shared/ICapabilityDTO";
import { ICapabilitySkill } from "../../capabilities/shared/ICapabilitySkillDTO";
import { IUser } from "../../users/shared/IUserDTO";


export interface IOrg {
	_id: string;
	name: string;
	dba: string;
	address: string;
	address2: string;
	city: string;
	province: string;
	postalcode: string;
	businessNumber: string;
	businessJurisdiction: string;
	fullAddress: string;
	contactName: string;
	contactEmail: string;
	contactPhone: string;
	description: string;
	website: string;
	websiteProtocol?: string;
	websiteAddress?: string;
	orgImageURL: string;
	skills: string[];
	badges: string[];
	capabilities: ICapability[];
	capabilitySkills: ICapabilitySkill[];
	metRFQ: boolean;
	isCapable: boolean;
	isAcceptedTerms: boolean;
	owner: IUser;
	created: Date;
	createdBy: IUser;
	updated: Date;
	updatedBy: IUser;
	members: IUser[];
	admins: IUser[];
	invited: string[];
	invitedUsers: IUser[];
	invitedNonUsers: string[];
	emaillist?: {
		found: string[];
		notFound: string[];
	};
	additions?: string;
}
