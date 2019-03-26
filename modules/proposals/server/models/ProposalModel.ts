'use strict';

import { Document, Model, Schema } from 'mongoose';
import MongooseController from '../../../../config/lib/MongooseController';
import { IOpportunityModel } from '../../../opportunities/server/models/OpportunityModel';
import { IUserModel } from '../../../users/server/models/UserModel';
import { IAttachment, IProposal } from '../../shared/IProposalDTO';

export interface IAttachmentModel extends IAttachment, Document {}
export interface IProposalModel extends IProposal, Document {
	_id: any;
	attachments: IAttachmentModel[];
	opportunity: IOpportunityModel;
	user: IUserModel;
}

const AttachmentSchema = new Schema({
	name: { type: String },
	path: { type: String },
	type: { type: String }
});

const QuestionSchema = new Schema({
	question: { type: String },
	response: { type: String },
	rank: { type: Number, default: 0 },
	rejected: { type: Boolean, default: false }
});

const AddendumSchema = new Schema({
	description: { type: String },
	createdBy: { type: 'ObjectId', ref: 'User', default: null },
	created: { type: Date, default: null }
});

const TeamQuestionResponseSchema = new Schema({
	question: { type: String },
	response: { type: String },
	rank: { type: Number, default: 0 },
	rejected: { type: Boolean, default: false },
	score: { type: Number, default: 0 }
});

const PhaseSchema = new Schema({
	isImplementation: { type: Boolean, default: false },
	isInception: { type: Boolean, default: false },
	isPrototype: { type: Boolean, default: false },
	team: {
		type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
		default: []
	},
	cost: { type: Number, default: 0 }
});

const PhasesSchema = new Schema({
	aggregate: { type: PhaseSchema, default: {} },
	implementation: { type: PhaseSchema, default: {} },
	inception: { type: PhaseSchema, default: {} },
	proto: { type: PhaseSchema, default: {} }
});

const ProposalSchema = new Schema(
	{
		summary: { type: String },
		detail: { type: String },
		opportunity: {
			type: Schema.Types.ObjectId,
			ref: 'Opportunity',
			required: 'Opportunity is missing',
			index: true
		},
		status: {
			type: String,
			default: 'New',
			enum: ['New', 'Draft', 'Submitted', 'Reviewed', 'Assigned']
		},
		isAssigned: { type: Boolean, default: false },
		isCompany: { type: Boolean, default: false },
		businessName: { type: String, default: '' },
		businessAddress: { type: String, default: '' },
		businessContactName: { type: String, default: '' },
		businessContactEmail: {
			type: String,
			default: '',
			trim: true,
			lowercase: true
		},
		businessContactPhone: { type: String, default: '' },
		created: { type: Date, default: null },
		createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
		updated: { type: Date, default: null },
		updatedBy: { type: 'ObjectId', ref: 'User', default: null },
		isAcceptedTerms: { type: Boolean, default: false },
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: 'Please select a user',
			index: true
		},
		org: { type: Schema.Types.ObjectId, ref: 'Org', index: true },
		phases: { type: PhasesSchema, default: {} },
		questions: { type: [QuestionSchema], default: [] },
		attachments: { type: [AttachmentSchema], default: [] },
		interviewComplete: { type: Boolean, default: false },
		scores: {
			skill: { type: Number, default: 0 },
			question: { type: Number, default: 0 },
			codechallenge: { type: Number, default: 0 },
			interview: { type: Number, default: 0 },
			price: { type: Number, default: 0 },
			total: { type: Number, default: 0 }
		},
		ranking: { type: Number, default: 0 },
		screenedIn: { type: Boolean, default: false },
		passedCodeChallenge: { type: Boolean, default: false },
		addendums: { type: [AddendumSchema], default: [] },
		teamQuestionResponses: {
			type: [TeamQuestionResponseSchema],
			default: []
		}
	},
	{ usePushEach: true }
);

export const ProposalModel: Model<IProposalModel> = MongooseController.mongoose.model<IProposalModel>('Proposal', ProposalSchema);
export const AttachmentModel: Model<IAttachmentModel> = MongooseController.mongoose.model<IAttachmentModel>('Attachment', AttachmentSchema);
