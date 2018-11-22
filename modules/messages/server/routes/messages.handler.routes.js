'use strict';
var isUser = function(req, res, next) { return req.headers.host==='localhost:3000' ? next() : res.status(403).json({ message: 'User is not authorized' });};
var path   = require('path');
var { OrgsController }   = require('../../../orgs/server/controllers/orgs.server.controller');
var users  = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

const orgs = new OrgsController();
// =========================================================================
//
// MESSAGE HANDLER ROUTES
//
// Here are the rules:
//
// every route is prefixed with '/api/message/handler/action/:actionCode/user/:userId'
// this allows for the link to be called internally and checked as such
// the current session is NOT used, but the user model will appear as req.model
// while the action taken will be req.params.actionCode (see example below)
//
// there is a predefined route for messages that simply require an OK
//
// Your handler MUST return a json object in the form:
// {
// 		message: '<String>'
// }
//
// the message can be an entire page of html or error text, whatever you like
//
// If you return a status code of 200-299 then your message will be displayed
// to the user and the result will be counted as farourable and the message
// will be archivedf
//
// If you return a status code of anything but 200-299 the result is considered
// a failure and the message will NOT be archived - however, your message will
// still be displayed to the user.
//
// Just to recap:
// status codes:
// 		200  : All done with message, archive it
// 		else : DO not archive message
// message:
// 		Always displayed to user, regardless
//
// =========================================================================
module.exports = function (app) {
	// -------------------------------------------------------------------------
	//
	// OK - default only
	//
	// -------------------------------------------------------------------------
	app.route('/api/message/handler/action/:actionCode/user/:userId/defaultonly').get (isUser, function (req, res) {
		return res.status (200).json ({message:'Thank You '+req.model.displayName});
	});
	// -------------------------------------------------------------------------
	//
	// an example here of what to do
	//
	// -------------------------------------------------------------------------
	app.route('/api/message/handler/action/:actionCode/user/:userId/test/test/test').get (isUser, function (req, res) {
		if (req.params.actionCode === 'ok') return res.status (200).json ({message:'<p>this is some Good html '+req.model.displayName+'</p>'});
		else return res.status (400).send ({message:'<p>this is some BAD html '+req.model.displayName+'</p>'});
	});
	// -------------------------------------------------------------------------
	//
	// user adds themselves to an org
	//
	// -------------------------------------------------------------------------
	app.route('/api/message/handler/action/:actionCode/user/:userId/join/org/:orgId')
		.all (isUser)
		.get (orgs.addUserToOrg);
	// -------------------------------------------------------------------------
	//
	// requesting user is granted government role
	//
	// -------------------------------------------------------------------------
	app.route('/api/message/handler/action/:actionCode/user/:userId/gov/add/:requestingUserId')
		.all(isUser)
		.get(users.grantGovernmentRole)
};
