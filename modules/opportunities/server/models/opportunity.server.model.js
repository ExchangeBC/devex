'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	helpers = require(require('path').resolve('./modules/core/server/controllers/core.server.helpers')),
	Schema = mongoose.Schema;

var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var dayNames   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
// -------------------------------------------------------------------------
//
// Opportunity addendum schema
//
// -------------------------------------------------------------------------
var AddendumSchema = new Schema ({
	description : {type: String},
	createdBy 	: {type: Schema.Types.ObjectId, ref: 'User', default: null},
	createdOn	: {type: Date, default: null}
});
// -------------------------------------------------------------------------
//
// Opportunity team question schema
//
// -------------------------------------------------------------------------
var TeamQuestionSchema = new Schema ({
	question		: {type: String},
	guideline		: {type: String},
	wordLimit		: {type: Number, default: 300},
	questionScore	: {type: Number, default: 1}
})
// -------------------------------------------------------------------------
//
// Opportunity schema
//
// -------------------------------------------------------------------------
var OpportunitySchema = new Schema({
	//
	// common fields
	//
	code                      : {type: String, default: ''},
	opportunityTypeCd         : {type: String, default:'code-with-us', enum:['code-with-us', 'sprint-with-us']},
	name                      : {type: String, default: '', required: 'Name cannot be blank'},
	short                     : {type: String, default: ''},
	description               : {type: String, default: ''},
	background                : {type: String, default: ''},
	github                    : {type: String, default: ''},
	views                     : {type: Number, default: 1},
	program                   : {type: Schema.ObjectId, ref: 'Program', default: null, required: 'Program cannot be blank'},
	project                   : {type: Schema.ObjectId, ref: 'Project', default: null, required: 'Project cannot be blank'},
	status                    : {type: String, default:'Pending', enum:['Pending', 'Assigned', 'In Progress', 'Completed']},
	onsite                    : {type: String, default:'mixed', enum:['mixed', 'onsite', 'offsite']},
	location                  : {type: String, default:''},
	isPublished               : {type: Boolean, default: false},
	wasPublished              : {type: Boolean, default: false},
	lastPublished             : {type: Date, default: Date.now },
	deadline                  : {type: Date, default: Date.now },
	created                   : {type: Date, default: Date.now },
	createdBy                 : {type: Schema.ObjectId, ref: 'User', default: null },
	updated                   : {type: Date, default: null },
	updatedBy                 : {type: Schema.ObjectId, ref: 'User', default: null },
	issueUrl                  : {type: String, default: ''},
	issueNumber               : {type: String, default: ''},
	assignment                : {type: Date, default: Date.now },
	//
	// specific to code with us
	//
	proposalEmail             : {type: String, default: ''},
	evaluation                : {type: String, default: ''},
	criteria                  : {type: String, default: ''},
	skills                    : {type: [String], default:[]},
	earn                      : {type: Number, default: 0},
	start                     : {type: Date, default: Date.now },
	endDate                   : {type: Date, default: Date.now },
	assignedTo                : {type: Schema.ObjectId, ref: 'User', default: null },
	//
	// specific to sprint with us
	//
	proposal                  : {type: Schema.ObjectId, ref: 'Proposal', default: null},
	phases : {
		implementation : {
			isImplementation : {type: Boolean, default: false},
			capabilities     : {type: [{type:Schema.ObjectId, ref: 'Capability'}], default:[]},
			capabilitiesCore : {type: [{type:Schema.ObjectId, ref: 'Capability'}], default:[]},
			capabilitySkills : {type: [{type:Schema.ObjectId, ref: 'CapabilitySkill'}], default:[]},
			contract         : {type: String, default: ''},
			endDate          : {type: Date, default: Date.now },
			startDate        : {type: Date, default: Date.now },
			target           : {type: Number, default: 0}
		},
		inception : {
			isInception      : {type: Boolean, default: false},
			capabilities     : {type: [{type:Schema.ObjectId, ref: 'Capability'}], default:[]},
			capabilitiesCore : {type: [{type:Schema.ObjectId, ref: 'Capability'}], default:[]},
			capabilitySkills : {type: [{type:Schema.ObjectId, ref: 'CapabilitySkill'}], default:[]},
			contract         : {type: String, default: ''},
			endDate          : {type: Date, default: Date.now },
			startDate        : {type: Date, default: Date.now },
			target           : {type: Number, default: 0}
		},
		proto : {
			isPrototype      : {type: Boolean, default: false},
			capabilities     : {type: [{type:Schema.ObjectId, ref: 'Capability'}], default:[]},
			capabilitiesCore : {type: [{type:Schema.ObjectId, ref: 'Capability'}], default:[]},
			capabilitySkills : {type: [{type:Schema.ObjectId, ref: 'CapabilitySkill'}], default:[]},
			contract         : {type: String, default: ''},
			endDate          : {type: Date, default: Date.now },
			startDate        : {type: Date, default: Date.now },
			target           : {type: Number, default: 0}
		},
		aggregate : {
			capabilities     : {type: [{type:Schema.ObjectId, ref: 'Capability'}], default:[]},
			capabilitiesCore : {type: [{type:Schema.ObjectId, ref: 'Capability'}], default:[]},
			capabilitySkills : {type: [{type:Schema.ObjectId, ref: 'CapabilitySkill'}], default:[]},
			endDate          : {type: Date, default: Date.now },
			startDate        : {type: Date, default: Date.now },
			target           : {type: Number, default: 0}
		}
	},
	budget                    : {type: Number, default: 0},
	isDocConflictOfInterest   : {type: Boolean, default: false},
	isDocNonDisclosure        : {type: Boolean, default: false},
	isDocRequestForReferences : {type: Boolean, default: false},
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
	numberOfInterviews        : {type: Number, default: 4},
	weights : {
		skill               : {type: Number, default: 0.2},
		question            : {type: Number, default: 0.2},
		interview           : {type: Number, default: 0.5},
		price               : {type: Number, default: 0.1}
	},
	//
	// this is a replacement for the old subscrptions which were clunky. in the past
	// each time a new opp was created we had to create a su7bscrption type. this
	// is much simpler and easier to maintain
	//
	watchers 				: {type: [{type:Schema.ObjectId, ref: 'User'}], default: []},
	addenda					: {type: [AddendumSchema], default: []},
	teamQuestions			: {type: [TeamQuestionSchema], default: []},
	teamQuestionGradingType : {type: String, default:'Linear', enum:['Linear', 'Weighted']}
}, { usePushEach: true });

