'use strict';

import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import { Types } from 'mongoose';
import multer from 'multer';
import config from '../../../../config/ApplicationConfig';
import MongooseController from '../../../../config/lib/MongooseController';
import CoreServerErrors from '../../../core/server/controllers/CoreServerErrors';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import ProjectsServerController from '../../../projects/server/controllers/ProjectsServerController';
import { IUserModel, UserModel } from '../../../users/server/models/UserModel';
import { IProgramModel, ProgramModel } from '../models/ProgramModel';

class ProgramsServerController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: ProgramsServerController;

	private constructor() {
		this.getMyAdminPrograms = this.getMyAdminPrograms.bind(this);
		this.members = this.members.bind(this);
		this.listMembers = this.listMembers.bind(this);
	}

	public async getMyAdminPrograms(req: Request, res: Response): Promise<void> {
		try {
			const me = CoreServerHelpers.summarizeRoles(req.user && (req.user as IUserModel).roles ? (req.user as IUserModel).roles : null);
			const search = me.isAdmin ? {} : { code: { $in: me.programs.admin } };
			const myPrograms = await ProgramModel.find(search)
				.select('code title short')
				.exec();
			res.json(myPrograms);
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	}

	// return a list of all program members. this means all members NOT
	// including users who have requested access and are currently waiting
	public async members(program: IProgramModel): Promise<IUserModel[]> {
		return await UserModel.find({ roles: this.memberRole(program) })
			.select('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle')
			.exec();
	}

	// return a list of all users who are currently waiting to be added to the
	// program member list
	public requests = (program, cb) => {
		MongooseController.mongoose
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
		ProgramModel.schema.statics.findUniqueCode(program.title, null, newcode => {
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

		// Ensure that the program is only viewable when published or when the user is either the admin for the program or a root admin
		if (req.program.isPublished || req.user && (req.user.roles.indexOf(this.adminRole(req.program)) !== -1 || req.user.roles.indexOf('admin') !== -1)) {
			res.json(this.decorate(req.program, req.user ? req.user.roles : []));
		} else {
			return res.status(403).send({
				message: 'User is not authorized'
			});
		}
	};

	// update the document, make sure to apply audit. We don't mess with the
	// code if they change the title as that would mean reworking all the roles
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
		const me = CoreServerHelpers.summarizeRoles(req.user && req.user.roles ? req.user.roles : null);
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

	// Returns a list of members for the given program
	public async listMembers(req: Request, res: Response): Promise<void> {
		try {
			const users = await this.members(req.program);
			res.json(users);
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	}

	// -------------------------------------------------------------------------
	//
	// this is the service front to the members call
	//
	// -------------------------------------------------------------------------
	public listRequests = (req, res) => {
		this.requests(req.program, (err, users) => {
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

	// Confirm a member on the program
	public async confirmMember(req: Request, res: Response): Promise<void> {
		const user = req.model;
		this.unsetProgramRequest(req.program, user);
		this.setProgramMember(req.program, user);
		try {
			const savedUser = await user.save();
			res.json(savedUser);
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	}

	public async denyMember(req: Request, res: Response): Promise<void> {
		const user = req.model;
		this.unsetProgramRequest(req.program, user);
		this.unsetProgramMember(req.program, user);
		try {
			const savedUser = await user.save();
			res.json(savedUser);
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	}

	// -------------------------------------------------------------------------
	//
	// new empty program
	//
	// -------------------------------------------------------------------------
	public new = (req, res) => {
		const p = new ProgramModel();
		res.json(p);
	};

	// Get a program by ID
	public async programByID(req: Request, res: Response, next: NextFunction, id: string): Promise<void> {
		let queryObject: any;
		if (id.substr(0, 3) === 'pro') {
			queryObject = { code: id };
		} else {
			if (!Types.ObjectId.isValid(id)) {
				res.status(400).send({
					message: 'Program is invalid'
				});
			} else {
				queryObject = { _id: id };
			}
		}

		try {
			const program = await ProgramModel.findOne(queryObject)
				.populate('createdBy', 'displayName')
				.populate('updatedBy', 'displayName')
				.exec();

			if (!program) {
				res.status(404).send({
					message: 'No program with that identifier has been found'
				});
			} else {
				req.program = program;
				next();
			}
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	}

	// -------------------------------------------------------------------------
	//
	// Logo upload
	//
	// -------------------------------------------------------------------------
	public logo = (req, res) => {
		const program = req.program;
		const storage = multer.diskStorage(config.uploads.diskStorage);
		const upload = multer({ storage }).single('logo');
		const up = CoreServerHelpers.fileUploadFunctions(program, 'logo', req, res, upload, program.logo);

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
