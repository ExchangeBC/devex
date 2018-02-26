'use strict';

var _ = require('lodash'),
	config = require('../config'),
	mongoose = require('mongoose'),
	path = require('path'),
	chalk = require('chalk'),
	crypto = require('crypto');

// global seed options object
var seedOptions = {};

var isProduction  = config.feature_hide;
var isDevelopment = !isProduction;

function removeUser (user) {
	return new Promise(function (resolve, reject) {
		var User = mongoose.model('User');
		User.find({ username: user.username }).remove(function (err) {
			if (err) {
				reject(new Error('Failed to remove local ' + user.username));
			}
			resolve();
		});
	});
}

function saveUser (user) {
	return function() {
		return new Promise(function (resolve, reject) {
			// Then save the user
			user.save(function (err, theuser) {
				if (err) {
					console.log (err);
					reject(new Error('Failed to add local ' + user.username));
				} else {
					resolve(theuser);
				}
			});
		});
	};
}

function checkUserNotExists (user) {
	return new Promise(function (resolve, reject) {
		var User = mongoose.model('User');
		User.find({ username: user.username }, function (err, users) {
			if (err) {
				reject(new Error('Failed to find local account ' + user.username));
			}

			if (users.length === 0) {
				resolve();
			} else {
				// console.log('Database Seeding:\t\t\t' + 'local account already exists: ' + user.username);
				// resolve ();
				reject(new Error('Failed due to local account already exists: ' + user.username));
			}
		});
	});
}

function reportSuccess (password) {
	return function (user) {
		return new Promise(function (resolve, reject) {
			if (seedOptions.logResults) {
				console.log(chalk.bold.red('Database Seeding:\t\t\tLocal ' + user.username + ' added with password set to ' + password));
			}
			resolve();
		});
	};
}

// save the specified user with the password provided from the resolved promise
function seedTheUser (user) {
	return function (password) {
		return new Promise(function (resolve, reject) {

			var User = mongoose.model('User');
			// set the new password
			user.password = password;

			if (user.username === seedOptions.seedAdmin.username && process.env.NODE_ENV === 'production') {
				checkUserNotExists(user)
					.then(saveUser(user))
					.then(reportSuccess(password))
					.then(function () {
						resolve();
					})
					.catch(function (err) {
						reject(err);
					});
			} else {
				// removeUser(user)
				checkUserNotExists(user)
					.then(saveUser(user))
					.then(reportSuccess(password))
					.then(function () {
						resolve();
					})
					// .catch(function (err) {
					//   // resolve();
					//   reject(err);
					// });
					;
			}
		});
	};
}

//
// Seed the default notifications for each object type in the system
//
function seedNotifications () {
	var Notification = mongoose.model ('Notification');
	//
	// we make notifications for add / delete for Users, Opportunities, Programs, and Projects
	//
	var objects = ['User', 'Program', 'Project', 'Opportunity'];
	var events = ['Add', 'Delete', 'UpdateAny'];
	var prefix = 'not';
	var codes = [];
	objects.forEach (function (obj) {
		var lobj = obj.toLowerCase();
		events.forEach (function (evt) {
			var levt = evt.toLowerCase();
			codes.push ({
				code     : [prefix, levt, lobj].join('-'),
				name     : evt+' '+obj,
				// question : 'Notify me of object: ['+obj+'] event: ['+evt+']',
				target   : obj,
				// subject  : 'subject default',
				// body     : 'body default',
				event    : evt
			});
		});
	});
	// console.log (codes);
	return Promise.all (codes.map (function (code) {
		var notification = new Notification ({
			code        : code.code,
			name        : code.name,
			// description : code.name,
			// question    : code.question,
			target      : code.target,
			event       : code.event
			// subject     : code.subject,
			// body        : code.body
		});
		return new Promise (function (resolve, reject) {
			Notification.find ({code:code.code}, function (err, result) {
				if (err || result.length > 0) resolve ();
				else {
					notification.save (function (err, m) {
						// if (err) console.error (err);
						resolve (m);
					});
				}
			});
		});
	}));
}

