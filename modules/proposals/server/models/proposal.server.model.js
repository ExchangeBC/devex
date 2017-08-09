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
})
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
	attachments          : [AttachmentSchema]
});


mongoose.model('Proposal', ProposalSchema);
