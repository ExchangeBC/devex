/* tslint:disable:no-console */
'use strict';

import bodyParser from 'body-parser';
import compress from 'compression';
import connectMongo from 'connect-mongo';
import cookieParser from 'cookie-parser';
import express from 'express';
import hbs from 'express-handlebars';
import session from 'express-session';
import helmet from 'helmet';
import _ from 'lodash';
import lusca from 'lusca';
import methodOverride from 'method-override';
import morgan from 'morgan';
import path from 'path';
import { CapabilitiesPolicy } from '../../modules/capabilities/server/policies/capabilities.server.policy';
import { CapabilitiesRouter } from '../../modules/capabilities/server/routes/capabilities.server.routes';
import { CoreRouter } from '../../modules/core/server/routes/core.server.routes';
import { MessageHandlerRouter } from '../../modules/messages/server/routes/messages.handler.server.routes';
import { MessagesRouter } from '../../modules/messages/server/routes/messages.server.routes';
import { OpportunitiesPolicy } from '../../modules/opportunities/server/policies/opportunities.server.policy';
import { OpportunitiesRouter } from '../../modules/opportunities/server/routes/opportunities.server.routes';
import { OrgsPolicy } from '../../modules/orgs/server/policies/orgs.server.policy';
import { OrgsRouter } from '../../modules/orgs/server/routes/orgs.server.routes';
import { ProjectsPolicy } from '../../modules/projects/server/policies/projects.server.policy';
import { ProjectsRouter } from '../../modules/projects/server/routes/projects.server.routes';
import { UsersConfig } from '../../modules/users/server/config/users.server.config';
import { AdminRouter } from '../../modules/users/server/routes/admin.server.routes';
import * as config from '../config';
import { Logger } from './logger';

const flash = require('connect-flash'); // tslint:disable-line
const favicon = require('serve-favicon'); // tslint:disable-line

export class ExpressApplication {
	// private MongoStore = connectMongo(session);
	private MongoStore = connectMongo(session);
	private logger = new Logger();

	/**
	 * Initialize the Express application
	 */
	public init = db => {
		// Declare a new token for morgan to use in the log output
		morgan.token('userid', (req: any, res: any) => {
			return req.user ? req.user.displayName + ' <' + req.user.email + '>' : 'anonymous';
		});

		// Initialize express app
		let app = express();

		// Initialize local variables
		this.initLocalVariables(app);

		// Initialize Express middleware
		this.initMiddleware(app);

		// Initialize Express view engine
		this.initViewEngine(app);

		// Initialize Helmet security headers
		this.initHelmetHeaders(app);

		// Initialize modules static client routes, before session!
		this.initModulesClientRoutes(app);

		// Initialize Express session
		this.initSession(app, db);

		// Initialize Modules configuration
		this.initModulesConfiguration(app, db);

		// Initialize modules server authorization policies
		this.initModulesServerPolicies();

		// Initialize modules server routes
		this.initModulesServerRoutes(app);

		// Initialize error routes
		this.initErrorRoutes(app);

		// Configure Socket.io
		app = this.configureSocketIO(app, db);

		return app;
	};

	// Initialize local variables
	private initLocalVariables = app => {
		// Setting application local variables
		app.locals.title = config.app.title;
		app.locals.description = config.app.description;
		if (config.secure && config.secure.ssl === true) {
			app.locals.secure = config.secure.ssl;
		}
		app.locals.keywords = config.app.keywords;
		app.locals.googleAnalyticsTrackingID = config.app.googleAnalyticsTrackingID;
		app.locals.jsFiles = config.files.client.js;
		app.locals.cssFiles = config.files.client.css;
		app.locals.livereload = config.livereload;
		app.locals.logo = config.logo;
		app.locals.favicon = config.favicon;
		app.locals.env = process.env.NODE_ENV;
		app.locals.domain = config.domain;
		app.locals.sessionTimeout = config.sessionTimeout || 300;
		app.locals.sessionTimeoutWarning = config.sessionTimeoutWarning || 300;

		// Passing the request url to environment locals
		app.use((req, res, next) => {
			res.locals.host = req.protocol + '://' + req.hostname;
			res.locals.url = req.protocol + '://' + req.headers.host + req.originalUrl;
			next();
		});

		app.enable('trust proxy');
	};

	// Initialize application middleware
	private initMiddleware = app => {
		// Should be placed before express.static
		app.use(
			compress({
				filter(req, res) {
					const result = /json|text|javascript|css|font|svg/.test(res.getHeader('Content-Type').toString());
					return result;
				},
				level: 9
			})
		);

		app.use('/uploads/*', (req, res, next) => {
			const pathname = req.baseUrl;
			if (pathname.indexOf('file-') !== -1) {
				res.status(403).send('<h1>403 Forbidden</h1>');
			} else {
				next();
			}
		});

		// Initialize favicon middleware
		app.use(favicon(app.locals.favicon));

		// Enable logger (morgan) if enabled in the configuration file
		if (_.has(config, 'log.format')) {
			app.use(morgan(this.logger.getLogFormat(), this.logger.getMorganOptions()));
		}

		// Environment dependent middleware
		if (process.env.NODE_ENV === 'development') {
			// Disable views cache
			app.set('view cache', false);
		} else if (process.env.NODE_ENV === 'production') {
			app.locals.cache = 'memory';
		}

		// Request body parsing middleware should be above methodOverride
		app.use(
			bodyParser.urlencoded({
				extended: true,
				limit: '50mb'
			})
		);
		app.use(bodyParser.json({ limit: '50mb' }));
		app.use(methodOverride());

		// Add the cookie parser and flash middleware
		app.use(cookieParser());
		app.use(flash());
	};

