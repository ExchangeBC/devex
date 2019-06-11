import { ICapability } from "../../capabilities/shared/ICapabilityDTO";
import { ICapabilitySkill } from "../../capabilities/shared/ICapabilitySkillDTO";
import { IProgram } from "../../programs/shared/IProgramDTO";
import { IProject } from "../../projects/shared/IProjectDTO";
import { IProposal } from "../../proposals/shared/IProposalDTO";
import { IUser } from "../../users/shared/IUserDTO";
import { Types } from "mongoose";

export interface IPhase {
	isImplementation?: boolean;
	isInception?: boolean;
	isPrototype?: boolean;
	team?: IUser[];
	capabilities?: ICapability[];
	capabilitiesCore?: ICapability[];
	capabilitySkills?: ICapabilitySkill[];
	cost?: number;
	maxCost?: number;
	endDate: Date;
	startDate: Date;
}

export interface IPhases {
	aggregate: IPhase;
	implementation: IPhase;
	inception: IPhase;
	proto: IPhase;
}

export interface ITeamQuestion {
	question: string;
	guideline: string;
	wordLimit: number;
	questionScore: number;
	showGuidance?: boolean;
	weight?: number;
}

export interface IAddendum {
	description: string;
	createdBy: IUser;
	createdOn: Date;
}

export interface IApproval {
	requestor: IUser;
	name: string;
	email: string;
	twoFAMethod: string;
	mobileNumber: string;
	initiated: Date;
	actioned: Date;
	state: string;
	action: string;
	routeCode: string;
	twoFACode: number;
	twoFASendCount: number;
	twoFAAttemptCount: number;
}

export interface IContract {
	managerName: string;
	managerEmail: string;
	businessArea: string;
	estimatedValue: number;
	estimatedTerm: number;
	contractType: string;
	stobType: string;
	stobBudget: number;
	stobExpenditures: number;
	summary: string;
	legallyRequired: boolean;
	staffResourceExplanation: string;
	impactNotApproved: string;
}

export interface IOpportunity {
    _id: string;
	code: string;
	opportunityTypeCd: string;
	name: string;
	description: string;
	background: string;
	github: string;
	views: number;
	program: IProgram;
	project: IProject;
	status: string;
	onsite: string;
	location: string;
	isPublished: boolean;
	wasPublished: boolean;
	lastPublished: Date;
	deadline: Date;
	created: Date;
	createdBy: IUser;
	updated: Date;
	updatedBy: IUser;
	issueUrl: string;
	issueNumber: string;
	assignment: Date;
	assignedAt: Date;
	proposal: IProposal;
	phases: IPhases;
	budget: number;
	isDocConflictOfInterest: boolean;
	isDocNonDisclosure: boolean;
	isDocRequestForReferences: boolean;
	terms: string;
	questions: string[];
	evaluationStage: number;
	numberOfInterviews: number;
	weights: any;
	watchers: IUser[];
	addenda: IAddendum[];
	teamQuestions: ITeamQuestion[];
	teamQuestionGradingType: any;
	intermediateApproval: IApproval;
	finalApproval: IApproval;
	contract: IContract;
	approvalRequired: boolean;
	isApproved: boolean;
	evaluation: string;
	criteria: string;
	skills: string[];
	earn?: number;
	start: Date;
	endDate: Date;
	assignor?: IUser;
	assignoremail?: string;
	proposalEmail?: string;
	userIs?: any;
	skilllist?: string;
	isWatching?: boolean;
}
