import { IOpportunity, IPhases } from "../../opportunities/shared/IOpportunityDTO";
import { IOrg } from "../../orgs/shared/IOrgDTO";
import { IUser } from "../../users/shared/IUserDTO";

interface ITeamQuestionResponse {
	question: string;
	response: string;
	rank: number;
	rejected: boolean;
	score: number;
	displayInSummary?: boolean
}

export interface IAttachment {
	name: string;
	path: string;
	type: string;
}

export interface IProposal {
    _id: string;
	summary: string;
	detail: string;
	opportunity: IOpportunity;
	status: string;
	isAssigned: boolean;
	isCompany: boolean;
	businessName: string;
	businessAddress: string;
	businessContactName: string;
	businessContactEmail: string;
	businessContactPhone: string;
	created: Date;
	createdBy: IUser;
	updated: Date;
	updatedBy: IUser;
	isAcceptedTerms: boolean;
	user: IUser;
	org: IOrg;
	phases: IPhases;
	questions: object;
	attachments: IAttachment[];
	interviewComplete: boolean;
	scores: object;
	ranking: number;
	screenedIn: boolean;
	passedCodeChallenge: boolean;
	addendums: object;
	teamQuestionResponses: ITeamQuestionResponse[];
	team?: IUser[];
}