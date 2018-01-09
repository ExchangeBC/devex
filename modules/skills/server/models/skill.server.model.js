'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Skill Schema
 */
var SkillSchema = new Schema({
	required    : {type: Boolean, default: true},
	key         : {type: String, default: ''},
	code        : {type: String, default: ''},
	text        : {type: String, default: ''},
	description : {type: String, default: ''},
	tags        : [String]
});

mongoose.model('Skill', SkillSchema);
