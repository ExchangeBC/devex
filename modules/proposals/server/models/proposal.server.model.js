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
	rank     : {type: Number, default: 0}
});
/**
 * Proposal Schema
 */
var ProposalSchema = new Schema ({
	summary              : {type: String},
	detail               : {type: String},
	opportunity          : {type: Schema.ObjectId, ref: 'Opportunity', required: 'Please select a program', index: true},
	user                 : {type: Schema.ObjectId, ref: 'User', required: 'Please select a user', index: true},
	status               : {type: String, default: 'New', enum:['New', 'Draft', 'Submitted', 'Reviewed', 'Assigned']},
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
	team                 : {type: [{type:Schema.ObjectId, ref:'User'}], default: []},
	questions            : {type: [QuestionSchema], default: []},
	isAcceptedTerms      : {type: Boolean, default: false},
	attachments          : {type: [AttachmentSchema], default: []},
	cost                 : {type: Number, default: 0},
	questionScore        : {type: Number, default: 0},
	interviewScore       : {type: Number, default: 0},
	interviewComplete    : {type: Boolean, default: false},
	priceScore           : {type: Number, default: 0},
	totalScore           : {type: Number, default: 0}
});


mongoose.model('Proposal', ProposalSchema);
