'use strict';

import _ from 'lodash';
import mongoose from 'mongoose';
import CoreServerErrors from '../../../core/server/controllers/CoreServerErrors';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import { IProjectModel, ProjectModel } from '../models/ProjectModel';

class ProjectsServerController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: ProjectsServerController;

	private constructor() {}

	// -------------------------------------------------------------------------
	//
	// get a list of all my projects, but only ones I have access to as a normal
	// member or admin, just not as request
	//
	// -------------------------------------------------------------------------
	public my = (req, res) => {
		const me = CoreServerHelpers.myStuff(req.user && req.user.roles ? req.user.roles : null);
		const search = me.isAdmin ? {} : { code: { $in: me.projects.member } };
		ProjectModel.find(search)
			.select('code name short')
			.exec((err, projects) => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(projects);
				}
			});
	};
	public myadmin = (req, res) => {
		ProjectModel.find(this.searchTerm(req, {}))
			.populate('program', 'code title short logo')
			.select('code name short program')
			.exec((err, projects) => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(projects);
				}
			});
	};
	// -------------------------------------------------------------------------
	//
	// return a list of all project members. this means all members NOT
	// including users who have requested access and are currently waiting
	//
	// -------------------------------------------------------------------------
	public members = (project, cb) => {
		mongoose
			.model('User')
			.find({ roles: this.memberRole(project) })
			.select('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle')
			.exec(cb);
	};

	// -------------------------------------------------------------------------
	//
	// return a list of all users who are currently waiting to be added to the
	// project member list
	//
	// -------------------------------------------------------------------------
	public requests = (project, cb) => {
		mongoose
			.model('User')
			.find({ roles: this.requestRole(project) })
			.select('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle')
			.exec(cb);
	};

	/**
	 * Create a Project
	 */
	// -------------------------------------------------------------------------
	//
	// create a new project. the user doing the creation will be set as the
	// administrator
	//
	// -------------------------------------------------------------------------
	public create = (req, res) => {
		const project = new ProjectModel(req.body);
		//
		// set the code, this is used for setting roles and other stuff
		//
		ProjectModel.schema.statics.findUniqueCode(project.name, null, newcode => {
			project.code = newcode;
			//
			// set the audit fields so we know who did what when
			//
			CoreServerHelpers.applyAudit(project, req.user);
			//
			// save and return
			//
			project.save(err => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					this.setProjectAdmin(project, req.user);
					req.user.save();
					res.json(project);
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
		res.json(this.decorate(req.project, req.user ? req.user.roles : []));
	};

	// -------------------------------------------------------------------------
	//
	// update the document, make sure to apply audit. We don't mess with the
	// code if they change the name as that would mean reworking all the roles
	//
	// -------------------------------------------------------------------------
	public update = (req, res) => {
		if (this.ensureAdmin(req.project, req.user, res)) {
			const wasPublished = req.project.isPublished;
			const isPublished = req.body.isPublished;
			// if (!wasPublished && isPublished) {
			// 	this.opportunitiesController.rePublishOpportunities(req.project.program._id, req.project._id);
			// } else if (wasPublished && !isPublished) {
			// 	this.opportunitiesController.unPublishOpportunities(req.project.program._id, req.project._id);
			// }
			//
			// copy over everything passed in. This will overwrite the
			// audit fields, but they get updated in the following step
			//
			const project = _.assign(req.project, req.body);
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
					notificationCodes = ['not-updateany-project', 'not-update-' + project.code];
				} else {
					//
					// this is an add as it is the first time being published
					//
					notificationCodes = ['not-add-project'];
				}
			}

			project.wasPublished = project.isPublished || project.wasPublished;

			//
			// set the audit fields so we know who did what when
			//
			CoreServerHelpers.applyAudit(project, req.user);
			//
			// save
			//
			project.save(err => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					project.link = 'https://' + (process.env.DOMAIN || 'localhost') + '/projects/' + project.code;
					res.json(this.decorate(project, req.user ? req.user.roles : []));
				}
			});
		}
	};

	// -------------------------------------------------------------------------
	//
	// delete the project
	//
	// -------------------------------------------------------------------------
	public delete = (req, res) => {
		if (this.ensureAdmin(req.project, req.user, res)) {
			const project = req.project;
			project.remove(err => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(project);
				}
			});
		}
	};

	// -------------------------------------------------------------------------
	//
	// return a list of all projects
	//
	// -------------------------------------------------------------------------
	public list = (req, res) => {
		ProjectModel.find(this.searchTerm(req, {}))
			.sort('activity name')
			.populate('createdBy', 'displayName')
			.populate('updatedBy', 'displayName')
			.populate('program', 'code title logo isPublished')
			.exec((err, projects) => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(this.decorateList(projects, req.user ? req.user.roles : []));
				}
			});
	};

	// -------------------------------------------------------------------------
	//
	// this is the service front to the members call
	//
	// -------------------------------------------------------------------------
	public listMembers = (req, res) => {
		this.members(req.project, (err, users) => {
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
		this.requests(req.project, (err, users) => {
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
		this.setProjectRequest(req.project, req.user);
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
		this.unsetProjectRequest(req.project, user);
		this.setProjectMember(req.project, user);
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
		this.unsetProjectRequest(req.project, user);
		this.unsetProjectMember(req.project, user);
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
	// get projects under program
	//
	// -------------------------------------------------------------------------
	public getProjectForPrograms = (req, res) => {
		ProjectModel.find(this.searchTerm(req, { program: req.program._id }))
			.sort('name')
			.populate('createdBy', 'displayName')
			.populate('updatedBy', 'displayName')
			.exec((err, projects) => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(this.decorateList(projects, req.user ? req.user.roles : []));
				}
			});
	};

	// -------------------------------------------------------------------------
	//
	// new empty project
	//
	// -------------------------------------------------------------------------
	public new = (req, res) => {
		const p = new ProjectModel();
		res.json(p);
	};

	// -------------------------------------------------------------------------
	//
	// magic that populates the project on the request
	//
	// -------------------------------------------------------------------------
	public projectByID = (req, res, next, id) => {
		if (id.substr(0, 3) === 'prj') {
			ProjectModel.findOne({ code: id })
				.populate('createdBy', 'displayName')
				.populate('updatedBy', 'displayName')
				.populate('program', 'code title logo isPublished')
				.exec((err, project) => {
					if (err) {
						return next(err);
					} else if (!project) {
						return res.status(404).send({
							message: 'No project with that identifier has been found'
						});
					}
					req.project = project;
					next();
				});
		} else {
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).send({
					message: 'Project is invalid'
				});
			}

			ProjectModel.findById(id)
				.populate('createdBy', 'displayName')
				.populate('updatedBy', 'displayName')
				.populate('program', 'code title logo isPublished')
				.exec((err, project) => {
					if (err) {
						return next(err);
					} else if (!project) {
						return res.status(404).send({
							message: 'No project with that identifier has been found'
						});
					}
					req.project = project;
					next();
				});
		}
	};

	// -------------------------------------------------------------------------
	//
	// publish or unpublish whole sets of projects by program id
	//
	// -------------------------------------------------------------------------
	public rePublishProjects = programId => {
		return this.forProgram(programId).then(projects => {
			return Promise.all(
				projects.map(project => {
					project.isPublished = project.wasPublished;
					return project.save();
				})
			);
		});
	};
	public unPublishProjects = programId => {
		return this.forProgram(programId).then(projects => {
			return Promise.all(
				projects.map(project => {
					project.wasPublished = project.isPublished;
					project.isPublished = false;
					return project.save();
				})
			);
		});
	};

	// -------------------------------------------------------------------------
	//
	// set a project role on a user
	//
	// -------------------------------------------------------------------------
	private adminRole = project => {
		return project.code + '-admin';
	};

	private memberRole = project => {
		return project.code;
	};

	private requestRole = project => {
		return project.code + '-request';
	};

	private setProjectMember = (project, user) => {
		user.addRoles([this.memberRole(project)]);
	};

	private setProjectAdmin = (project, user) => {
		user.addRoles([this.memberRole(project), this.adminRole(project)]);
	};

	private setProjectRequest = (project, user) => {
		user.addRoles([this.requestRole(project)]);
	};

	private unsetProjectMember = (project, user) => {
		user.removeRoles([this.memberRole(project)]);
	};

	private unsetProjectAdmin = (project, user) => {
		user.removeRoles([this.memberRole(project), this.adminRole(project)]);
	};

	private unsetProjectRequest = (project, user) => {
		user.removeRoles([this.requestRole(project)]);
	};

	private ensureAdmin = (project, user, res) => {
		if (user.roles.indexOf(this.adminRole(project)) === -1 && user.roles.indexOf('admin') === -1) {
			res.status(422).send({
				message: 'User Not Authorized'
			});
			return false;
		} else {
			return true;
		}
	};

	private forProgram = (id): Promise<IProjectModel[]> => {
		return new Promise((resolve, reject) => {
			ProjectModel.find({ program: id })
				.exec()
				.then(resolve, reject);
		});
	};

	private searchTerm = (req, opts) => {
		opts = opts || {};
		const me = CoreServerHelpers.myStuff(req.user && req.user.roles ? req.user.roles : null);
		if (!me.isAdmin) {
			opts.$or = [{ isPublished: true }, { code: { $in: me.projects.admin } }];
		}
		return opts;
	};

	// -------------------------------------------------------------------------
	//
	// this takes a project model, serializes it, and decorates it with what
	// relationship the user has to the project, and returns the JSON
	//
	// -------------------------------------------------------------------------
	private decorate = (projectModel, roles) => {
		const project = projectModel ? projectModel.toJSON() : {};
		project.userIs = {
			admin: roles.indexOf(this.adminRole(project)) !== -1,
			member: roles.indexOf(this.memberRole(project)) !== -1,
			request: roles.indexOf(this.requestRole(project)) !== -1,
			gov: roles.indexOf('gov') !== -1
		};
		return project;
	};
	// -------------------------------------------------------------------------
	//
	// decorate an entire list of projects
	//
	// -------------------------------------------------------------------------
	private decorateList = (projectModels, roles) => {
		return projectModels.map(projectModel => {
			return this.decorate(projectModel, roles);
		});
	};
}

export default ProjectsServerController.getInstance();
