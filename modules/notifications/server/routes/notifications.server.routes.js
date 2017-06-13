'use strict';

/**
 * Module dependencies
 */
var notificationsPolicy = require('../policies/notifications.server.policy'),
	notifications = require('../controllers/notifications.server.controller');

module.exports = function(app) {
	// Notifications Routes
	app.route('/api/notifications').all(notificationsPolicy.isAllowed)
		.get(notifications.list)
		.post(notifications.create);

	app.route('/api/notifications/:notificationId').all(notificationsPolicy.isAllowed)
		.get(notifications.read)
		.put(notifications.update)
		.delete(notifications.delete);


	app.route('/api/my/subscriptions').all(notificationsPolicy.isAllowed)
		.get(notifications.myList);

	app.route('/api/my/subscriptions/:subscriptionId').all(notificationsPolicy.isAllowed)
		.get(notifications.readSubscription)
		.delete(notifications.myDelete);

	app.route('/api/my/notification/:notificationId').all(notificationsPolicy.isAllowed)
		.delete(notifications.unsubscribeMe)
		.get(notifications.subscribeMe);


	app.route('/api/subscriptions/notification/:notificationId').all(notificationsPolicy.isAllowed)
		.get(notifications.forNotification);

	app.route('/api/subscriptions/user/:userId').all(notificationsPolicy.isAllowed)
		.get(notifications.forUser);

	app.route('/api/new/notification')
		// .all(notificationsPolicy.isAllowed)
		.get(notifications.new);

	app.route('/api/unsubscribe/:externalSubscriptionId')
		.get(notifications.unsubscribeExternal);

	app.route('/api/subscribe/:externalSubscriptionId/:notificationId')
		.get(notifications.subscribeExternal);

	app.route ('/api/fix/subscriptions').get (notifications.reApplySubscriptions);

	// app.route('/api/cc/tryme').get(notifications.tryme);
	// app.route('/api/cc/tryme2').get(notifications.tryme2);

	// Finish by binding the Notification middleware
	app.param('notificationId', notifications.notificationByID);
	app.param('subscriptionId', notifications.subscriptionById);
	app.param('externalSubscriptionId', notifications.externalSubscriptionById);
};
