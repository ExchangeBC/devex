'use strict';
/*

Notes about orgs

Roles:
------
Membership in a org is defined by the user having various roles attached to their
user record. There are only three possible states: admin, member, or request.
When a user requests membership they get the request role only, once accepted that
simply gets changed to the member role. Roles are simply the org code with suffixes.

member  : <code>
admin   : <code>-admin
request : <code>-request

*/

import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import * as multer from 'multer';
import * as config from '../../../../config/config';
import { ICapabilityDocument } from '../../../capabilities/server/interfaces/ICapabilityDocument';
import { Capability } from '../../../capabilities/server/models/capability.server.model';
import { CoreHelpers } from '../../../core/server/controllers/core.server.helpers';
import { CoreErrors } from '../../../core/server/controllers/errors.server.controller';
import { MessagesController } from '../../../messages/server/controllers/messages.server.controller';
import * as Proposals from '../../../proposals/server/controllers/proposals.server.controller';
import { Proposal } from '../../../proposals/server/models/proposal.server.model';
import { IUserDocument } from '../../../users/server/interfaces/IUserDocument';
import { User } from '../../../users/server/models/user.server.model';
import { IOrgDocument } from '../interfaces/IOrgDocument';
import { Org } from '../models/org.server.model';

export class OrgsController {
	private messagesController = new MessagesController();
	private sendMessages = this.messagesController.sendMessages;
	private popfields = '_id lastName firstName displayName profileImageURL capabilities capabilitySkills';
	private helpers = new CoreHelpers();
	private errorHandler = new CoreErrors();

	public getOrgById = (id): Promise<IOrgDocument> => {
		return new Promise((resolve, reject) => {
			Org.findById(id)
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

	public updateOrgCapabilities = (orgId): Promise<IOrgDocument> => {
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
		const org = new Org(req.body);

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
				(newlist: any): IOrgDocument => {
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
					message: this.errorHandler.getErrorMessage(err)
				});
			} else {
				this.getAllAffectedMembers(orgId)
					.then(this.removeAllCompanyReferences(orgId))
					.then(() => {
						res.json(org);
					})
					.catch(innerErr => {
						res.status(422).send({
							message: this.errorHandler.getErrorMessage(innerErr)
						});
					});
			}
		});
	};

	public list = (req, res) => {
		Org.find()
			.sort('user.lastName')
			.populate('owner', '_id lastName firstName displayName profileImageURL')
			.populate('createdBy', 'displayName')
			.populate('updatedBy', 'displayName')
			.populate('members', this.popfields)
			.populate('admins', this.popfields)
			.exec((err, orgs) => {
				if (err) {
					return res.status(422).send({
						message: this.errorHandler.getErrorMessage(err)
					});
				} else {
					res.json(orgs);
				}
			});
	};

	public myadmin = (req, res) => {
		Org.find({
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
						message: this.errorHandler.getErrorMessage(err)
					});
				} else {
					res.json(orgs);
				}
			});
	};

	public my = (req, res) => {
		Org.find({
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
						message: this.errorHandler.getErrorMessage(err)
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
						.map((invitedUser: IUserDocument) => {
							return invitedUser.id;
						})
						.indexOf(user.id) !== -1) ||
				(org.invitedNonUsers &&
					org.invitedNonUsers
						.map((invitedNonUser: IUserDocument) => {
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
		Org.findById(id)
			.populate('owner', '_id lastName firstName displayName profileImageURL')
			.exec((err, org: IOrgDocument) => {
				if (err) {
					return next(err);
				} else if (!org) {
					return res.status(200).send({});
				}
				req.org = org;
				next();
			});
	};

	public logo = (req, res) => {
		if (!req.user || !this.isUserAdmin(req.org, req.user)) {
			res.status(403).send({
				message: 'You are not authorized to edit this organization'
			});
			return;
		}

		const org = req.org;
		const storage = multer.diskStorage(config.uploads.diskStorage);
		const upload = multer({ storage }).single('orgImageURL');
		// upload.fileFilter = multerConfig.profileUploadFileFilter;
		const up = this.helpers.fileUploadFunctions(org, Org, 'orgImageURL', req, res, upload, org.orgImageURL);

		if (org) {
			up.uploadImage()
				.then(up.updateDocument)
				.then(up.deleteOldImage)
				.then(() => {
					res.json(org);
				})
				.catch(err => {
					res.status(422).send(err);
				});
		} else {
			res.status(401).send({
				message: 'invalid org or org not supplied'
			});
		}
	};

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
	private getUsers = (terms: any): Promise<IUserDocument[]> => {
		return new Promise((resolve, reject) => {
			User.find(terms, '_id email displayName firstName username profileImageURL orgsAdmin orgsMember orgsPending').exec((err, user) => {
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

	private getRequiredCapabilities = (): Promise<ICapabilityDocument[]> => {
		return new Promise((resolve, reject) => {
			Capability.find(
				{
					isRequired: true
				},
				(err, capabilities: ICapabilityDocument[]) => {
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
			User.find({ _id: { $in: orgmembers } })
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

	private checkCapabilities = (org: IOrgDocument): Promise<IOrgDocument> => {
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

	private minisave = (org: IOrgDocument): Promise<IOrgDocument> => {
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
			this.helpers.applyAudit(organization, req.user);
			this.checkCapabilities(organization).then(org => {
				org.save((err, neworg) => {
					if (err) {
						return res.status(422).send({
							message: this.errorHandler.getErrorMessage(err)
						});
					} else {
						req.user.save((innerErr, user) => {
							req.login(user, innerInnerErr => {
								if (innerInnerErr) {
									res.status(422).send({
										message: this.errorHandler.getErrorMessage(innerInnerErr)
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
			this.helpers.applyAudit(organization, req.user);
			this.checkCapabilities(organization).then((org: IOrgDocument) => {
				org.save((err, neworg) => {
					if (err) {
						return res.status(422).send({
							message: this.errorHandler.getErrorMessage(err)
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
										message: this.errorHandler.getErrorMessage(innerInnerErr)
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
			const userid = user.id;
			return new Promise((resolve, reject) => {
				Proposal.find({ org: org._id })
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
									return Proposals.removeUserFromProposal(proposal, userid);
								} else {
									return Promise.resolve();
								}
							})
						).then(resolve, reject);
					});
			});
		};
	};

	private addAdmin = (user: IUserDocument, org: IOrgDocument): Promise<IOrgDocument> => {
		return Promise.resolve(user)
			.then(this.addUserTo(org, 'members'))
			.then(this.addUserTo(org, 'admins'))
			.then(this.saveUser)
			.then(this.resolveOrg(org));
	};

	private removeMember = (user: IUserDocument, org: IOrgDocument): Promise<IOrgDocument> => {
		return Promise.resolve(user)
			.then(this.removeUserFrom(org, 'members'))
			.then(this.removeUserFromProposals(user))
			.then(this.resolveOrg(org));
	};

	private inviteMembersWithMessages = (emaillist: [string], org: IOrgDocument): Promise<any> => {
		const list: any = {
			found: [],
			notFound: []
		};

		if (!emaillist) {
			return Promise.resolve(list);
		}

		return this.getUsers({ email: { $in: emaillist } })
			.then((users: IUserDocument[]) => {
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
			.then((users: IUserDocument[]) => {
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

	private inviteMembers = (emaillist: [string], org: IOrgDocument): Promise<any> => {
		return this.inviteMembersWithMessages(emaillist, org);
	};

	private getAllAffectedMembers = (orgId: string): Promise<IUserDocument[]> => {
		return new Promise((resolve, reject) => {
			User.find(
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
