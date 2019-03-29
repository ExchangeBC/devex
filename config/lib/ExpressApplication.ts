/* tslint:disable:no-console */
'use strict';

import bodyParser from 'body-parser';
import compress from 'compression';
import flash from 'connect-flash';
import connectMongo from 'connect-mongo';
import cookieParser from 'cookie-parser';
import express from 'express';
import hbs from 'express-hbs';
import session from 'express-session';
import helmet from 'helmet';
import _ from 'lodash';
import lusca from 'lusca';
import methodOverride from 'method-override';
import { Connection } from 'mongoose';
import morgan from 'morgan';
import path from 'path';
import favicon from 'serve-favicon';
import CapabilitiesRouter from '../../modules/capabilities/server/routes/CapabilitiesRouter';
import CoreRouter from '../../modules/core/server/routes/CoreRouter';
import MessageHandlerRouter from '../../modules/messages/server/routes/MessagesHandlerRoutes';
import MessagesRouter from '../../modules/messages/server/routes/MessagesRouter';
import OpportunitiesRouter from '../../modules/opportunities/server/routes/OpportunitiesRouter';
import OrgsRouter from '../../modules/orgs/server/routes/OrgsRouter';
import ProgramsRouter from '../../modules/programs/server/routes/ProgramsRouter';
import ProjectsRouter from '../../modules/projects/server/routes/ProjectsRouter';
import ProposalsRouter from '../../modules/proposals/server/routes/ProposalsRouter';
import UserConfig from '../../modules/users/server/config/UserConfig';
import AdminRouter from '../../modules/users/server/routes/AdminRouter';
import config from '../ApplicationConfig';
import Logger from './LoggerUtil';
import SocketIOController from './SocketIOController';

class ExpressApplication {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: ExpressApplication;

	private MongoStore = connectMongo(session);
	private logger = new Logger();

	private constructor() {
		this.init = this.init.bind(this);
	}

	/**
	 * Initialize the Express application
	 */
	public init(db: Connection): express.Application {
		// Declare a new token for morgan to use in the log output
		morgan.token('userid', (req: any, res: any) => {
			return req.user ? req.user.displayName + ' <' + req.user.email + '>' : 'anonymous';
		});

		// Initialize express app
		let app: express.Application = express();

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

		// Initialize modules server routes
		this.initModulesServerRoutes(app);

		// Initialize error routes
		this.initErrorRoutes(app);

		// Configure Socket.io
		app = this.configureSocketIO(app, db);

		return app;
	}

	// Initialize local variables
	private initLocalVariables(app: express.Application): void {
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
		app.locals.allowCapabilityEditing = config.allowCapabilityEditing || false;
		app.locals.googleRecaptchaSiteID = config.app.googleRecaptchaSiteID;

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
					const result = /json|text|javascript|css|font|svg/.test(res.getHeader('Content-Type') as string);
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
		app.engine(
			'server.view.html',
			hbs.express4({
				extname: '.server.view.html'
			})
		);
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
		UserConfig.init(app);
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
	 * Configure the modules server routes
	 */
	private initModulesServerRoutes(app: express.Application): void {
		MessagesRouter.setupRoutes(app);
		MessageHandlerRouter.setupRoutes(app);
		OrgsRouter.setupRoutes(app);
		OpportunitiesRouter.setupRoutes(app);
		ProgramsRouter.setupRoutes(app);
		ProjectsRouter.setupRoutes(app);
		CapabilitiesRouter.setupRoutes(app);
		AdminRouter.setupRoutes(app);
		ProposalsRouter.setupRoutes(app);
		CoreRouter.setupRoutes(app);
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

			res.status(500).json({message: "Oops that didn't work"});
		});
	};

	/**
	 * Configure Socket.io
	 */
	private configureSocketIO = (app, db) => {
		// Load the Socket.io configuration
		const server = SocketIOController.init(app, db);

		// Return server object
		return server;
	};
}

export default ExpressApplication.getInstance();
