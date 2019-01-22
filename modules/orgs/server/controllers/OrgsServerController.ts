'use strict';

import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import mongoose from 'mongoose';
import multer from 'multer';
import config from '../../../../config/ApplicationConfig';
import { CapabilityModel, ICapabilityModel } from '../../../capabilities/server/models/CapabilityModel';
import CoreServerErrors from '../../../core/server/controllers/CoreServerErrors';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import MessagesServerController from '../../../messages/server/controllers/MessagesServerController';
import ProposalsServerController from '../../../proposals/server/controllers/ProposalsServerController';
import { ProposalModel } from '../../../proposals/server/models/ProposalModel';
import { IUserModel, UserModel } from '../../../users/server/models/UserModel';
import { IOrgModel, OrgModel } from '../models/OrgModel';

class OrgsServerController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: OrgsServerController;

	private sendMessages = MessagesServerController.sendMessages;
	private popfields = '_id lastName firstName displayName profileImageURL capabilities capabilitySkills';

	private constructor() {
		this.list = this.list.bind(this);
		this.logo = this.logo.bind(this);
	}

	public getOrgById = (id): Promise<IOrgModel> => {
		return new Promise((resolve, reject) => {
			OrgModel.findById(id)
				.populate('owner', '_id lastName firstName displayName profileImageURL')
				.populate('createdBy', 'displayName')
				.populate('updatedBy', 'displayName')
				.populate('admins', this.popfields)
				.populate('capabilities', 'code name')
				.populate('capabilitySkills', 'code name')
				.populate({
					path: 'members',
					select: this.popfields,
					populate: [
						{
							path: 'capabilities',
							model: 'Capability',
							select: 'name code labelClass'
						},
						{
							path: 'capabilitySkills',
							model: 'CapabilitySkill',
							select: 'name code'
						}
					]
				})
				.populate('invitedUsers')
				.populate('invitedNonUsers')
				.populate('joinRequests')
				.exec((err, org) => {
					if (err) {
						reject(err);
					} else if (!org) {
						resolve(null);
					} else {
						resolve(org);
					}
				});
		});
	};

	public updateOrgCapabilities = (orgId): Promise<IOrgModel> => {
		return this.getOrgById(orgId)
			.then(this.checkCapabilities)
			.then(this.minisave);
	};

	public removeUserFromMemberList = (req, res): void => {
		if (!req.user || !this.isUserAdmin(req.org, req.user)) {
			res.status(403).send({
				message: 'You are not authorized to edit this organization'
			});
			return;
		}

		this.removeMember(req.profile, req.org).then(this.saveOrg(req, res));
	};

	public removeMeFromCompany = (req, res): void => {
		if (!req.user) {
			res.status(422).send({
				message: 'Valid user not provided'
			});
			return;
		}

		if (!req.org) {
			res.status(422).send({
				message: 'Valid company not provided'
			});
		}

		this.removeMember(req.user, req.org).then(this.saveOrg(req, res));
	};

	public create = (req, res): void => {
		const org = new OrgModel(req.body);

		// set the owner and also add the owner to the list of admins
		org.owner = req.user._id;
		this.addAdmin(req.user, org).then(this.saveOrg(req, res));
	};

	public read = (req, res) => {
		// If user is not authenticated, only send the publicly available org info
		if (!req.user || !this.isUserAdmin(req.org, req.user)) {
			const org = _.pick(req.org, ['_id', 'orgImageURL', 'name', 'website', 'capabilities']);
			res.json(org);
		} else {
			res.json(req.org);
		}
	};

	public update = (req, res) => {
		if (!req.user || !this.isUserAdmin(req.org, req.user)) {
			res.status(403).send({
				message: 'You are not authorized to edit this organization'
			});
			return;
		}

		let list = null;
		if (req.body.additions) {
			list = req.body.additions.split(/[ ,]+/);
		}

		const org = _.mergeWith(req.org, req.body, (objValue: any, srcValue: any) => {
			if (_.isArray(objValue)) {
				return srcValue;
			}
		});

		org.adminName = req.user.displayName;
		org.adminEmail = req.user.email;

		const additionsList: any = {
			found: [],
			notFound: []
		};

		this.inviteMembers(list, org)
			.then(
				(newlist: any): IOrgModel => {
					additionsList.found = newlist.found;
					additionsList.notFound = newlist.notFound;
					org.additionsList = additionsList;
					return org;
				}
			)
			.then(this.saveOrg(req, res));
	};

	public delete = (req, res) => {
		if (!req.user || !this.isUserAdmin(req.org, req.user)) {
			res.status(403).send({
				message: 'You are not authorized to delete this organization'
			});
			return;
		}

		const org = req.org;
		const orgId = org._id;
		org.remove(err => {
			if (err) {
				return res.status(422).send({
					message: CoreServerErrors.getErrorMessage(err)
				});
			} else {
				this.getAllAffectedMembers(orgId)
					.then(this.removeAllCompanyReferences(orgId))
					.then(() => {
						res.json(org);
					})
					.catch(innerErr => {
						res.status(422).send({
							message: CoreServerErrors.getErrorMessage(innerErr)
						});
					});
			}
		});
	};

	public async list(req: Request, res: Response): Promise<void> {

		try {
			const orgs = await OrgModel.find()
				.sort('user.lastName')
				.populate('owner', '_id lastName firstName displayName profileImageURL')
				.populate('createdBy', 'displayName')
				.populate('updatedBy', 'displayName')
				.populate('members', this.popfields)
				.populate('admins', this.popfields)
				.populate('joinRequests', '_id')
				.exec();
			res.json(orgs);
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	};

	public myadmin = (req, res) => {
		OrgModel.find({
			admins: { $in: [req.user._id] }
		})
			.populate('owner', '_id lastName firstName displayName profileImageURL')
			.populate('createdBy', 'displayName')
			.populate('updatedBy', 'displayName')
			.populate('members', this.popfields)
			.populate('admins', this.popfields)
			.exec((err, orgs) => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(orgs);
				}
			});
	};

	public my = (req, res) => {
		OrgModel.find({
			members: { $in: [req.user._id] }
		})
			.populate('owner', '_id lastName firstName displayName profileImageURL')
			.populate('createdBy', 'displayName')
			.populate('updatedBy', 'displayName')
			.populate('members', this.popfields)
			.populate('admins', this.popfields)
			.exec((err, orgs) => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(orgs);
				}
			});
	};

	public addUserToOrg = (req, res) => {
		req.user = req.model;
		const org = req.org;
		const user = req.user;

		if (req.params.actionCode === 'decline') {
			return res.status(200).json({
				message: '<i class="fas fa-lg fa-check-circle"></i> Company invitation declined.'
			});
		} else {
			// The user accepting the invitation must be recorded by id if they were an existing user at time of invite or by email if they had not yet registered
			if (
				(org.invitedUsers &&
					org.invitedUsers
						.map((invitedUser: IUserModel) => {
							return invitedUser.id;
						})
						.indexOf(user.id) !== -1) ||
				(org.invitedNonUsers &&
					org.invitedNonUsers
						.map((invitedNonUser: IUserModel) => {
							return invitedNonUser.email;
						})
						.indexOf(user.email) !== -1)
			) {
				Promise.resolve(user)
					.then(this.addUserTo(org, 'members'))
					.then(this.saveUser)
					.then(() => {
						return org;
					})
					.then(this.saveOrgReturnMessage(req, res));
			} else {
				return res.status(200).json({
					message: '<h4>Invalid Invitation</h4>Your invitation has either expired or is invalid. \
					Please ask your company admin to re-issue you another invite.'
				});
			}
		}
	};

	public orgByID = (req, res, next, id) => {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).send({
				message: 'Org is invalid'
			});
		}
		this.getOrgById(id)
			.then(org => {
				if (!org) {
					res.status(200).send({});
				} else {
					req.org = org;
					next();
				}
			})
			.catch(err => {
				next(err);
			});
	};

	public orgByIDSmall = (req, res, next, id) => {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).send({
				message: 'Org is invalid'
			});
		}
		OrgModel.findById(id)
			.populate('owner', '_id lastName firstName displayName profileImageURL')
			.exec((err, org: IOrgModel) => {
				if (err) {
					return next(err);
				} else if (!org) {
					return res.status(200).send({});
				}
				req.org = org;
				next();
			});
	};

	public async logo(req: Request, res: Response): Promise<void> {
		if (!req.user || !this.isUserAdmin(req.org, req.user)) {
			res.status(403).send({
				message: 'You are not authorized to edit this organization'
			});
			return;
		}

		const org = req.org;
		const storage = multer.diskStorage(config.uploads.diskStorage);
		const upload = multer({ storage }).single('orgImageURL');
		const up = CoreServerHelpers.fileUploadFunctions(org, 'orgImageURL', req, res, upload, org.orgImageURL);

		if (org) {
			try {
				await up.uploadImage();
				await up.updateDocument();
				await up.deleteOldImage();
				res.json(org);
			} catch (error) {
				res.status(422).send({
					message: CoreServerErrors.getErrorMessage(error)
				});
			}
		} else {
			res.status(401).send({
				message: 'invalid org or org not supplied'
			});
		}
	}

	public async joinRequest(req: Request, res: Response): Promise<void> {
		if (!req.user) {
			res.status(403).send({
				message: 'You are not authorized to join this organization'
			});
			return;
		}

		const org = req.org;
		const user = req.user;

		if (!org || !user) {
			res.status(422).send({
				message: 'Invalid join request'
			});
			return;
		}

		// check that user does not already having a request on that org and that they aren't already a member
		if (org.joinRequests.map(user => user.id).indexOf(user.id) !== -1 || org.members.map(user => user.id).indexOf(user.id) !== -1 || org.admins.map(user => user.id).indexOf(user.id) !== -1) {
			res.status(422).send({
				message: 'You already have a pending request or are already a member of this organization'
			});
			return;
		}

		// add the request and save the org, return in response
		org.joinRequests.push(user);
		try {
			const updatedOrg = await org.save();
			res.json(updatedOrg);
		} catch (error) {
			res.status(500).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
			return;
		}
	}

	//
	// Private functions
	//

	// Utility function which determines whether the given user is an administrator of the given organization
	private isUserAdmin = (org, user) => {
		if (!user || !org) {
			return false;
		}

		if (user.roles.indexOf('admin') >= 0) {
			return true;
		}

		if (
			org.admins
				.map(admin => {
					return admin.id;
				})
				.indexOf(user.id) >= 0
		) {
			return true;
		}

		return false;
	};

	// Saves the given user to the backend
	private saveUser = user => {
		return new Promise((resolve, reject) => {
			user.save((err, newuser) => {
				if (err) {
					reject(err);
				} else {
					resolve(newuser);
				}
			});
		});
	};

	// Gets a list of user using the supplied list of terms
	private getUsers = (terms: any): Promise<IUserModel[]> => {
		return new Promise((resolve, reject) => {
			UserModel.find(terms, '_id email displayName firstName username profileImageURL orgsAdmin orgsMember orgsPending').exec((err, user) => {
				if (err) {
					reject(err);
				} else {
					resolve(user);
				}
			});
		});
	};

	private addUserTo = (org, fieldName) => {
		return user => {
			if (fieldName === 'admins') {
				user.orgsAdmin.addToSet(org._id);
				user.markModified('orgsAdmin');
				org.admins.addToSet(user._id);
				org.markModified('admins');
			} else {
				user.orgsMember.addToSet(org._id);
				user.markModified('orgsMember');
				org.members.addToSet(user._id);
				org.markModified('members');
			}
			return user;
		};
	};

	private removeUserFrom = (org, fieldName) => {
		return user => {
			if (fieldName === 'admins') {
				user.orgsAdmin.pull(org._id);
				user.markModified('orgsAdmin');
				org.admins.pull(user._id);
				org.markModified('admins');
			} else {
				user.orgsMember.pull(org._id);
				user.markModified('orgsMember');
				org.members.pull(user._id);
				org.markModified('members');
			}
			return user;
		};
	};

	private getRequiredCapabilities = (): Promise<ICapabilityModel[]> => {
		return new Promise((resolve, reject) => {
			CapabilityModel.find(
				{
					isRequired: true
				},
				(err, capabilities: ICapabilityModel[]) => {
					if (err) {
						reject(err);
					} else {
						resolve(capabilities);
					}
				}
			);
		});
	};

	private collapseCapabilities = org => {
		return new Promise((resolve, reject) => {
			const c = {};
			const s = {};
			const orgmembers = org.members.map(o => {
				if (o._id) {
					return o._id;
				} else {
					return o;
				}
			});
			UserModel.find({ _id: { $in: orgmembers } })
				.populate('capabilities', 'name code')
				.populate('capabilitySkills', 'name code')
				.exec((err, members) => {
					if (err) {
						reject({ message: 'Error getting members' });
					}
					members.forEach(member => {
						if (member.capabilities) {
							member.capabilities.forEach(capability => {
								if (capability._id) {
									c[capability._id.toString()] = true;
								} else {
									c[capability.toString()] = true;
								}
							});
						}
						if (member.capabilitySkills) {
							member.capabilitySkills.forEach(skill => {
								if (skill._id) {
									s[skill._id.toString()] = true;
								} else {
									s[skill.toString()] = true;
								}
							});
						}
					});
					org.capabilities = Object.keys(c);
					org.capabilitySkills = Object.keys(s);
					resolve(org);
				});
		});
	};

	private checkCapabilities = (org: IOrgModel): Promise<IOrgModel> => {
		// make sure an org was found
		if (!org) {
			return;
		}
		return this.collapseCapabilities(org)
			.then(this.getRequiredCapabilities)
			.then(capabilities => {
				const caps = org.capabilities.reduce((a, c) => {
					a[c._id] = true;
					return a;
				}, {});

				org.isCapable = capabilities
					.map(ca => {
						return caps[ca._id.toString()] || false;
					})
					.reduce((a, c) => {
						return a && c;
					}, true);
				org.metRFQ = org.isCapable && org.isAcceptedTerms && org.members.length >= 2;
				return org;
			});
	};

	private minisave = (org: IOrgModel): Promise<IOrgModel> => {
		// make sure an org was found
		if (!org) {
			return;
		}
		return new Promise((resolve, reject) => {
			org.save((err, model) => {
				if (err) {
					reject(err);
				} else {
					resolve(model);
				}
			});
		});
	};

	private resolveOrg = org => {
		return () => {
			return org;
		};
	};

	private saveOrg = (req, res) => {
		return organization => {
			let additionsList = organization.additionsList;
			if (additionsList && additionsList.found.length === 0 && additionsList.notFound.length === 0) {
				additionsList = null;
			}
			CoreServerHelpers.applyAudit(organization, req.user);
			this.checkCapabilities(organization).then(org => {
				org.save((err, neworg) => {
					if (err) {
						return res.status(422).send({
							message: CoreServerErrors.getErrorMessage(err)
						});
					} else {
						req.user.save((innerErr, user) => {
							req.login(user, innerInnerErr => {
								if (innerInnerErr) {
									res.status(422).send({
										message: CoreServerErrors.getErrorMessage(innerInnerErr)
									});
								}
							});
						});

						this.getOrgById(neworg._id)
							.then(o => {
								o = o.toObject();
								o.emaillist = additionsList;
								res.json(o);
							})
							.catch(() => {
								res.status(422).send({
									message: 'Error populating organization'
								});
							});
					}
				});
			});
		};
	};

	private saveOrgReturnMessage = (req, res) => {
		return organization => {
			CoreServerHelpers.applyAudit(organization, req.user);
			this.checkCapabilities(organization).then((org: IOrgModel) => {
				org.save((err, neworg) => {
					if (err) {
						return res.status(422).send({
							message: CoreServerErrors.getErrorMessage(err)
						});
					} else {
						//
						// TBD: the code following shoudl be nested in here and checked for
						// failure properly etc.
						//
						req.user.save((innerErr, user) => {
							req.login(user, innerInnerErr => {
								if (innerInnerErr) {
									res.status(422).send({
										message: CoreServerErrors.getErrorMessage(innerInnerErr)
									});
								}
							});
						});
						this.getOrgById(neworg._id)
							.then(o => {
								res.status(200).json({
									message: '<i class="fas fa-lg fa-check-circle text-success"></i> You are now a member of ' + org.name
								});
							})
							.catch(() => {
								res.status(422).send({
									message: 'Error populating organization'
								});
							});
					}
				});
			});
		};
	};

	private removeUserFromProposals = user => {
		return org => {
			const rightNow = new Date();
			const userEmail = user.email;
			return new Promise((resolve, reject) => {
				ProposalModel.find({ org: org._id })
					.populate('opportunity', 'opportunityTypeCd deadline')
					.exec((err, proposals) => {
						Promise.all(
							proposals.map(proposal => {
								const deadline = new Date(proposal.opportunity.deadline);
								const isSprintWithUs = proposal.opportunity.opportunityTypeCd === 'sprint-with-us';
								//
								// if sprint with us and the opportunity is still open
								// remove the user and save the proposal
								//
								if (isSprintWithUs && 0 < deadline.getTime() - rightNow.getTime()) {
									return ProposalsServerController.removeUserFromProposal(proposal, userEmail);
								} else {
									return Promise.resolve({});
								}
							})
						).then(resolve, reject);
					});
			});
		};
	};

	private addAdmin = (user: IUserModel, org: IOrgModel): Promise<IOrgModel> => {
		return Promise.resolve(user)
			.then(this.addUserTo(org, 'members'))
			.then(this.addUserTo(org, 'admins'))
			.then(this.saveUser)
			.then(this.resolveOrg(org));
	};

	private removeMember = (user: IUserModel, org: IOrgModel): Promise<IOrgModel> => {
		return Promise.resolve(user)
			.then(this.removeUserFrom(org, 'members'))
			.then(this.removeUserFromProposals(user))
			.then(this.resolveOrg(org));
	};

	private inviteMembersWithMessages = (emaillist: [string], org: IOrgModel): Promise<any> => {
		const list: any = {
			found: [],
			notFound: []
		};

		if (!emaillist) {
			return Promise.resolve(list);
		}

		return this.getUsers({ email: { $in: emaillist } })
			.then((users: IUserModel[]) => {
				if (users) {
					list.found = users;

					list.notFound = emaillist
						.filter(email => {
							return (
								users
									.map(user => {
										return user.email;
									})
									.indexOf(email) === -1
							);
						})
						.map(email => {
							return { email };
						});
				}
				return users;
			})
			.then((users: IUserModel[]) => {
				this.sendMessages('add-user-to-company-request', list.found, { org });
				this.sendMessages('invitation-from-company', list.notFound, { org });

				// record users so that they have 'permission' to self add
				if (!org.invitedNonUsers) {
					org.invitedNonUsers = [] as any;
				}

				if (!org.invitedUsers) {
					org.invitedUsers = [] as any;
				}

				users.forEach(user => {
					org.invitedUsers.push(user);
				});

				list.notFound.forEach(email => {
					org.invitedNonUsers.push(email);
				});
			})
			.then(() => {
				return Promise.resolve(list);
			});
	};

	private inviteMembers = (emaillist: [string], org: IOrgModel): Promise<any> => {
		return this.inviteMembersWithMessages(emaillist, org);
	};

	private getAllAffectedMembers = (orgId: string): Promise<IUserModel[]> => {
		return new Promise((resolve, reject) => {
			UserModel.find(
				{
					$or: [{ orgsAdmin: { $in: [orgId] } }, { orgsMember: { $in: [orgId] } }, { orgsPending: { $in: [orgId] } }]
				},
				(err, users) => {
					if (err) {
						reject(err);
					} else {
						resolve(users);
					}
				}
			);
		});
	};

	private removeAllCompanyReferences = orgId => {
		return users => {
			return Promise.all(
				users.map(user => {
					user.orgsAdmin.pull(orgId);
					user.orgsMember.pull(orgId);
					user.orgsPending.pull(orgId);
					user.markModified('orgsAdmin');
					user.markModified('orgsMember');
					user.markModified('orgsPending');
					return user.save();
				})
			);
		};
	};
}

export default OrgsServerController.getInstance();
