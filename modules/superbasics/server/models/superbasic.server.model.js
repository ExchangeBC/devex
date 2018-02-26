'use strict';

/**
 * Module dependencies.
 */
var mongoose = require ('mongoose'),
	Schema = mongoose.Schema;

/**
 * Superbasic Schema
 */
var SuperbasicSchema = new Schema ({
	code        : {type: String, default: ''},
	name        : {type: String, required:'Superbasic Name Is Required'},
	description : {type: String, default: ''}
});

SuperbasicSchema.statics.findUniqueCode = function (title, suffix, callback) {
	var _this = this;
	var possible = 'superbasic-' + (title.toLowerCase ().replace (/\W/g,'-').replace (/-+/,'-')) + (suffix || '');

	_this.findOne ({
		code: possible
	}, function (err, user) {
		if (!err) {
			if (!user) {
				callback (possible);
			} else {
				return _this.findUniqueCode (title, (suffix || 0) + 1, callback);
			}
		} else {
			callback (null);
		}
	});
};

mongoose.model ('Superbasic', SuperbasicSchema);
