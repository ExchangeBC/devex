'use strict';

import _ from 'lodash';
import mongoose from 'mongoose';
import multer from 'multer';
import config from '../../../../config/ApplicationConfig';
import CoreServerErrors from '../../../core/server/controllers/CoreServerErrors';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import ProjectsServerController from '../../../projects/server/controllers/ProjectsServerController';
import ProgramModel from '../models/ProgramModel';

class ProgramsServerController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: ProgramsServerController;

	private constructor() {}
	// -------------------------------------------------------------------------
	//
	// get a list of all my programs, but only ones I have access to as a normal
	// member or admin, just not as request
	//
	// -------------------------------------------------------------------------
	public my = (req, res) => {
		const me = CoreServerHelpers.myStuff(req.user && req.user.roles ? req.user.roles : null);
		const search = me.isAdmin ? {} : { code: { $in: me.programs.member } };
		ProgramModel.find(search)
			.select('code title short')
			.exec((err, programs) => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(programs);
				}
			});
	};

	public myadmin = (req, res) => {
		const me = CoreServerHelpers.myStuff(req.user && req.user.roles ? req.user.roles : null);
		const search = me.isAdmin ? {} : { code: { $in: me.programs.admin } };
		ProgramModel.find(search)
			.select('code title short')
			.exec((err, programs) => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(programs);
				}
			});
	};

	// -------------------------------------------------------------------------
	//
	// return a list of all program members. this means all members NOT
	// including users who have requested access and are currently waiting
	//
	// -------------------------------------------------------------------------
	public members = (program, cb) => {
		mongoose
			.model('User')
			.find({ roles: this.memberRole(program) })
			.select('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle')
			.exec(cb);
	};

	// -------------------------------------------------------------------------
	//
	// return a list of all users who are currently waiting to be added to the
	// program member list
	//
	// -------------------------------------------------------------------------
	public requests = (program, cb) => {
		mongoose
			.model('User')
			.find({ roles: this.requestRole(program) })
			.select('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle')
			.exec(cb);
	};

	// -------------------------------------------------------------------------
	//
	// create a new program. the user doing the creation will be set as the
	// administrator
	//
	// -------------------------------------------------------------------------
	public create = (req, res) => {
		const program = new ProgramModel(req.body);
		//
		// set the code, this is used for setting roles and other stuff
		//
		ProgramModel.findUniqueCode(program.title, null, newcode => {
			program.code = newcode;
			//
			// set the audit fields so we know who did what when
			//
			CoreServerHelpers.applyAudit(program, req.user);
			//
			// save and return
			//
			program.save(err => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					this.setProgramAdmin(program, req.user);
					req.user.save();
					res.json(program);
				}
			});
		});
	};

	// -------------------------------------------------------------------------
	//
	// this just takes the already queried object and pass it back
	//
	// -------------------------------------------------------------------------
	public read = (req, res) => {
		res.json(this.decorate(req.program, req.user ? req.user.roles : []));
	};

	// -------------------------------------------------------------------------
	//
	// update the document, make sure to apply audit. We don't mess with the
	// code if they change the title as that would mean reworking all the roles
	//
	// -------------------------------------------------------------------------
	public update = (req, res) => {
		if (this.ensureAdmin(req.program, req.user, res)) {
			const wasPublished = req.program.isPublished;
			const isPublished = req.body.isPublished;
			if (!wasPublished && isPublished) {
				ProjectsServerController.rePublishProjects(req.program._id);
			} else if (wasPublished && !isPublished) {
				ProjectsServerController.unPublishProjects(req.program._id);
			}
			//
			// copy over everything passed in. This will overwrite the
			// audit fields, but they get updated in the following step
			//
			const program = _.assign(req.program, req.body);
			//
			// determine what notify actions we want to send out, if any
			// if not published, then we send nothing
			//
			let notificationCodes = [];
			const doNotNotify = _.isNil(req.body.doNotNotify) ? true : req.body.doNotNotify;
			if (isPublished && !doNotNotify) {
				if (wasPublished) {
					//
					// this is an update, we send both specific and general
					//
					notificationCodes = ['not-updateany-program', 'not-update-' + program.code];
				} else {
					//
					// this is an add as it is the first time being published
					//
					notificationCodes = ['not-add-program'];
				}
			}

			program.wasPublished = program.isPublished || program.wasPublished;
			//
			// set the audit fields so we know who did what when
			//
			CoreServerHelpers.applyAudit(program, req.user);
			//
			// save
			//
			program.save(err => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					program.link = 'https://' + (process.env.DOMAIN || 'localhost') + '/programs/' + program.code;
					res.json(this.decorate(program, req.user ? req.user.roles : []));
				}
			});
		}
	};

	// -------------------------------------------------------------------------
	//
	// delete the program
	//
	// -------------------------------------------------------------------------
	public delete = (req, res) => {
		if (this.ensureAdmin(req.program, req.user, res)) {
			const program = req.program;
			program.remove(err => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(program);
				}
			});
		}
	};

	// -------------------------------------------------------------------------
	//
	// return a list of all programs
	//
	// -------------------------------------------------------------------------
	public list = (req, res) => {
		const me = CoreServerHelpers.myStuff(req.user && req.user.roles ? req.user.roles : null);
		const search = me.isAdmin ? {} : { $or: [{ isPublished: true }, { code: { $in: me.programs.admin } }] };
		ProgramModel.find(search)
			.sort('title')
			.populate('createdBy', 'displayName')
			.populate('updatedBy', 'displayName')
			.exec((err, programs) => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(this.decorateList(programs, req.user ? req.user.roles : []));
				}
			});
	};

	// -------------------------------------------------------------------------
	//
	// this is the service front to the members call
	//
	// -------------------------------------------------------------------------
	public listMembers = (req, res) => {
		exports.members(req.program, (err, users) => {
			if (err) {
				return res.status(422).send({
					message: CoreServerErrors.getErrorMessage(err)
				});
			} else {
				res.json(users);
			}
		});
	};

	// -------------------------------------------------------------------------
	//
	// this is the service front to the members call
	//
	// -------------------------------------------------------------------------
	public listRequests = (req, res) => {
		exports.requests(req.program, (err, users) => {
			if (err) {
				return res.status(422).send({
					message: CoreServerErrors.getErrorMessage(err)
				});
			} else {
				res.json(users);
			}
		});
	};

	// -------------------------------------------------------------------------
	//
	// have the current user request access
	//
	// -------------------------------------------------------------------------
	public request = (req, res) => {
		this.setProgramRequest(req.program, req.user);
		req.user.save();
		res.json({ ok: true });
	};

	// -------------------------------------------------------------------------
	//
	// deal with members
	//
	// -------------------------------------------------------------------------
	public confirmMember = (req, res) => {
		const user = req.model;
		this.unsetProgramRequest(req.program, user);
		this.setProgramMember(req.program, user);
		user.save((err, result) => {
			if (err) {
				return res.status(422).send({
					message: CoreServerErrors.getErrorMessage(err)
				});
			} else {
				res.json(result);
			}
		});
	};

	public denyMember = (req, res) => {
		const user = req.model;
		this.unsetProgramRequest(req.program, user);
		this.unsetProgramMember(req.program, user);
		user.save((err, result) => {
			if (err) {
				return res.status(422).send({
					message: CoreServerErrors.getErrorMessage(err)
				});
			} else {
				res.json(result);
			}
		});
	};

	// -------------------------------------------------------------------------
	//
	// new empty program
	//
	// -------------------------------------------------------------------------
	public new = (req, res) => {
		const p = new ProgramModel();
		res.json(p);
	};

	// -------------------------------------------------------------------------
	//
	// magic that populates the program on the request
	//
	// -------------------------------------------------------------------------
	public programByID = (req, res, next, id) => {
		if (id.substr(0, 3) === 'pro') {
			ProgramModel.findOne({ code: id })
				.populate('createdBy', 'displayName')
				.populate('updatedBy', 'displayName')
				.exec((err, program) => {
					if (err) {
						return next(err);
					} else if (!program) {
						return res.status(404).send({
							message: 'No program with that identifier has been found'
						});
					}
					req.program = program;
					next();
				});
		} else {
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).send({
					message: 'Program is invalid'
				});
			}

			ProgramModel.findById(id)
				.populate('createdBy', 'displayName')
				.populate('updatedBy', 'displayName')
				.exec((err, program) => {
					if (err) {
						return next(err);
					} else if (!program) {
						return res.status(404).send({
							message: 'No program with that identifier has been found'
						});
					}
					req.program = program;
					next();
				});
		}
	};
	// -------------------------------------------------------------------------
	//
	// Logo upload
	//
	// -------------------------------------------------------------------------
	public logo = (req, res) => {
		const program = req.program;
		const storage = multer.diskStorage(config.uploads.diskStorage);
		const upload = multer({ storage }).single('logo');
		const up = CoreServerHelpers.fileUploadFunctions(program, ProgramModel, 'logo', req, res, upload, program.logo);

		if (program) {
			up.uploadImage()
				.then(up.updateDocument)
				.then(up.deleteOldImage)
				.then(() => {
					res.json(program);
				})
				.catch(err => {
					res.status(422).send(err);
				});
		} else {
			res.status(401).send({
				message: 'invalid program or program not supplied'
			});
		}
	};

	private adminRole = program => {
		return program.code + '-admin';
	};

	private memberRole = program => {
		return program.code;
	};

	private requestRole = program => {
		return program.code + '-request';
	};

	private setProgramMember = (program, user) => {
		user.addRoles([this.memberRole(program)]);
	};

	private setProgramAdmin = (program, user) => {
		user.addRoles([this.memberRole(program), this.adminRole(program)]);
	};

	private setProgramRequest = (program, user) => {
		user.addRoles([this.requestRole(program)]);
	};

	private unsetProgramMember = (program, user) => {
		user.removeRoles([this.memberRole(program)]);
	};

	private unsetProgramAdmin = (program, user) => {
		user.removeRoles([this.memberRole(program), this.adminRole(program)]);
	};

	private unsetProgramRequest = (program, user) => {
		user.removeRoles([this.requestRole(program)]);
	};

	private ensureAdmin = (program, user, res) => {
		if (user.roles.indexOf(this.adminRole(program)) === -1 && user.roles.indexOf('admin') === -1) {
			res.status(422).send({
				message: 'User Not Authorized'
			});
			return false;
		} else {
			return true;
		}
	};

	// -------------------------------------------------------------------------
	//
	// this takes a program model, serializes it, and decorates it with what
	// relationship the user has to the program, and returns the JSON
	//
	// -------------------------------------------------------------------------
	private decorate = (programModel, roles) => {
		const program = programModel ? programModel.toJSON() : {};
		program.userIs = {
			admin: roles.indexOf(this.adminRole(program)) !== -1,
			member: roles.indexOf(this.memberRole(program)) !== -1,
			request: roles.indexOf(this.requestRole(program)) !== -1,
			gov: roles.indexOf('gov') !== -1
		};
		return program;
	};

	// -------------------------------------------------------------------------
	//
	// decorate an entire list of programs
	//
	// -------------------------------------------------------------------------
	private decorateList = (programModels, roles) => {
		return programModels.map(programModel => {
			return this.decorate(programModel, roles);
		});
	};
}

export default ProgramsServerController.getInstance();