OpportunitySchema.virtual ('closingIn').get (function () {
	var closing = 'CLOSED';
	var d = (new Date (this.deadline)) - (new Date ());
	if (d > 0) {
		var dd = Math.floor(d / 86400000); // days
		var dh = Math.floor((d % 86400000) / 3600000); // hours
		var dm = Math.round(((d % 86400000) % 3600000) / 60000); // minutes
		if (dd > 0) closing = dd+' days '+dh+' hours '+dm+' minutes';
		else if (dh > 0) closing = dh+' hours '+dm+' minutes';
		else closing = dm+' minutes';
	}
	return closing;
});
OpportunitySchema.virtual ('isOpen').get (function () {
	return (new Date (this.deadline)) < (new Date ());
});
OpportunitySchema.virtual ('deadlineDisplay').get (function () {
	var dt = new Date (this.deadline);
	return dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
});
OpportunitySchema.virtual ('assignmentDisplay').get (function () {
	var dt = new Date (this.assignment);
	return dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
});
OpportunitySchema.virtual ('startDisplay').get (function () {
	var dt = new Date (this.start);
	return dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
});
OpportunitySchema.virtual ('endDateDisplay').get (function () {
	var dt = new Date (this.endDate);
	return dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
});
OpportunitySchema.virtual ('inceptionStartDateDisplay').get (function () {
	var dt = new Date (this.inceptionStartDate);
	return dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
});
OpportunitySchema.virtual ('inceptionEndDateDisplay').get (function () {
	var dt = new Date (this.inceptionEndDate);
	return dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
});
OpportunitySchema.virtual ('prototypeStartDateDisplay').get (function () {
	var dt = new Date (this.prototypeStartDate);
	return dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
});
OpportunitySchema.virtual ('prototypeEndDateDisplay').get (function () {
	var dt = new Date (this.prototypeEndDate);
	return dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
});
OpportunitySchema.virtual ('implementationStartDateDisplay').get (function () {
	var dt = new Date (this.implementationStartDate);
	return dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
});
OpportunitySchema.virtual ('implementationEndDateDisplay').get (function () {
	var dt = new Date (this.implementationEndDate);
	return dayNames[dt.getDay()]+', '+monthNames[dt.getMonth()]+' '+dt.getDate()+', '+dt.getFullYear();
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
mongoose.model('TeamQuestion', TeamQuestionSchema);
