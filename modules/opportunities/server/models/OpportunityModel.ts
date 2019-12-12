'use strict';

import { Document, Model, Schema } from 'mongoose';
import MongooseController from '../../../../config/lib/MongooseController';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import { IOpportunity } from '../../shared/IOpportunityDTO';

export interface IOpportunityModel extends IOpportunity, Document {
	_id: any;
	findUniqueCode(title: string, suffix: string, callback: any): string;
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Opportunity addendum schema
const AddendumSchema = new Schema({
	description: { type: String },
	createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
	createdOn: { type: Date, default: null }
});

// Opportunity team question schema
const TeamQuestionSchema = new Schema({
	question: { type: String },
	guideline: { type: String },
	wordLimit: { type: Number, default: 300 },
	questionScore: { type: Number, default: 1 }
});

// Approval authority schema
const ApprovalSchema = new Schema({
	requestor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
	name: { type: String, default: '' },
	email: { type: String, default: '' },
	twoFAMethod: { type: String, default: 'email', enum: ['email', 'sms'] },
	mobileNumber: { type: String, default: '' },
	initiated: { type: Date, default: null },
	actioned: { type: Date, default: null },
	state: {
		type: String,
		default: 'draft',
		enum: ['draft', 'ready-to-send', 'sent', 'actioned']
	},
	action: {
		type: String,
		default: 'pending',
		enum: ['pending', 'approved', 'denied']
	},
	routeCode: { type: String, default: '' },
	twoFACode: { type: Number, default: 0 },
	twoFASendCount: { type: Number, default: 0 },
	twoFAAttemptCount: { type: Number, default: 0 }
});

const ContractSchema = new Schema({
	managerName: { type: String, default: '' },
	managerEmail: { type: String, default: '' },
	businessArea: { type: String, default: '' },
	estimatedValue: { type: Number, default: 0 },
	estimatedTerm: { type: Number, default: 0 },
	contractType: {
		type: String,
		default: 'new',
		enum: ['new', 'renewal', 'amendment']
	},
	stobType: {
		type: String,
		default: '6001/02',
		enum: ['6001/02', '6003/04', '6020/21', '6302', '6309']
	},
	stobBudget: { type: Number, default: 0 },
	stobExpenditures: { type: Number, default: 0 },
	summary: { type: String, default: '' },
	legallyRequired: { type: Boolean, default: false },
	staffResourceExplanation: { type: String, default: '' },
	impactNotApproved: { type: String, default: '' }
});

const PhaseSchema = new Schema({
	isImplementation: { type: Boolean, default: false },
	isInception: { type: Boolean, default: false },
	isPrototype: { type: Boolean, default: false },
	team: {
		type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
		default: []
	},
	capabilities: {
		type: [{ type: Schema.Types.ObjectId, ref: 'Capability' }],
		default: []
	},
	capabilitiesCore: {
		type: [{ type: Schema.Types.ObjectId, ref: 'Capability' }],
		default: []
	},
	capabilitySkills: {
		type: [{ type: Schema.Types.ObjectId, ref: 'CapabilitySkill' }],
		default: []
	},
	contract: { type: String, default: '' },
	endDate: { type: Date, default: Date.now },
	startDate: { type: Date, default: Date.now },
	target: { type: Number, default: 0 },
	maxCost: { type: Number, default: 0 }
},
{
	minimize: false
})

const PhasesSchema = new Schema({
	aggregate: { type: PhaseSchema, default: () => ({}) },
	implementation: { type: PhaseSchema, default: () => ({}) },
	inception: { type: PhaseSchema, default: () => ({}) },
	proto: { type: PhaseSchema, default: () => ({}) }
},
{
	minimize: false
});

// Opportunity schema
const OpportunitySchema: Schema = new Schema(
	{
		code: { type: String, default: '' },
		opportunityTypeCd: {
			type: String,
			default: 'code-with-us',
			enum: ['code-with-us', 'sprint-with-us']
		},
		name: { type: String, default: '', required: 'Name cannot be blank' },
		short: { type: String, default: '' },
		description: { type: String, default: '' },
		background: { type: String, default: '' },
		github: { type: String, default: '' },
		views: { type: Number, default: 1 },
		program: {
			type: Schema.Types.ObjectId,
			ref: 'Program',
			default: null,
			required: 'Program cannot be blank'
		},
		project: {
			type: Schema.Types.ObjectId,
			ref: 'Project',
			default: null,
			required: 'Project cannot be blank'
		},
		status: {
			type: String,
			default: 'Pending',
			enum: ['Pending', 'Assigned', 'In Progress', 'Completed']
		},
		onsite: {
			type: String,
			default: 'mixed',
			enum: ['mixed', 'onsite', 'offsite']
		},
		location: { type: String, default: '' },
		isPublished: { type: Boolean, default: false },
		wasPublished: { type: Boolean, default: false },
		lastPublished: { type: Date, default: Date.now },
		deadline: { type: Date, default: Date.now },
		created: { type: Date, default: Date.now },
		createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
		updated: { type: Date, default: null },
		updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
		issueUrl: { type: String, default: '' },
		issueNumber: { type: String, default: '' },
		assignment: { type: Date, default: Date.now },
		assignedAt: { type: Date, default: null },
		proposalEmail: { type: String, default: '' },
		evaluation: { type: String, default: '' },
		criteria: { type: String, default: '' },
		skills: { type: [String], default: [] },
		earn: { type: Number, default: 0 },
		start: { type: Date, default: Date.now },
		endDate: { type: Date, default: Date.now },
		assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
		proposal: { type: Schema.Types.ObjectId, ref: 'Proposal', default: null },
		phases: { type: PhasesSchema, default: () => ({}) },
		budget: { type: Number, default: 0 },
		isDocConflictOfInterest: { type: Boolean, default: false },
		isDocNonDisclosure: { type: Boolean, default: false },
		isDocRequestForReferences: { type: Boolean, default: false },
		terms: { type: String, default: '' },
		questions: { type: [String], default: [] },
		//
		// 0 = not started
		// 1 = questions
		// 2 = interview
		// 3 = price
		// 4 = assigned
		//
		evaluationStage: { type: Number, default: 0 },
		numberOfInterviews: { type: Number, default: 4 },
		weights: {
			codechallenge: { type: Number, default: 0.35 },
			skill: { type: Number, default: 0.05 },
			question: { type: Number, default: 0.25 },
			interview: { type: Number, default: 0.25 },
			price: { type: Number, default: 0.1 }
		},
		watchers: {
			type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
			default: []
		},
		addenda: { type: [AddendumSchema], default: [] },
		teamQuestions: { type: [TeamQuestionSchema], default: [] },
		teamQuestionGradingType: {
			type: String,
			default: 'Linear',
			enum: ['Linear', 'Weighted']
		},
		intermediateApproval: { type: ApprovalSchema, default: () => ({}) },
		finalApproval: { type: ApprovalSchema, default: () => ({}) },
		contract: { type: ContractSchema, default: () => ({}) },
		approvalRequired: { type: Boolean, default: false },
		isApproved: { type: Boolean, default: false }
	},
	{ usePushEach: true }
);

OpportunitySchema.virtual('closingIn').get(function() {
	let closing = 'CLOSED';
	const d = new Date(this.deadline).getTime() - new Date().getTime();
	if (d > 0) {
		const dd = Math.floor(d / 86400000); // days
		const dh = Math.floor((d % 86400000) / 3600000); // hours
		const dm = Math.round(((d % 86400000) % 3600000) / 60000); // minutes
		if (dd > 0) {
			closing = dd + ' days ' + dh + ' hours ' + dm + ' minutes';
		} else if (dh > 0) {
			closing = dh + ' hours ' + dm + ' minutes';
		} else {
			closing = dm + ' minutes';
		}
	}
	return closing;
});

OpportunitySchema.virtual('isOpen').get(function() {
	return new Date(this.deadline) < new Date();
});

OpportunitySchema.virtual('deadlineDisplay').get(function() {
	const dt = new Date(this.deadline);
	return dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
});

OpportunitySchema.virtual('assignmentDisplay').get(function() {
	const dt = new Date(this.assignment);
	return dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
});

OpportunitySchema.virtual('startDisplay').get(function() {
	const dt = new Date(this.start);
	return dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
});

OpportunitySchema.virtual('endDateDisplay').get(function() {
	const dt = new Date(this.endDate);
	return dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
});

OpportunitySchema.virtual('inceptionStartDateDisplay').get(function() {
	const dt = new Date(this.inceptionStartDate);
	return dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
});

OpportunitySchema.virtual('inceptionEndDateDisplay').get(function() {
	const dt = new Date(this.inceptionEndDate);
	return dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
});

OpportunitySchema.virtual('prototypeStartDateDisplay').get(function() {
	const dt = new Date(this.prototypeStartDate);
	return dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
});

OpportunitySchema.virtual('prototypeEndDateDisplay').get(function() {
	const dt = new Date(this.prototypeEndDate);
	return dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
});

OpportunitySchema.virtual('implementationStartDateDisplay').get(function() {
	const dt = new Date(this.implementationStartDate);
	return dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
});

OpportunitySchema.virtual('implementationEndDateDisplay').get(function() {
	const dt = new Date(this.implementationEndDate);
	return dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
});

export const OpportunityModel: Model<IOpportunityModel> = MongooseController.mongoose.model<IOpportunityModel>('Opportunity', OpportunitySchema);

OpportunitySchema.statics.findUniqueCode = (title, suffix, callback) => {
	return CoreServerHelpers.modelFindUniqueCode(OpportunityModel, 'opp', title, suffix, callback);
};
