/* tslint:disable:no-console */
'use strict';

import { Request, RequestHandler, Response } from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import _ from 'lodash';
import moment from 'moment-timezone';
import { Document } from 'mongoose';
import config from '../../../../config/ApplicationConfig';
import CoreServerErrors from './CoreServerErrors';

interface IUserRoleSummary {
	isAdmin: boolean;
	isUser: boolean;
	programs: {
		admin: string[];
		member: string[];
		request: string[];
	},
	projects: {
		admin: string[];
		member: string[];
		request: string[];
	},
	opportunities: {
		admin: string[];
		member: string[];
		request: string[];
	}
}

class CoreServerHelpers {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: CoreServerHelpers;

	private constructor() {}

	public generateCode = s => {
		return s
			.toLowerCase()
			.replace(/\W/g, '-')
			.replace(/-+/, '-');
	};

	public applyAudit = (model, user) => {
		model.updated = Date.now();
		model.updatedBy = user && user._id ? user._id : null;
		if (!model.createdBy) {
			model.created = model.updated;
			model.createdBy = model.updatedBy;
		}
	};

	public isNumeric = n => {
		return !isNaN(parseFloat(n)) && isFinite(n);
	};

	public numericOrZero = n => {
		return this.isNumeric(n) ? parseFloat(n) : 0;
	};

	public summarizeRoles(roles: string[]): IUserRoleSummary {
		const summary = {
			isAdmin: false,
			isUser: false,
			programs: {
				member: [],
				admin: [],
				request: []
			},
			projects: {
				member: [],
				admin: [],
				request: []
			},
			opportunities: {
				member: [],
				admin: [],
				request: []
			}
		};
		if (roles) {
			_.each(roles, role => {
				if (role === 'admin') {
					summary.isAdmin = true;
				} else if (role === 'user') {
					summary.isUser = true;
				} else {
					let parts: string[];
					let lastPart: string;
					parts = role.split('-');
					lastPart = parts.pop();
					if (parts[0] === 'prj') {
						if (lastPart === 'request') {
							summary.projects.request.push(parts.join('-'));
						} else if (lastPart === 'admin') {
							summary.projects.admin.push(parts.join('-'));
						} else {
							summary.projects.member.push(role);
						}
					} else if (parts[0] === 'opp') {
						if (lastPart === 'request') {
							summary.opportunities.request.push(parts.join('-'));
						} else if (lastPart === 'admin') {
							summary.opportunities.admin.push(parts.join('-'));
						} else {
							summary.opportunities.member.push(role);
						}
					} else {
						if (lastPart === 'request') {
							summary.programs.request.push(parts.join('-'));
						} else if (lastPart === 'admin') {
							summary.programs.admin.push(parts.join('-'));
						} else {
							summary.programs.member.push(role);
						}
					}
				}
			});
		}
		return summary;
	};

	public fileUploadFunctions(doc: Document, field: string, req: Request, res: Response, upload: RequestHandler, existingImageUrl: string) {
		return {
			uploadImage: () => {
				return new Promise((resolve, reject) => {
					upload(req, res, uploadError => {
						if (uploadError) {
							reject(CoreServerErrors.getErrorMessage(uploadError));
						} else {
							resolve();
						}
					});
				});
			},
			updateDocument: async (): Promise<void> => {
				doc[field] = config.uploads.fileUpload.display + req.file.filename;
				await doc.save();
			},
			deleteOldImage: () => {
				return new Promise((resolve, reject) => {
					if (existingImageUrl !== doc[field] && existingImageUrl !== 'img/default.png') {
						fs.unlink('./public/' + existingImageUrl, () => {
							resolve();
						});
					} else {
						resolve();
					}
				});
			}
		};
	}

	public formatMoney = (amount, decPlaces?, centSep?, thouSep?) => {
		const precision = isNaN((decPlaces = Math.abs(decPlaces))) ? 2 : decPlaces;
		const centChar = centSep === undefined ? '.' : centSep;
		const thouChar = thouSep === undefined ? ',' : thouSep;
		const negChar = amount < 0 ? '-' : '';
		const strNum = String(parseInt((amount = Math.abs(Number(amount) || 0).toFixed(precision)), 10));
		let thousands = strNum.length;
		thousands = thousands > 3 ? thousands % 3 : 0;
		return (
			'$' +
			negChar +
			(thousands ? strNum.substr(0, thousands) + thouChar : '') +
			strNum.substr(thousands).replace(/(\d{3})(?=\d)/g, '$1' + thouChar) +
			(precision
				? centChar +
				  Math.abs(amount)
						.toFixed(precision)
						.slice(2)
				: '')
		);
	};

