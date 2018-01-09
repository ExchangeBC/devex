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
	name         : {type: String, default: '', required: 'Name cannot be blank'},
	dba          : {type: String, default: ''},
	address      : {type: String, default: ''},
	address2     : {type: String, default: ''},
	city         : {type: String, default: ''},
	province     : {type: String, default: 'BC', enum: ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']},
	postalcode   : {type: String, default: ''},
	fullAddress  : {type: String, default: ''},
	contactName  : {type: String, default: ''},
	// contactEmail : {type: String, default: '', trim:true, lowercase:true, validate: [validateLocalStrategyEmail, 'Please fill a valid email address']},
	contactEmail : {type: String, default: '', trim:true, lowercase:true},
	contactPhone : {type: String, default: ''},
	description  : {type: String, default: ''},
	website      : {type: String, default: ''},
	orgImageURL  : {type: String, default: 'img/default.png'},
	skills       : [String],
	badges       : [String],
	owner        : {type: 'ObjectId', ref: 'User', default: null },
	created      : {type: Date, default: null},
	createdBy    : {type: 'ObjectId', ref: 'User', default: null },
	updated      : {type: Date, default: null },
	updatedBy    : {type: 'ObjectId', ref: 'User', default: null },
	c01_flag : { type: Boolean, default:false },
	c02_flag : { type: Boolean, default:false },
	c03_flag : { type: Boolean, default:false },
	c04_flag : { type: Boolean, default:false },
	c05_flag : { type: Boolean, default:false },
	c06_flag : { type: Boolean, default:false },
	c07_flag : { type: Boolean, default:false },
	c08_flag : { type: Boolean, default:false },
	c09_flag : { type: Boolean, default:false },
	c10_flag : { type: Boolean, default:false },
	c11_flag : { type: Boolean, default:false },
	c12_flag : { type: Boolean, default:false },
	c13_flag : { type: Boolean, default:false },
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
	members  : [{type: 'ObjectId', ref: 'User'}],
	admins   : [{type: 'ObjectId', ref: 'User'}]
});

OrgSchema.pre ('save', function (next) {
	this.fullAddress = this.address + (this.address?', '+this.address:'') + ', ' + this.city + ', ' + this.province+ ', ' + this.postalcode
	next();
});


mongoose.model('Org', OrgSchema);
