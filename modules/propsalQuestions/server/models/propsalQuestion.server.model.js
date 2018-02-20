'use strict';

/**
 * Module dependencies.
 */
var mongoose = require ('mongoose'),
	Schema = mongoose.Schema;

/**
 * PropsalQuestion Schema
 */
var PropsalQuestionSchema = new Schema ({
	code        : {type: String, default: ''},
	name        : {type: String, required:'PropsalQuestion Name Is Required'},
	description : {type: String, default: ''}
});

PropsalQuestionSchema.statics.findUniqueCode = function (title, suffix, callback) {
	var _this = this;
	var possible = 'propsalQuestion-' + (title.toLowerCase ().replace (/\W/g,'-').replace (/-+/,'-')) + (suffix || '');

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

mongoose.model ('PropsalQuestion', PropsalQuestionSchema);
