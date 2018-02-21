'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	helpers = require(require('path').resolve('./modules/core/server/controllers/core.server.helpers')),
	Schema = mongoose.Schema;

// -------------------------------------------------------------------------
//
// Opportunity capabilities
//
// -------------------------------------------------------------------------
var OpportunityCapabilities = new Schema ({
	code         : {type: String, default: ''},
	experience   : {type: String, default:''},
	minimumYears : {type: Number, default:0 },
	desiredYears : {type: Number, default:0 },
	skills       : {type: [String], default:[]}
});
/**
 * Opportunity Schema
 */
var OpportunitySchema = new Schema({
	code                      : {type: String, default: ''},
	opportunityTypeCd         : {type: String, default:'code-with-us', enum:['code-with-us', 'sprint-with-us']},
	name                      : {type: String, default: '', required: 'Name cannot be blank'},
	short                     : {type: String, default: ''},
	description               : {type: String, default: ''},
	background                : {type: String, default: ''},
	evaluation                : {type: String, default: ''},
	criteria                  : {type: String, default: ''},
	github                    : {type: String, default: ''},
	proposalEmail             : {type: String, default: ''},
	views                     : {type: Number, default: 1},
	program                   : {type: Schema.ObjectId, ref: 'Program', default: null, required: 'Program cannot be blank'},
	project                   : {type: Schema.ObjectId, ref: 'Project', default: null, required: 'Project cannot be blank'},
	skills                    : [String],
	earn                      : {type: Number, default: 0},
	tags                      : [String],
	status                    : {type: String, default:'Pending', enum:['Pending', 'Assigned', 'In Progress', 'Completed']},
	onsite                    : {type: String, default:'mixed', enum:['mixed', 'onsite', 'offsite']},
	location                  : {type: String, default:''},
	isPublished               : {type: Boolean, default: false},
	wasPublished              : {type: Boolean, default: false},
	lastPublished             : {type: Date, default: null},
	deadline                  : {type: Date, default: null},
	assignment                : {type: Date, default: null},
	start                     : {type: Date, default: null},
	endDate                   : {type: Date, default: null},
	assignedTo                : {type: Schema.ObjectId, ref: 'User', default: null },
	created                   : {type: Date, default: null},
	createdBy                 : {type: Schema.ObjectId, ref: 'User', default: null },
	updated                   : {type: Date, default: null },
	updatedBy                 : {type: Schema.ObjectId, ref: 'User', default: null },
	issueUrl                  : {type: String, default: ''},
	issueNumber               : {type: String, default: ''},
	proposal                  : {type: Schema.ObjectId, ref: 'Proposal', default: null},
	capabilities              : {type: [{type:Schema.ObjectId, ref: 'Capability'}], default:[]},
	capabilitySkills          : {type: [{type:Schema.ObjectId, ref: 'CapabilitySkill'}], default:[]},
	implementationContract    : {type: String, default: ''},
	implementationEndDate     : {type: Date, default: null},
	implementationStartDate   : {type: Date, default: null},
	implementationTarget      : {type: Number, default: 0},
	inceptionContract         : {type: String, default: ''},
	inceptionEndDate          : {type: Date, default: null},
	inceptionStartDate        : {type: Date, default: null},
	inceptionTarget           : {type: Number, default: 0},
	prototypeContract         : {type: String, default: ''},
	prototypeEndDate          : {type: Date, default: null},
	prototypeStartDate        : {type: Date, default: null},
	prototypeTarget           : {type: Number, default: 0},
	isDocConflictOfInterest   : {type: Boolean, default: false},
	isDocNonDisclosure        : {type: Boolean, default: false},
	isDocRequestForReferences : {type: Boolean, default: false},
	isImplementation          : {type: Boolean, default: false},
	isInception               : {type: Boolean, default: false},
	isPrototype               : {type: Boolean, default: false},
	totalTarget               : {type: Number, default: 0},
	terms                     : {type: String, default: ''},
	questions                 : {type: [String], default:[]},
	//
	// 0 = not started
	// 1 = questions
	// 2 = interview
	// 3 = price
	// 4 = assigned
	//
	evaluationStage           : {type: Number, default: 0},
	numberOfInterviews        : {type: Number, default: 2},
	weights : {
		skill               : {type: Number, default: 0.2},
		question            : {type: Number, default: 0.2},
		interview           : {type: Number, default: 0.5},
		price               : {type: Number, default: 0.1}
	}
});

OpportunitySchema.statics.findUniqueCode = function (title, suffix, callback) {
	return helpers.modelFindUniqueCode (this, 'opp', title, suffix, callback);
	// var _this = this;
	// var possible = 'opp-' + (title.toLowerCase().replace(/\W/g,'-').replace(/-+/,'-')) + (suffix || '');

	// _this.findOne({
	// 	code: possible
	// }, function (err, user) {
	// 	if (!err) {
	// 		if (!user) {
	// 			callback(possible);
	// 		} else {
	// 			return _this.findUniqueCode(title, (suffix || 0) + 1, callback);
	// 		}
	// 	} else {
	// 		callback(null);
	// 	}
	// });
};

mongoose.model('Opportunity', OpportunitySchema);
