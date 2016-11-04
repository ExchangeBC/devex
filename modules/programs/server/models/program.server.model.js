'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Program Schema
 */
var ProgramSchema = new Schema({
	code        : {type: String, default: ''},
	title       : {type: String, default: '', required: 'Title cannot be blank'},
	short       : {type: String, default: ''},
	description : {type: String, default: ''},
	owner       : {type: String, default: ''},
	website     : {type: String, default: ''},
	logo        : {type: String, default: ''},
	created     : {type: Date, default: null},
	createdBy   : {type: 'ObjectId', ref: 'User', default: null },
	updated     : {type: Date, default: null },
	updatedBy   : {type: 'ObjectId', ref: 'User', default: null }
});

mongoose.model('Program', ProgramSchema);
