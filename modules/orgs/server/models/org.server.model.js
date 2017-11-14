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
	contactName  : {type: String, default: ''},
	// contactEmail : {type: String, default: '', trim:true, lowercase:true, validate: [validateLocalStrategyEmail, 'Please fill a valid email address']},
	contactEmail : {type: String, default: '', trim:true, lowercase:true},
	contactPhone : {type: String, default: ''},
	description  : {type: String, default: ''},
	website      : {type: String, default: ''},
	orgImageURL  : {type: String, default: 'img/default.png'},
	skills       : [String],
	badges       : [String],
	capabilities : [String],
	owner        : {type: 'ObjectId', ref: 'User', default: null },
	created      : {type: Date, default: null},
	createdBy    : {type: 'ObjectId', ref: 'User', default: null },
	updated      : {type: Date, default: null },
	updatedBy    : {type: 'ObjectId', ref: 'User', default: null }
});


mongoose.model('Org', OrgSchema);
