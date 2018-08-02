'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  validator = require('validator'),
	Schema = mongoose.Schema;


var validateLocalStrategyEmail = function (email) {
  return ((this.provider !== 'local' && !this.updated) || validator.isEmpty(email) || validator.isEmail(email, { require_tld: false }));
};

// -------------------------------------------------------------------------
//
// Org
//
// -------------------------------------------------------------------------
var OrgSchema = new Schema ({
	name                 : {type: String, default: '', required: 'Name cannot be blank'},
	dba                  : {type: String, default: ''},
	address              : {type: String, default: ''},
	address2             : {type: String, default: ''},
	city                 : {type: String, default: ''},
	province             : {type: String, default: 'BC'},
	postalcode           : {type: String, default: ''},
	businessNumber       : {type: String, default: ''},
	businessJurisdiction : {type: String, default: ''},
	fullAddress          : {type: String, default: ''},
	contactName          : {type: String, default: ''},
	contactEmail         : {type: String, default: '', trim:true, lowercase:true},
	contactPhone         : {type: String, default: ''},
	description          : {type: String, default: ''},
	website              : {type: String, default: ''},
	orgImageURL          : {type: String, default: 'img/default.png'},
	skills               : [String],
	badges               : [String],
	capabilities         : {type: [{type:Schema.ObjectId, ref: 'Capability'}], default:[]},
	capabilitySkills     : {type: [{type:Schema.ObjectId, ref: 'CapabilitySkill'}], default:[]},
	metRFQ               : {type: Boolean, default:false},
	isCapable            : {type: Boolean, default:false},
	isAcceptedTerms      : {type: Boolean, default:false},
	owner                : {type: 'ObjectId', ref: 'User', default: null },
	created              : {type: Date, default: null},
	createdBy            : {type: 'ObjectId', ref: 'User', default: null },
	updated              : {type: Date, default: null },
	updatedBy            : {type: 'ObjectId', ref: 'User', default: null },
	members              : {type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
	admins               : {type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
	invited				 : [String]
}, { usePushEach: true });

OrgSchema.pre ('save', function (next) {
	this.fullAddress = this.address + (this.address?', '+this.address:'') + ', ' + this.city + ', ' + this.province+ ', ' + this.postalcode
	next();
});


mongoose.model('Org', OrgSchema);
