'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Notification Schema
 */
var NotificationSchema = new Schema({
	code            : {type: String, default: '', unique: true},
	name            : {type: String, default: ''},
	// description     : {type: String, default: ''},
	// question        : {type: String, default: 'Notify me of ...', required: 'Please fill the notification question', trim: true },
	// subject         : {type: String, default: '', required: 'Please complete the notification email subject (in markdown)', trim: true },
	// subjectTemplate : {type: String, default: ''},
	// body            : {type: String, default: '', required: 'Please complete the notification email body (in markdown)', trim: true },
	// bodyTemplate    : {type: String, default: ''},
	target          : {type: String, default: 'None', enum: ['None', 'Opportunity', 'Program', 'Project', 'User']},
	event           : {type: String, default: 'None', enum: ['Add', 'Update', 'Delete', 'UpdateAny']},
	isActive        : {type: Boolean, default: false}
});

var SubscriptionSchema = new Schema({
	subscriptionId   : {type: String, unique: true, required: 'A subscription Id is a requirement'},
	notification     : {type: Schema.ObjectId, ref: 'Notification', required: 'Please select a program'},
	notificationCode : {type: String},   // notification code
	user             : {type: Schema.ObjectId, ref: 'User', required: 'Please select a user', index: true}
});

SubscriptionSchema.index ({user: 1, notificationCode: 1}, {unique: true});

NotificationSchema.statics.findUniqueCode = function (name, suffix, callback) {
	var _this = this;
	var possible = 'not-' + (name.toLowerCase().replace(/\W/g,'-').replace(/-+/,'-')) + (suffix || '');

	_this.findOne({
	code: possible
	}, function (err, user) {
	if (!err) {
		if (!user) {
		callback(possible);
		} else {
		return _this.findUniqueCode(name, (suffix || 0) + 1, callback);
		}
	} else {
		callback(null);
	}
	});
};

mongoose.model('Notification', NotificationSchema);
mongoose.model('Subscription', SubscriptionSchema);