	public formatDate(date: Date): string {
		if (!date) {
			return '';
		}

		return moment(date)
			.tz('America/Vancouver')
			.format('MMMM Do, YYYY [at] HH:mm z');
	};

	public modelFindUniqueCode = (model, prefix, title, suffix, callback) => {
		prefix = prefix || '';
		const possible =
			prefix +
			'-' +
			title
				.toLowerCase()
				.replace(/\W/g, '-')
				.replace(/-+/, '-') +
			(suffix || '');
		model.findOne(
			{
				code: possible
			},
			(err, result) => {
				if (!err) {
					if (!result) {
						callback(possible);
					} else {
						return model.schema.statics.findUniqueCode(title, (suffix || 0) + 1, callback);
					}
				} else {
					callback(null);
				}
			}
		);
	};

	public soundex = s => {
		const arr = s.toLowerCase().split('');
		const f = arr.shift();
		let r = '';
		const codes = {
			a: '',
			e: '',
			i: '',
			o: '',
			u: '',
			b: 1,
			f: 1,
			p: 1,
			v: 1,
			c: 2,
			g: 2,
			j: 2,
			k: 2,
			q: 2,
			s: 2,
			x: 2,
			z: 2,
			d: 3,
			t: 3,
			l: 4,
			m: 5,
			n: 5,
			r: 6
		};
		r = arr
			.map(v => {
				return codes[v];
			})
			.filter((v, i, a) => {
				return i === 0 ? v !== codes[f] : v !== a[i - 1];
			})
			.join('');
		r += f;
		return (r + '000').slice(0, 4).toUpperCase();
	};

	// Get some json from a rest interface
	public getJSON = options => {
		return new Promise((resolve, reject) => {
			//
			// which proto are we using?
			//
			const getFunc = options._protocol === 'https' ? https.get : http.get;
			//
			// make a new request object and gather the result
			//
			const req = getFunc(options.url, res => {
				let output = '';
				res.setEncoding('utf8');
				//
				// collect data as it arrives
				//
				res.on('data', chunk => {
					output += chunk;
				});
				//
				// all done, either resolve or reject the data
				//
				res.on('end', () => {
					let obj;
					try {
						obj = JSON.parse(output);
					} catch (err) {
						console.error(err);
						console.error('Received invalid response from internal REST call: ' + output);
					}
					//
					// if inside the 200 range then treat this as AOK
					// all returned data should be of the form :
					// {
					// 		message: < your html response goes here >
					// }
					// this keeps things in line with error messages as well
					//
					if (200 <= res.statusCode && res.statusCode <= 299) {
						resolve(obj);
					} else {
						reject(obj);
					}
				});
			});
			//
			// attach an error handler, err.message will be present and therefore
			// used as the return html
			//
			req.on('error', err => {
				reject(err);
			});
			//
			// complete the request - causes it to be sent and closed on the client side
			//
			req.end();
		});
	};

	// Get some json from a rest interface
	public getJSONr = options => {
		return new Promise((resolve, reject) => {
			//
			// which proto are we using?
			//
			const reqFunc = options._protocol === 'https' ? https.request : http.request;
			//
			// make a new request object and gather the result
			//
			const req = reqFunc(options, res => {
				console.log('request started', res);
				let output = '';
				res.setEncoding('utf8');
				//
				// collect data as it arrives
				//
				res.on('data', chunk => {
					output += chunk;
				});
				//
				// all done, either resolve or reject the data
				//
				res.on('end', () => {
					const obj = JSON.parse(output);
					//
					// if inside the 200 range then treat this as AOK
					// all returned data should be of the form :
					// {
					// 		message: < your html response goes here >
					// }
					// this keeps things in line with error messages as well
					//
					if (200 <= res.statusCode && res.statusCode <= 299) {
						resolve(obj);
					} else {
						reject(obj);
					}
				});
			});
			//
			// attach an error handler, err.message will be present and therefore
			// used as the return html
			//
			req.on('error', err => {
				console.log('request error:', err);
				console.log('request :', req);
				reject(err);
			});
			//
			// complete the request - causes it to be sent and closed on the client side
			//
			req.end();
		});
	};
}

export default CoreServerHelpers.getInstance();