function seedCapabilities () {
	var Skill = mongoose.model ('Skill');
	var capabilities = [
		{tags:[], key:'c01', code:'agile-coach',                                            text:'Agile Coach',                                               description:'Experience transforming initiatives to deliver lasting change within agencies that focus on delivering value for citizens.'},
		{tags:[], key:'c02', code:'backend-web-developer',                                  text:'Backend Web Developer',                                     description:'Experience using modern, open source software to prototype and deploy backend web applications, including all aspects of server-side processing, data storage, and integration with frontend development.'},
		{tags:[], key:'c03', code:'business-analyst',                                       text:'Business Analyst',                                          description:'Familiar with a range of digital/web services and solutions, ideally where open source and cloud technologies and agile development methodologies have been applied. An eye for detail, excellent communication skills, ability to rationalize complex information to make it understandable for others to work, and ability to interrogate reported information and challenge sources where inconsistencies are found.'},
		{tags:[], key:'c04', code:'delivery-manager',                                       text:'Delivery Manager (Scrum Master)',                           description:'Experience setting up teams for successful delivery by removing obstacles (or blockers to progress), constantly helping the team to become more self-organizing, and enabling the work the team does rather than impose how it’s done.'},
		{tags:[], key:'c05', code:'devops-engineer',                                        text:'DevOps Engineer',                                           description:'Experience serving as the engineer of complex technology implementations in a product-centric environment. Comfortable with bridging the gap between legacy development or operations teams and working toward a shared culture and vision. Works tirelessly to arm developers with the best tools and ensuring system uptime and performance.'},
		{tags:[], key:'c06', code:'digital-performance-analyst',                            text:'Digital Performance Analyst',                               description:'Experience specifying, collecting, and presenting key performance data and analysis for a given digital service. Supports Product Managers by generating new and useful information and translating it into actions that will allow them to iteratively improve their service for users. Possesses analytical and problem-solving skills necessary for quickly developing recommendations based on the quantitative and qualitative evidence gathered via web analytics, financial data, and user feedback. Confident in explaining technical concepts to senior officials with limited technological background. And comfortable working with data, from gathering and analysis through to design and presentation.'},
		{tags:[], key:'c07', code:'frontend-web-developer',                                 text:'Frontend Web Developer',                                    description:'Experience using modern, frontend web development tools, techniques, and methods for the creation and deployment of user-facing interfaces. Is comfortable working in an agile and lean environment to routinely deploy changes.'},
		{tags:[], key:'c08', code:'interaction-designer-user-researcher-usability-tester',  text:'Interaction Designer / User Researcher / Usability Tester', description:'The Interaction Designer / User Researcher / Usability Tester is part of a highly collaborative, multi-disciplinary team focused on improving usability, user experience, and driving user adoption and engagement. They are responsible for conducting user research, analysis & synthesis, persona development, interaction design, and usability testing to create products that delight our customers.'},
		{tags:[], key:'c09', code:'product-manager',                                        text:'Product Manager',                                           description:'Experience managing the delivery, ongoing success, and continuous improvement of one or more digital products and/or platforms.'},
		{tags:[], key:'c10', code:'security-engineer',                                      text:'Security Engineer',                                         description:'Experience serving as the security engineer of complex technology implementations in a product-centric environment. Comfortable with bridging the gap between legacy development or operations teams and working toward a shared culture and vision. Works tirelessly to ensure help developers create the most secure systems in the world while enhancing the privacy of all system users. Experience with white-hat hacking and fundamental computer science concepts strongly desired.'},
		{tags:[], key:'c11', code:'technical-architect',                                    text:'Technical Architect',                                       description:'Experience serving as the manager of complex technology implementations, with an eye toward constant reengineering and refactoring to ensure the simplest and most elegant system possible to accomplish the desired need.Understands how to maximally leverage the open source community to deploy systems on infrastructure as a service providers. Comfortable with liberally sharing knowledge across a multi-disciplinary team and working within agile methodologies. A full partner in the determination of vision, objectives, and success criteria.'},
		{tags:[], key:'c12', code:'visual-designer',                                        text:'Visual Designer',                                           description:'The Visual Designer starts with a deep understanding of the goals of customers and the business so that they can create experiences that delight. Visual Designers will be well-versed in all aspects of current visual design standards and trends and will be responsible for managing project design reviews, resource planning, and execution for all project work related to visual design.'},
		{tags:[], key:'c13', code:'writer-content-designer-content-strategist',             text:'Writer / Content Designer / Content Strategist',            description:'Experience developing the strategy and execution of content across digital channels.'}
	];
	return new Promise (function (resolve, reject) {
		Skill.find ({}, function (err, skills) {
			if (err) reject (err);
			if (skills.length > 0) resolve (skills);
			else {
				Skill.collection.insert (capabilities, function (err, docs) {
					if (err) reject (err);
					else resolve (docs);
				});
			}
		});
	});
}


