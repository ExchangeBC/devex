'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Opportunity Schema
 */
var OpportunitySchema = new Schema({
	code          : {type: String, default: ''},
	name          : {type: String, default: '', required: 'Name cannot be blank'},
	short         : {type: String, default: '', required: 'Short description cannot be blank'},
	description   : {type: String, default: ''},
	evaluation    : {type: String, default: ''},
	criteria      : {type: String, default: ''},
	github        : {type: String, default: ''},
	proposalEmail : {type: String, default: ''},
	views         : {type: Number, default: 1},
	program       : {type:'ObjectId', ref: 'Program', default: null, required: 'Program cannot be blank'},
	project       : {type:'ObjectId', ref: 'Project', default: null, required: 'Project cannot be blank'},
	skills        : [String],
	earn          : {type: Number, default: 0, required: 'Please provide a reward amount'},
	tags          : [String],
	status        : {type: String, default:'Pending', enum:['Pending', 'Assigned', 'In Progress', 'Completed']},
	onsite        : {type: String, default:'mixed', enum:['mixed', 'onsite', 'offsite']},
	location      : {type: String, default:''},
	isPublished   : {type: Boolean, default: false},
	wasPublished  : {type: Boolean, default: false},
	lastPublished : {type: Date, default: null},
	deadline      : {type: Date, default: null},
	assignment    : {type: Date, default: null},
	start         : {type: Date, default: null},
	assignedTo    : {type: 'ObjectId', ref: 'User', default: null },
	created       : {type: Date, default: null},
	createdBy     : {type: 'ObjectId', ref: 'User', default: null },
	updated       : {type: Date, default: null },
	updatedBy     : {type: 'ObjectId', ref: 'User', default: null },
	issueUrl      : {type: 'String', default: ''},
	issueNumber   : {type: 'String', default: ''},
	proposal      : {type:'ObjectId', ref: 'Proposal', default: null}
});

OpportunitySchema.statics.findUniqueCode = function (title, suffix, callback) {
	var _this = this;
	var possible = 'opp-' + (title.toLowerCase().replace(/\W/g,'-').replace(/-+/,'-')) + (suffix || '');

	_this.findOne({
		code: possible
	}, function (err, user) {
		if (!err) {
			if (!user) {
				callback(possible);
			} else {
				return _this.findUniqueCode(title, (suffix || 0) + 1, callback);
			}
		} else {
			callback(null);
		}
	});
};

mongoose.model('Opportunity', OpportunitySchema);
