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
	opportunityTypeCd : {type: String, default:'code-with-us', enum:['code-with-us', 'sprint-with-us']},
	name          : {type: String, default: '', required: 'Name cannot be blank'},
	short         : {type: String, default: ''},
	description   : {type: String, default: ''},
	background    : {type: String, default: ''},
	evaluation    : {type: String, default: ''},
	criteria      : {type: String, default: ''},
	github        : {type: String, default: ''},
	proposalEmail : {type: String, default: ''},
	views         : {type: Number, default: 1},
	program       : {type:'ObjectId', ref: 'Program', default: null, required: 'Program cannot be blank'},
	project       : {type:'ObjectId', ref: 'Project', default: null, required: 'Project cannot be blank'},
	skills        : [String],
	capabilities        : [String],
	earn          : {type: Number, default: 0},
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
	endDate       : {type: Date, default: null},
	assignedTo    : {type: 'ObjectId', ref: 'User', default: null },
	created       : {type: Date, default: null},
	createdBy     : {type: 'ObjectId', ref: 'User', default: null },
	updated       : {type: Date, default: null },
	updatedBy     : {type: 'ObjectId', ref: 'User', default: null },
	issueUrl      : {type: 'String', default: ''},
	issueNumber   : {type: 'String', default: ''},
	proposal      : {type:'ObjectId', ref: 'Proposal', default: null},
	c01_minimumYears : { type: Number, default:0 },
	c02_minimumYears : { type: Number, default:0 },
	c03_minimumYears : { type: Number, default:0 },
	c04_minimumYears : { type: Number, default:0 },
	c05_minimumYears : { type: Number, default:0 },
	c06_minimumYears : { type: Number, default:0 },
	c07_minimumYears : { type: Number, default:0 },
	c08_minimumYears : { type: Number, default:0 },
	c09_minimumYears : { type: Number, default:0 },
	c10_minimumYears : { type: Number, default:0 },
	c11_minimumYears : { type: Number, default:0 },
	c12_minimumYears : { type: Number, default:0 },
	c13_minimumYears : { type: Number, default:0 },
	c01_desiredYears : { type: Number, default:0 },
	c02_desiredYears : { type: Number, default:0 },
	c03_desiredYears : { type: Number, default:0 },
	c04_desiredYears : { type: Number, default:0 },
	c05_desiredYears : { type: Number, default:0 },
	c06_desiredYears : { type: Number, default:0 },
	c07_desiredYears : { type: Number, default:0 },
	c08_desiredYears : { type: Number, default:0 },
	c09_desiredYears : { type: Number, default:0 },
	c10_desiredYears : { type: Number, default:0 },
	c11_desiredYears : { type: Number, default:0 },
	c12_desiredYears : { type: Number, default:0 },
	c13_desiredYears : { type: Number, default:0 },
	c01_tags : { type:[String], default:[] },
	c02_tags : { type:[String], default:[] },
	c03_tags : { type:[String], default:[] },
	c04_tags : { type:[String], default:[] },
	c05_tags : { type:[String], default:[] },
	c06_tags : { type:[String], default:[] },
	c07_tags : { type:[String], default:[] },
	c08_tags : { type:[String], default:[] },
	c09_tags : { type:[String], default:[] },
	c10_tags : { type:[String], default:[] },
	c11_tags : { type:[String], default:[] },
	c12_tags : { type:[String], default:[] },
	c13_tags : { type:[String], default:[] },
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
	terms                     : {type: String, default: ''}
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