// report the error
function reportError (reject) {
	return function (err) {
		if (seedOptions.logResults) {
			console.log();
			console.log('Database Seeding:\t\t\t' + err);
			console.log();
		}
		reject(err);
	};
}

module.exports.start = function start(options) {
	// Initialize the default seed options
	seedOptions = _.clone(config.seedDB.options, true);

	// Check for provided options

	if (_.has(options, 'logResults')) {
		seedOptions.logResults = options.logResults;
	}

	if (_.has(options, 'seedUser')) {
		seedOptions.seedUser = options.seedUser;
	}

	if (_.has(options, 'seedAdmin')) {
		seedOptions.seedAdmin = options.seedAdmin;
	}

	var User = mongoose.model('User');
	return new Promise(function (resolve, reject) {

		var adminAccount = new User(seedOptions.seedAdmin);
		var userAccount = new User(seedOptions.seedUser);
		var devAccount = new User ({
			username: 'dev',
			provider: 'local',
			email: 'dev@localhost.com',
			firstName: 'Test',
			lastName: 'Developer',
			displayName: 'Test Developer',
			roles: ['user']
		});
		var govAccount = new User ({
			username: 'gov',
			provider: 'local',
			email: 'gov@localhost.com',
			firstName: 'Test',
			lastName: 'Government',
			displayName: 'Test Government',
			roles: ['user', 'gov']
		});
		Promise.resolve ()
		.then (seedCapabilities)
		.then (seedNotifications)
		.then (function () {
			// If production only seed admin if it does not exist
			if (isProduction) {
				User.generateRandomPassphrase()
					.then(function (random) {
						var passed = process.env.ADMINPW;
						return passed || 'adminadmin';
					})
					.then(seedTheUser(adminAccount))
					.then(function () {
						resolve();
					})
					.catch(reportError(reject));
			} else {
				// Add both Admin and User account
				Promise.resolve ()
				//
				// dev account
				//
				.then(function () { return 'devdev'; })
				.then(seedTheUser(devAccount))
				//
				// gov account
				//
				.then(function () { return 'govgov'; })
				.then(seedTheUser(govAccount))
				//
				// admin account
				//
				.then (User.generateRandomPassphrase())
				.then(function (random) {
					var passed = process.env.ADMINPW;
					console.log (passed);
					return passed || 'adminadmin';
				})
				.then(seedTheUser(adminAccount))
				//
				// general user account
				//
				.then(function () { return 'useruser'; })
				.then(seedTheUser(userAccount))
				//
				// done
				//
				.then(function () {
					resolve();
				})
				.catch(reportError(reject));
			}

		})
		.catch (reportError(reject));

	});
};
