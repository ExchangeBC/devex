import { Document, Schema } from 'mongoose';
import IOpportunityDocument from '../../../opportunities/server/interfaces/IOpportunityDocument';
import IOrgDocument from '../../../orgs/server/interfaces/IOrgDocument';
import IUserDocument from '../../../users/server/interfaces/IUserDocument';
import IAttachmentDocument from '../interfaces/IAttachmentDocument';
import IPhasesDocument from './IPhasesDocument';

interface ITeamQuestionResponse {
	question: string;
	response: string;
	rank: number;
	rejected: boolean;
	score: number;
	displayInSummary?: boolean
}

export default interface IProposalDocument extends Document {
	summary: string;
	detail: string;
	opportunity: IOpportunityDocument;
	status: string;
	isAssigned: boolean;
	isCompany: boolean;
	businessName: string;
	businessAddress: string;
	businessContactName: string;
	businessContactEmail: string;
	businessContactPhone: string;
	created: Date;
	createdBy: IUserDocument;
	updated: Date;
	updatedBy: IUserDocument;
	isAcceptedTerms: boolean;
	user: IUserDocument;
	org: IOrgDocument;
	phases: IPhasesDocument;
	questions: object;
	attachments: IAttachmentDocument[];
	interviewComplete: boolean;
	scores: object;
	ranking: number;
	screenedIn: boolean;
	passedCodeChallenge: boolean;
	addendums: object;
	teamQuestionResponses: ITeamQuestionResponse[];
	team?: IUserDocument[];
}
