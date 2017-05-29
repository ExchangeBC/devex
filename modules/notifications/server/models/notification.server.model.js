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


touch opportunity-add-subject.md
touch opportunity-update-subject.md
touch opportunity-delete-subject.md
touch opportunity-updateany-subject.md
touch program-add-subject.md
touch program-update-subject.md
touch program-delete-subject.md
touch program-updateany-subject.md
touch project-add-subject.md
touch project-update-subject.md
touch project-delete-subject.md
touch project-updateany-subject.md
touch user-add-subject.md
touch user-update-subject.md
touch user-delete-subject.md
touch user-updateany-subject.md
touch opportunity-add-body.md
touch opportunity-update-body.md
touch opportunity-delete-body.md
touch opportunity-updateany-body.md
touch program-add-body.md
touch program-update-body.md
touch program-delete-body.md
touch program-updateany-body.md
touch project-add-body.md
touch project-update-body.md
touch project-delete-body.md
touch project-updateany-body.md
touch user-add-body.md
touch user-update-body.md
touch user-delete-body.md
touch user-updateany-body.md

