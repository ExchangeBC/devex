'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var AttachmentSchema = new Schema ({
	name : {type: String},
	path : {type: String},
	type : {type: String}
});
var QuestionSchema = new Schema ({
	question : {type: String},
	response : {type: String},
	rank     : {type: Number, default: 0},
	rejected : {type: Boolean, default: false}
});
var AddendumSchema = new Schema ({
	description : {type: String},
	createdBy 	: {type: 'ObjectId', ref: 'User', default: null},
	created		: {type: Date, default: null}
});
var TeamQuestionResponseSchema = new Schema ({
	question : {type: String},
	response : {type: String},
	rank     : {type: Number, default: 0},
	rejected : {type: Boolean, default: false},
	score	 : {type: Number, default: 0}
});
/**
 * Proposal Schema
 */
var ProposalSchema = new Schema ({
	summary              : {type: String},
	detail               : {type: String},
	opportunity          : {type: Schema.ObjectId, ref: 'Opportunity', required: 'Please select a program', index: true},
	status               : {type: String, default: 'New', enum:['New', 'Draft', 'Submitted', 'Reviewed', 'Assigned']},
	isAssigned           : {type: Boolean, default: false},
	isCompany            : {type: Boolean, default: false},
	businessName         : {type: String, default: ''},
	businessAddress      : {type: String, default: ''},
	businessContactName  : {type: String, default: ''},
	businessContactEmail : {type: String, default: '', trim:true, lowercase:true},
	businessContactPhone : {type: String, default: ''},
	created              : {type: Date, default: null},
	createdBy            : {type: 'ObjectId', ref: 'User', default: null },
	updated              : {type: Date, default: null },
	updatedBy            : {type: 'ObjectId', ref: 'User', default: null },
	isAcceptedTerms      : {type: Boolean, default: false},
	//
	// for CWU we just have an individual, we still link the creator of a SWU here, but we
	// focus on the following fields for SWU primarily
	//
	user                 : {type: Schema.ObjectId, ref: 'User', required: 'Please select a user', index: true},
	//
	// SWU is averything below
	//
	org                  : {type: Schema.ObjectId, ref: 'Org', index: true},
	phases : {
		implementation : {
			isImplementation : {type: Boolean, default: false},
			team             : {type: [{type:Schema.ObjectId, ref:'User'}], default: []},
			cost             : {type: Number, default: 0}
		},
		inception : {
			isInception : {type: Boolean, default: false},
			team        : {type: [{type:Schema.ObjectId, ref:'User'}], default: []},
			cost        : {type: Number, default: 0}
		},
		proto : {
			isPrototype : {type: Boolean, default: false},
			team        : {type: [{type:Schema.ObjectId, ref:'User'}], default: []},
			cost        : {type: Number, default: 0}
		},
		aggregate : {
			capabilities     : {type: [{type:Schema.ObjectId, ref: 'Capability'}], default:[]},
			capabilitySkills : {type: [{type:Schema.ObjectId, ref: 'CapabilitySkill'}], default:[]},
			cost : {type: Number, default: 0}
		}
	},
	questions            : {type: [QuestionSchema], default: []},
	attachments          : {type: [AttachmentSchema], default: []},
	interviewComplete    : {type: Boolean, default: false},
	scores : {
		skill           : {type: Number, default: 0},
		question        : {type: Number, default: 0},
		codechallenge	: {type: Number, default: 0},
		interview       : {type: Number, default: 0},
		price           : {type: Number, default: 0},
		total           : {type: Number, default: 0}

	},
	ranking						: {type: Number, default: 0},
	screenedIn					: {type: Boolean, default: false},
	passedCodeChallenge			: {type: Boolean, default: false},
	addendums					: {type: [AddendumSchema], default: []},
	teamQuestionResponses		: {type: [TeamQuestionResponseSchema], default: []}
}, { usePushEach: true });


mongoose.model('Proposal', ProposalSchema);
