/* tslint:disable:no-console */
'use strict';

import connectMongo from 'connect-mongo';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import fs from 'fs';
import http from 'http';
import https from 'https';
import passport from 'passport';
import path from 'path';
import socketio from 'socket.io';
import config from '../ApplicationConfig';

class SocketIOController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: SocketIOController;

	private MongoStore = connectMongo(session);

	private constructor() {}

	// Define the Socket.io configuration method
	public init = (app, db) => {
		let server;
		if (config.secure && config.secure.ssl === true) {
			// Load SSL key and certificate
			const privateKey = fs.readFileSync(path.resolve(config.secure.privateKey), 'utf8');
			const certificate = fs.readFileSync(path.resolve(config.secure.certificate), 'utf8');
			let caBundle;

			try {
				caBundle = fs.readFileSync(path.resolve(config.secure.caBundle), 'utf8');
			} catch (err) {
				console.log("Warning: couldn't find or read caBundle file");
			}

			const options = {
				key: privateKey,
				cert: certificate,
				ca: caBundle,
				//  requestCert : true,
				//  rejectUnauthorized : true,
				secureProtocol: 'TLSv1_method',
				ciphers: [
					'ECDHE-RSA-AES128-GCM-SHA256',
					'ECDHE-ECDSA-AES128-GCM-SHA256',
					'ECDHE-RSA-AES256-GCM-SHA384',
					'ECDHE-ECDSA-AES256-GCM-SHA384',
					'DHE-RSA-AES128-GCM-SHA256',
					'ECDHE-RSA-AES128-SHA256',
					'DHE-RSA-AES128-SHA256',
					'ECDHE-RSA-AES256-SHA384',
					'DHE-RSA-AES256-SHA384',
					'ECDHE-RSA-AES256-SHA256',
					'DHE-RSA-AES256-SHA256',
					'HIGH',
					'!aNULL',
					'!eNULL',
					'!EXPORT',
					'!DES',
					'!RC4',
					'!MD5',
					'!PSK',
					'!SRP',
					'!CAMELLIA'
				].join(':'),
				honorCipherOrder: true
			};

			// Create new HTTPS Server
			server = https.createServer(options, app);
		} else {
			// Create a new HTTP server
			server = http.createServer(app);
		}
		// Create a new Socket.io server
		const io = socketio.listen(server);

		// Create a MongoDB storage object
		const mongoStore = new this.MongoStore({
			mongooseConnection: db,
			collection: config.sessionCollection
		});

		// Intercept Socket.io's handshake request
		io.use((socket, next) => {
			// Use the 'cookie-parser' module to parse the request cookies
			cookieParser(config.sessionSecret)(socket.request, null, err => {
				// Get the session id from the request cookies
				const sessionId = socket.request.signedCookies ? socket.request.signedCookies[config.sessionKey] : undefined;

				if (!sessionId) {
					return next(new Error('sessionId was not found in socket.request'));
				}

				// Use the mongoStorage instance to get the Express session information
				mongoStore.get(sessionId, (sessErr, sess) => {
					if (sessErr) {
						return next(sessErr);
					}
					if (!sess) {
						return next(new Error('session was not found for ' + sessionId));
					}

					// Set the Socket.io session information
					socket.request.session = sess;

					// Use Passport to populate the user details
					passport.initialize()(socket.request, null, () => {
						passport.session()(socket.request, {}, () => {
							if (socket.request.user) {
								next(null);
							} else {
								next(new Error('User is not authenticated'));
							}
						});
					});
				});
			});
		});

		return server;
	};
}

export default SocketIOController.getInstance();
