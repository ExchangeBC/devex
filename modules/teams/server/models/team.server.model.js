'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Team Schema
 */
var TeamSchema = new Schema({
	org         : {type:Schema.ObjectId, ref:'Org', required:'Organization is required'},
	team         : {type:Schema.ObjectId, ref:'Team', default:null},
	code        : {type: String, default: ''},
	name        : {type: String, required:'Team Name Is Required'},
	description : {type: String, default: ''},
	members: [{
		type: Schema.ObjectId,
		ref: 'User'
	}]
});

TeamSchema.statics.findUniqueCode = function (title, suffix, callback) {
	var _this = this;
	var possible = 'team-' + (title.toLowerCase().replace(/\W/g,'-').replace(/-+/,'-')) + (suffix || '');

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

mongoose.model('Team', TeamSchema);
