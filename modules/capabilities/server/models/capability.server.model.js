'use strict';

/**
 * Module dependencies.
 */
var mongoose = require ('mongoose'),
	helpers = require(require('path').resolve('./modules/core/server/controllers/core.server.helpers')),
	Schema = mongoose.Schema;

/**
 * Capability Skills Schema
 */
var CapabilitySkillSchema = new Schema ({
	code             : {type: String, default: ''},
	name             : {type: String, required:'Capability Skill Name Is Required'}
});
/**
 * Capability Schema
 */
var CapabilitySchema = new Schema ({
	code             : {type: String, default: ''},
	name             : {type: String, required:'Capability Name Is Required'},
	description      : {type: String, default: ''},
	skills           : {type: [{type:Schema.ObjectId, ref: 'CapabilitySkill'}], default:[]},
	isRequired       : {type: Boolean, default: true},
	isInception      : {type: Boolean, default: true},
	isPrototype      : {type: Boolean, default: true},
	isImplementation : {type: Boolean, default: true},
	//
	// for UI purposes
	//
	labelClass : {type: String, default: ''}
});

CapabilitySchema.statics.findUniqueCode = function (title, suffix, callback) {
	return helpers.modelFindUniqueCode (this, 'capability', title, suffix, callback);
};
CapabilitySkillSchema.statics.findUniqueCode = function (title, suffix, callback) {
	return helpers.modelFindUniqueCode (this, 'capabilityskill', title, suffix, callback);
};

mongoose.model ('Capability', CapabilitySchema);
mongoose.model ('CapabilitySkill', CapabilitySkillSchema);