	/**
	 * Configure view engine
	 */
	private initViewEngine = app => {
		// app.engine(
		// 	'server.view.html',
		// 	hbs.express4({
		// 		extname: '.server.view.html'
		// 	})
		// );
		// app.set('view engine', 'server.view.html');
		// app.set('views', path.resolve('./'));
		app.engine('server.view.html', hbs({ defaultLayout: 'main' }));
		app.set('view engine', 'server.view.html');
		app.set('views', path.resolve('./'));
	};

	/**
	 * Configure Express session
	 */
	private initSession = (app, db) => {
		// Express MongoDB session storage
		const sessionParameters: any = {
			saveUninitialized: true,
			resave: false,
			unset: 'destroy',
			secret: config.sessionSecret,
			name: config.sessionKey,
			cookie: {
				httpOnly: config.sessionCookie.httpOnly,
				secure: config.sessionCookie.secure && config.secure.ssl
			}
		};
		//
		// CC : BA-698 hopefully fix the memory leak issue. If this
		// does not work in production, then make the shareConnection switch false
		// to try giving mongoDb connector its own connection and not
		// share the mongoose one
		//
		const shareConnection = true;
		if (shareConnection) {
			sessionParameters.store = new this.MongoStore({
				mongooseConnection: db,
				collection: config.sessionCollection
			});
		} else {
			sessionParameters.store = new this.MongoStore({
				url: config.db.uri,
				collection: config.sessionCollection
			});
		}
		//
		// CC : modified so that session persists in development
		// an on localhost - makes testing easier - still remove
		// stored session for production, which would mean all
		// uses of openshift
		//
		if (config.app.domain === 'http://localhost:3030' || process.env.NODE_ENV === 'development') {
			sessionParameters.cookie.maxAge = config.sessionCookie.maxAge;
		}
		app.use(session(sessionParameters));
		// Add Lusca CSRF Middleware
		app.use(lusca(config.csrf));
	};

	/**
	 * Invoke modules server configuration
	 */
	private initModulesConfiguration = (app, db) => {
		config.files.server.configs.forEach(configPath => {
			require(path.join(__dirname + '../../../', configPath))(app, db);
		});

		const usersConfig = new UsersConfig();
		usersConfig.init(app);
	};

	/**
	 * Configure Helmet headers configuration
	 */
	private initHelmetHeaders = app => {
		// Use helmet to secure Express headers
		const SIX_MONTHS = 15778476000;
		app.use(helmet.frameguard());
		app.use(helmet.xssFilter());
		app.use(helmet.noSniff());
		app.use(helmet.ieNoOpen());
		app.use(
			helmet.hsts({
				maxAge: SIX_MONTHS,
				includeSubdomains: true,
				force: true
			})
		);
		app.disable('x-powered-by');
	};

	/**
	 * Configure the modules static routes
	 */
	private initModulesClientRoutes = app => {
		// Setting the app router and static folder
		app.use('/', express.static(path.resolve('./public'), { maxAge: 86400000 }));

		// Globbing static routing
		config.folders.client.forEach(staticPath => {
			app.use(staticPath, express.static(path.resolve('./' + staticPath)));
		});
	};

	/**
	 * Configure the modules ACL policies
	 */
	private initModulesServerPolicies = () => {
		const orgsPolicy = new OrgsPolicy();
		orgsPolicy.invokeRolesPolicies();

		const oppPolicy = new OpportunitiesPolicy();
		oppPolicy.invokeRolesPolicies();

		const projPolicy = new ProjectsPolicy();
		projPolicy.invokeRolesPolicies();

		const capPolicy = new CapabilitiesPolicy();
		capPolicy.invokeRolesPolicies();

		// Globbing policy files
		config.files.server.policies.forEach(policyPath => {
			require(path.join(__dirname + '../../../', policyPath)).invokeRolesPolicies();
		});
	};

	/**
	 * Configure the modules server routes
	 */
	private initModulesServerRoutes = app => {
		// Globbing routing files
		config.files.server.routes.forEach(routePath => {
			require(path.join(__dirname + '../../../', routePath))(app);
		});

		const messagesRouter = new MessagesRouter();
		messagesRouter.setupRoutes(app);

		const messageHandlerRouter = new MessageHandlerRouter();
		messageHandlerRouter.setupRoutes(app);

		const orgsRouter = new OrgsRouter();
		orgsRouter.setupRoutes(app);

		const opportunitiesRouter = new OpportunitiesRouter();
		opportunitiesRouter.setupRoutes(app);

		const projectsRouter = new ProjectsRouter();
		projectsRouter.setupRoutes(app);

		const capabilitiesRouter = new CapabilitiesRouter();
		capabilitiesRouter.setupRoutes(app);

		const adminRouter = new AdminRouter();
		adminRouter.setupRoutes(app);

		const coreRouter = new CoreRouter();
		coreRouter.setupRoutes(app);
	};

	/**
	 * Configure error handling
	 */
	private initErrorRoutes = app => {
		app.use((err, req, res, next) => {
			// If the error object doesn't exists
			if (!err) {
				return next();
			}

			// Log it
			console.error(err.stack);

			// Redirect to error page
			res.redirect('/server-error');
		});
	};

	/**
	 * Configure Socket.io
	 */
	private configureSocketIO = (app, db) => {
		// Load the Socket.io configuration
		const server = require('./socket.io')(app, db);

		// Return server object
		return server;
	};
}
