'use strict';
/*

Notes about proposals

Roles:
------
Membership in a proposal is defined by the user having various roles attached to their
user record. There are only three possible states: admin, member, or request.
When a user requests membership they get the request role only, once accepted that
simply gets changed to the member role. Roles are simply the proposal code with suffixes.

member  : <code>
admin   : <code>-admin
request : <code>-request

*/

import _ from 'lodash';
import mongoose from 'mongoose';
import multer from 'multer';
import config from '../../../../config/config';
import FileStream from '../../../../config/lib/FileStream';
import CoreServerErrors from '../../../core/server/controllers/CoreServerErrors';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import OpportunitiesServerController from '../../../opportunities/server/controllers/OpportunitiesServerController';
import IUserDocument from '../../../users/server/interfaces/IUserDocument';
import UserModel from '../../../users/server/models/UserModel';
import IProposalDocument from '../interfaces/IProposalDocument';
import ProposalModel from '../models/ProposalModel';

class ProposalsServerController {

	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: ProposalsServerController;

	private userfields =
		'_id displayName firstName lastName email phone address username profileImageURL \
						businessName businessAddress businessContactName businessContactPhone businessContactEmail \
						roles provider';
	private fileStream: FileStream = new FileStream();

	private constructor() {};

	// Get a proposal for the given opportunity and user
	public getUserProposalForOpp = (req, res) => {
		if (!req.user) {
			return res.json({});
		}

		ProposalModel.findOne({ user: req.user._id, opportunity: req.opportunity._id })
			.populate('createdBy', 'displayName')
			.populate('updatedBy', 'displayName')
			.populate('opportunity')
			.populate('user')
			.exec((err, proposals) => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(proposals);
				}
			});
	};

	public saveProposal = proposal => {
		return new Promise((resolve, reject) => {
			this.setPhases(proposal).then(() => {
				proposal.save((err, doc) => {
					if (err) {
						reject(err);
					} else {
						resolve(doc);
					}
				});
			});
		});
	};

	public saveProposalRequest = (req, res, proposal) => {
		return this.saveProposal(proposal)
			.then(() => {
				res.json(proposal);
			})
			.catch(e => {
				res.status(422).send({
					message: CoreServerErrors.getErrorMessage(e)
				});
			});
	};

	// Remove a user from a proposal and save it
	public removeUserFromProposal = (proposal, userid) => {
		proposal.phases.implementation.team.pull(userid);
		proposal.phases.inception.team.pull(userid);
		proposal.phases.proto.team.pull(userid);
		return this.saveProposal(proposal);
	};

	// Create a new proposal. The user doing the creation will be set as the
	// administrator
	public create = (req, res) => {
		const proposal = new ProposalModel(req.body);
		proposal.status = 'Draft';
		proposal.user = req.user;
		//
		// set the audit fields so we know who did what when
		//
		CoreServerHelpers.applyAudit(proposal, req.user);
		//
		// save and return
		//
		this.saveProposalRequest(req, res, proposal);
	};

	// Takes the already queried object and pass it back
	public read = (req, res) => {
		res.json(req.proposal);
	};

	// Update the document, make sure to apply audit. We don't mess with the
	// code if they change the name as that would mean reworking all the roles
	public update = (req, res) => {
		const proposal = _.mergeWith(req.proposal, req.body, (objValue, srcValue) => {
			if (_.isArray(objValue)) {
				return srcValue;
			}
		});

		// set the audit fields so we know who did what when
		CoreServerHelpers.applyAudit(proposal, req.user);

		this.saveProposalRequest(req, res, proposal);
	};

	// Sets the specified proposal to 'Submitted' status
	public submit = (req, res) => {
		if (!this.ensureProposalOwner(req.proposal, req.user)) {
			return res.json({ message: 'User is not authorized' });
		}
		req.body.status = 'Submitted';
		return exports.update(req, res);
	};

	// Assigns the proposal to the given opportunity
	public assign = (proposal, user) => {
		return new Promise((resolve, reject) => {
			proposal.status = 'Assigned';

			CoreServerHelpers.applyAudit(proposal, user);

			this.saveProposal(proposal).then(p => {
				proposal = p;
				resolve();
			});
		});
	};

	public assignswu = (req, res) => {
		const proposal = req.proposal;
		proposal.status = 'Assigned';
		proposal.isAssigned = true;
		CoreServerHelpers.applyAudit(proposal, req.user);
		this.saveProposal(proposal)
			.then(updatedProposal => {
				OpportunitiesServerController.assignswu(proposal.opportunity._id, proposal._id, proposal.user, req.user);
				return updatedProposal;
			})
			.then(updatedProposal => {
				res.json(updatedProposal);
			})
			.catch(e => {
				res.status(422).send({ message: CoreServerErrors.getErrorMessage(e) });
			});
	};

	// Unassign gets called from the opportunity side, so just do the work
	// and return a promise
	public unassign = (proposal, user) => {
		return new Promise((resolve, reject) => {
			proposal.status = 'Submitted';
			CoreServerHelpers.applyAudit(proposal, user);
			this.saveProposal(proposal).then(p => {
				proposal = p;
				resolve();
			});
		});
	};

	// Delete the proposal
	public delete = (req, res) => {
		const proposal = req.proposal;
		proposal.remove(err => {
			if (err) {
				return res.status(422).send({
					message: CoreServerErrors.getErrorMessage(err)
				});
			} else {
				res.json(proposal);
			}
		});
	};

	public deleteForOrg = orgid => {
		return new Promise((resolve, reject) => {
			ProposalModel.find({ org: orgid }, (err, proposals) => {
				if (err) {
					reject(err);
				} else {
					if (proposals) {
						Promise.all(
							proposals.map(proposal => {
								return Promise.resolve();
							})
						).then(resolve, reject);
					} else {
						resolve();
					}
				}
			});
		});
	};

	// Return a list of all proposals
	public list = (req, res) => {
		ProposalModel.find({})
			.sort('name')
			.populate('createdBy', 'displayName')
			.populate('updatedBy', 'displayName')
			.populate('opportunity')
			.populate('user', this.userfields)
			.exec((err, proposals) => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(proposals);
				}
			});
	};

	// Given an opportunity and an organization, return all members that are
	// qualified to be assigned to each phase in the proposal
	public getPotentialResources = (req, res) => {
		//
		// gather up all the bits and peices
		//
		const user = req.user;
		const org = req.org;
		const opportunity = req.opportunity;
		const allMembers = _.uniq(org.members.concat(org.admins));

		// if the user is not an admin of the org then bail out
		if (user._id.toString() !== org.owner._id.toString() && org.admins.indexOf(user._id) === -1) {
			return res.status(422).send({
				message: 'User is not authorized'
			});
		}

		// select all the users and start sifting them into buckets that match their capabilities
		const ret: any = {
			inception: [],
			proto: [],
			implementation: []
		};
		UserModel.find({
			_id: { $in: allMembers }
		})
			.select('capabilities capabilitySkills _id displayName firstName lastName email username profileImageURL')
			.populate('capabilities', 'code name labelClass')
			.populate('capabilitySkills', 'code name labelClass')
			.exec((err, users) => {
				let i;
				let j;
				let c;
				for (i = 0; i < users.length; i++) {
					const curUser = users[i].toObject();
					curUser.iCapabilities = {};
					curUser.iCapabilitySkills = {};
					curUser.capabilities.forEach(cap => {
						curUser.iCapabilities[cap.code] = true;
					});
					curUser.capabilitySkills.forEach(skill => {
						curUser.iCapabilitySkills[skill.code] = true;
					});
					users[i] = curUser;
					for (j = 0; j < opportunity.phases.inception.capabilities.length; j++) {
						c = opportunity.phases.inception.capabilities[j].code;
						if (curUser.iCapabilities[c]) {
							ret.inception.push(curUser);
							break;
						}
					}
					for (j = 0; j < opportunity.phases.proto.capabilities.length; j++) {
						c = opportunity.phases.proto.capabilities[j].code;
						if (curUser.iCapabilities[c]) {
							ret.proto.push(curUser);
							break;
						}
					}
					for (j = 0; j < opportunity.phases.implementation.capabilities.length; j++) {
						c = opportunity.phases.implementation.capabilities[j].code;
						if (curUser.iCapabilities[c]) {
							ret.implementation.push(curUser);
							break;
						}
					}
				}
				ret.all = users;
				res.json(ret);
			});
	};

	// New empty proposal
	public new = (req, res) => {
		const p = new ProposalModel();
		res.json(p);
	};

	// Get proposals for a given opportunity
	public getProposalsForOpp = (req, res) => {
		if (!req.opportunity) {
			return res.status(422).send({
				message: 'Valid opportunity not provided'
			});
		}

		if (!this.ensureAdmin(req.opportunity, req.user, res)) {
			return res.json({ message: 'User is not authorized' });
		}

		ProposalModel.find({ opportunity: req.opportunity._id, $or: [{ status: 'Submitted' }, { status: 'Assigned' }] })
			.sort('created')
			.populate('createdBy', 'displayName')
			.populate('updatedBy', 'displayName')
			.populate('opportunity')
			.populate('phases.proto.team')
			.populate('phases.inception.team')
			.populate('phases.implementation.team')
			.populate('user')
			.populate({
				path: 'phases.proto.team',
				populate: { path: 'capabilities capabilitySkills' }
			})
			.populate({
				path: 'phases.inception.team',
				populate: { path: 'capabilities capabilitySkills' }
			})
			.populate({
				path: 'phases.implementation.team',
				populate: { path: 'capabilities capabilitySkills' }
			})
			.exec((err, proposals) => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(proposals);
				}
			});
	};

	// Populates the proposal on the request
	public proposalByID = (req, res, next, id) => {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).send({
				message: 'Proposal is invalid'
			});
		}

		ProposalModel.findById(id)
			.populate('createdBy', 'displayName')
			.populate('updatedBy', 'displayName')
			.populate('opportunity')
			.populate('user', this.userfields)
			.populate('phases.implementation.team', '_id displayName firstName lastName email username profileImageURL')
			.populate('phases.inception.team', '_id displayName firstName lastName email username profileImageURL')
			.populate('phases.proto.team', '_id displayName firstName lastName email username profileImageURL')
			.populate('phases.aggregate.team', '_id displayName firstName lastName email username profileImageURL')
			.exec((err, proposal) => {
				if (err) {
					return next(err);
				} else if (!proposal) {
					return res.status(404).send({
						message: 'No proposal with that identifier has been found'
					});
				}
				req.proposal = proposal;
				next();
			});
	};

	// Upload an attachment to a proposal
	public uploaddoc = (req, res) => {
		const proposal = req.proposal;
		const user = req.user;
		const isAdmin = user && user.roles.indexOf('admin') !== -1;
		const isOwner = user && proposal.user._id.toString() === user._id.toString();
		if (!(isOwner || isAdmin)) {
			return res.status(401).send({ message: 'Not permitted' });
		}

		if (proposal) {
			const storage = multer.diskStorage(config.uploads.diskStorage);
			const upload = multer({ storage }).single('file');
			upload(req, res, uploadError => {
				if (uploadError) {
					res.status(422).send(uploadError);
				} else {
					const storedname = req.file.path;
					const originalname = req.file.originalname;
					this.addAttachment(req, res, proposal, originalname, storedname, req.file.mimetype);
				}
			});
		} else {
			res.status(401).send({
				message: 'No proposal provided'
			});
		}
	};

	public removedoc = (req, res) => {
		const proposal = req.proposal;
		const user = req.user;
		const isAdmin = user && user.roles.indexOf('admin') !== -1;
		const isOwner = user && proposal.user._id.toString() === user._id.toString();
		if (!(isOwner || isAdmin)) {
			return res.status(401).send({ message: 'Not permitted' });
		}
		req.proposal.attachments.id(req.params.documentId).remove();
		this.saveProposalRequest(req, res, req.proposal);
	};

	public downloaddoc = (req, res) => {
		const proposal = req.proposal;
		const user = req.user;
		const isAdmin = user && user.roles.indexOf('admin') !== -1;
		const isGov = user && user.roles.indexOf('gov') !== -1;
		const isOwner = user && proposal.user._id.toString() === user._id.toString();
		if (!(user && (isAdmin || isGov || isOwner))) {
			return res.status(401).send({ message: 'Not permitted' });
		}
		const fileobj = req.proposal.attachments.id(req.params.documentId);
		return this.fileStream.stream(res, fileobj.path, fileobj.name, fileobj.type);
	};

	private ensureProposalOwner = (proposal, user) => {
		if (!user) {
			return false;
		}

		return proposal.user._id === user._id;
	};

	private adminRole = opportunity => {
		return opportunity.code + '-admin';
	};

	private ensureAdmin = (opportunity, user, res) => {
		if (user.roles.indexOf(this.adminRole(opportunity)) === -1 && user.roles.indexOf('admin') === -1) {
			res.status(422).send({
				message: 'User Not Authorized'
			});
			return false;
		} else {
			return true;
		}
	};

	private getUserCapabilities = (users: IUserDocument[]) => {
		return new Promise((resolve, reject) => {
			const userids = users.map(o => {
				if (o._id) {
					return o._id;
				} else {
					return o;
				}
			});
			UserModel.find({ _id: { $in: userids } })
				.populate('capabilities', 'name code')
				.populate('capabilitySkills', 'name code')
				.exec((err, members) => {
					const ret = { capabilities: {}, capabilitySkills: {} };
					if (err) {
						reject({ message: 'Error getting members' });
					}
					members.forEach(member => {
						if (member.capabilities) {
							member.capabilities.forEach(capability => {
								ret.capabilities[capability.code] = capability;
							});
						}
						if (member.capabilitySkills) {
							member.capabilitySkills.forEach(capabilitySkill => {
								ret.capabilitySkills[capabilitySkill.code] = capabilitySkill;
							});
						}
					});
					resolve(ret);
				});
		});
	};

	private getPhaseCapabilities = (proposal: IProposalDocument) => {
		return Promise.all([
			this.getUserCapabilities(proposal.phases.inception.team),
			this.getUserCapabilities(proposal.phases.proto.team),
			this.getUserCapabilities(proposal.phases.implementation.team)
		]).then(results => {
			return results.reduce((accum: any, curr: any) => {
				Object.keys(curr.capabilities).forEach(key => {
					accum.capabilities[key] = curr.capabilities[key];
				});
				Object.keys(curr.capabilitySkills).forEach(key => {
					accum.capabilitySkills[key] = curr.capabilitySkills[key];
				});
				return accum;
			});
		});
	};

	// Set up internal aggregate states for phase information
	private setPhases = proposal => {
		//
		// only for sprint with us
		//
		if (proposal.opportunity.opportunityTypeCd !== 'sprint-with-us') {
			return Promise.resolve();
		} else {
			return this.getPhaseCapabilities(proposal).then((curr: any) => {
				proposal.phases.aggregate.capabilities = [];
				proposal.phases.aggregate.capabilitySkills = [];
				Object.keys(curr.capabilities).forEach(key => {
					proposal.phases.aggregate.capabilities.push(curr.capabilities[key]);
				});
				Object.keys(curr.capabilitySkills).forEach(key => {
					proposal.phases.aggregate.capabilitySkills.push(curr.capabilitySkills[key]);
				});
				proposal.phases.aggregate.cost = proposal.phases.inception.cost + proposal.phases.proto.cost + proposal.phases.implementation.cost;
			});
		}
	};

	private addAttachment = (req, res, proposal, name, path, type) => {
		proposal.attachments.push({
			name,
			path,
			type
		});
		return this.saveProposalRequest(req, res, proposal);
	};
}

export default ProposalsServerController.getInstance();
