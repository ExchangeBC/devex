'use strict';

/**
 * Module dependencies
 */
var propsalQuestionsPolicy = require ('../policies/propsalQuestions.server.policy'),
	propsalQuestions       = require ('../controllers/propsalQuestions.server.controller');

module.exports = function (app) {
	app.route ('/api/propsalQuestions')
		.all (propsalQuestionsPolicy.isAllowed)
		.get (propsalQuestions.list)
		.post (propsalQuestions.create);
	app.route ('/api/propsalQuestions/:propsalQuestionId')
		.all (propsalQuestionsPolicy.isAllowed)
		.get (propsalQuestions.read)
		.put (propsalQuestions.update)
		.delete (propsalQuestions.delete);
	app.param ('propsalQuestionId', propsalQuestions.propsalQuestionByID);
};
