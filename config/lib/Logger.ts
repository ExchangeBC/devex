/* tslint:disable:no-console */
'use strict';

import chalk from 'chalk';
import fs from 'fs';
import _ from 'lodash';
import winston from 'winston';
import config from '../ApplicationConfig';

export default class Logger {
	private logger;

	constructor() {
		this.logger = new winston.Logger({
			transports: [
				new winston.transports.Console({
					level: 'info',
					colorize: true,
					showLevel: true,
					handleExceptions: true,
					humanReadableUnhandledException: true
				})
			],
			exitOnError: false
		});

		this.logger.stream = {
			write: (msg) => {
				this.logger.info(msg);
			}
		};

		this.setupFileLogger();
	}

	// Instantiate a winston's File transport for disk file logging
	public setupFileLogger = () => {
		const fileLoggerTransport = this.getLogOptions();
		if (!fileLoggerTransport) {
			return false;
		}

		try {
			// Check first if the configured path is writable and only then
			// instantiate the file logging transport
			if (fs.openSync(fileLoggerTransport.filename, 'a+')) {
				this.logger.add(winston.transports.File, fileLoggerTransport);
			}

			return true;
		} catch (err) {
			if (process.env.NODE_ENV !== 'test') {
				console.log();
				console.log(chalk.red('An error has occured during the creation of the File transport logger.'));
				console.log(chalk.red(err));
				console.log();
			}

			return false;
		}
	};

	/**
	 * The options to use with winston logger
	 *
	 * Returns a Winston object for logging with the File transport
	 */
	public getLogOptions = () => {
		const loggerConfig = _.clone(config);
		const configFileLogger = loggerConfig.log.fileLogger;

		if (!_.has(loggerConfig, 'log.fileLogger.directoryPath') || !_.has(loggerConfig, 'log.fileLogger.fileName')) {
			console.log('unable to find logging file configuration');
			return false;
		}

		const logPath = configFileLogger.directoryPath + '/' + configFileLogger.fileName;

		return {
			level: 'debug',
			colorize: false,
			filename: logPath,
			timestamp: true,
			maxsize: configFileLogger.maxsize ? configFileLogger.maxsize : 10485760,
			maxFiles: configFileLogger.maxFiles ? configFileLogger.maxFiles : 2,
			json: _.has(configFileLogger, 'json') ? configFileLogger.json : false,
			eol: '\n',
			tailable: true,
			showLevel: true,
			handleExceptions: true,
			humanReadableUnhandledException: true
		};
	};

	/**
	 * The options to use with morgan logger
	 *
	 * Returns a log.options object with a writable stream based on winston
	 * file logging transport (if available)
	 */
	public getMorganOptions = () => {
		return {
			stream: this.logger.stream,
			//
			// cc:logging: filter out all BUT api and uploads access
			//
			skip(req, res) {
				const isAPI = req.path.substr(0, 4) === '/api';
				const isUpload = req.path.substr(0, 7) === '/upload';
				const displayIf = isAPI || isUpload;
				return !displayIf;
			}
		};
	};

	/**
	 * The format to use with the logger
	 *
	 * Returns the log.format option set in the current environment configuration
	 */
	public getLogFormat = function getLogFormat() {
		const format = config.log && config.log.format ? config.log.format.toString() : 'combined';

		return format;
	};
}
