'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

// -------------------------------------------------------------------------
//
// endorsement
//
// -------------------------------------------------------------------------
var Endorsement = new Schema ({
	content     : {type: String, default: ''},
	link        : {type: String, default: ''},
	projectName : {type: String, default: ''},
	created     : {type: Date, default: null},
	createdBy   : {type: 'ObjectId', ref: 'User', default: null },
	updated     : {type: Date, default: null },
	updatedBy   : {type: 'ObjectId', ref: 'User', default: null }
});

// -------------------------------------------------------------------------
//
// external profiles
//
// -------------------------------------------------------------------------
var ExternalProfile = new Schema ({
	site : {type: String, default: ''},
	link : {type: String, default: ''}
});

// -------------------------------------------------------------------------
//
// Profile
//
// -------------------------------------------------------------------------
var ProfileSchema = new Schema ({
	user          : {type: 'ObjectId', ref: 'User', default: null },
	title         : {type: String, default: '', required: 'Title cannot be blank'},
	organization  : {type: String, default: ''},
	location      : {type: String, default: ''},
	description   : {type: String, default: ''},
	website       : {type: String, default: ''},
	skills        : [String],
	badges        : [String],
	capabilities  : [String],
	endorsements  : [Endorsement],
	github        : {type: String, default: ''},
	stackOverflow : {type: String, default: ''},
	stackExchange : {type: String, default: ''},
	linkedIn      : {type: String, default: ''},
	created       : {type: Date, default: null},
	createdBy     : {type: 'ObjectId', ref: 'User', default: null },
	updated       : {type: Date, default: null },
	updatedBy     : {type: 'ObjectId', ref: 'User', default: null }
});


mongoose.model('Profile', ProfileSchema);
