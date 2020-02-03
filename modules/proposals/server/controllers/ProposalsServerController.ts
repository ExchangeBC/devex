'use strict';

import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import { Types } from 'mongoose';
import multer from 'multer';
import config from '../../../../config/ApplicationConfig';
import FileStream from '../../../../config/lib/FileStream';
import CoreServerErrors from '../../../core/server/controllers/CoreServerErrors';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import MessagesServerController from '../../../messages/server/controllers/MessagesServerController';
import { IOpportunityModel } from '../../../opportunities/server/models/OpportunityModel';
import { IOrgModel } from '../../../orgs/server/models/OrgModel';
import { IUserModel, UserModel } from '../../../users/server/models/UserModel';
import { AttachmentModel, IProposalModel, ProposalModel } from '../models/ProposalModel';

class ProposalsServerController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: ProposalsServerController;

	private userfields =
		'_id displayName firstName lastName email phone address username profileImageURL ' +
		'businessName businessAddress businessContactName businessContactPhone businessContactEmail ' +
		'roles provider';
	private fileStream: FileStream = new FileStream();

	private constructor() {
		this.read = this.read.bind(this);
		this.create = this.create.bind(this);
		this.update = this.update.bind(this);
		this.assign = this.assign.bind(this);
		this.assignswu = this.assignswu.bind(this);
		this.unassignswu = this.unassignswu.bind(this);
		this.unassign = this.unassign.bind(this);
		this.delete = this.delete.bind(this);
		this.list = this.list.bind(this);
		this.getPotentialResources = this.getPotentialResources.bind(this);
		this.getProposalsForOpp = this.getProposalsForOpp.bind(this);
		this.uploaddoc = this.uploaddoc.bind(this);
		this.removedoc = this.removedoc.bind(this);
		this.downloaddoc = this.downloaddoc.bind(this);
		this.proposalByID = this.proposalByID.bind(this);
		this.getUserProposalForOpp = this.getUserProposalForOpp.bind(this);
		this.saveProposal = this.saveProposal.bind(this);
		this.addAttachment = this.addAttachment.bind(this);
		this.submit = this.submit.bind(this);
	}

	// Get a proposal for the given opportunity and user
	public async getUserProposalForOpp(req: Request, res: Response): Promise<void> {
		if (!(req.user as IUserModel)) {
			res.json({});
			return;
		}

		try {
			const proposal = await ProposalModel.findOne({ user: ((req.user as IUserModel) as IUserModel).id, opportunity: req.opportunity.id });
			if (proposal) {
				const populatedProposal = await this.populateProposal(proposal);
				res.json(populatedProposal);
			} else {
				res.json({});
			}

			return;
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
			return;
		}
	}

	public async saveProposal(proposal: IProposalModel): Promise<IProposalModel> {
		return await proposal.save();
	}

	// Remove a user from a proposal and save it
	public async removeUserFromProposal(proposal: IProposalModel, userEmail: string): Promise<IProposalModel> {
		proposal.phases.implementation.team.splice(proposal.phases.implementation.team.map(user => user.email).indexOf(userEmail), 1);
		proposal.phases.inception.team.splice(proposal.phases.inception.team.map(user => user.email).indexOf(userEmail), 1);
		proposal.phases.proto.team.splice(proposal.phases.proto.team.map(user => user.email).indexOf(userEmail), 1);
		return this.saveProposal(proposal);
	}

	// Create a new proposal. The user doing the creation will be set as the
	// administrator
	public async create(req: Request, res: Response): Promise<void> {
		const proposal = new ProposalModel(req.body);
		proposal.status = 'Draft';
		proposal.user = (req.user as IUserModel) as IUserModel;

		// set the audit fields so we know who did what when
		CoreServerHelpers.applyAudit(proposal, (req.user as IUserModel));

		// save and return
		try {
			const updatedProposal = await this.saveProposal(proposal);
			const populatedProposal = await this.populateProposal(updatedProposal);
			res.json(populatedProposal);
		} catch (error) {
			res.status(500).send({ message: CoreServerErrors.getErrorMessage(error) });
		}
	}

	// Takes the already queried object and pass it back
	public async read(req: Request, res: Response): Promise<void> {
		if (this.ensureProposalOwner(req.proposal, (req.user as IUserModel)) || this.ensureAdminOnOpp(req.proposal.opportunity, (req.user as IUserModel)) || this.ensureAdmin((req.user as IUserModel))) {
			const populatedOpportunity = await this.populateProposal(req.proposal);
			res.json(populatedOpportunity);
		} else {
			res.status(403).send({
				message: 'User is not authorized'
			});
		}
	}

	public async submit(req: Request, res: Response): Promise<void> {
		if (!this.ensureProposalOwner(req.proposal, (req.user as IUserModel)) && !this.ensureAdminOnOpp(req.proposal.opportunity, (req.user as IUserModel)) && !this.ensureAdmin((req.user as IUserModel))) {
			res.status(403).send({
				message: 'User is not authorized'
			});
			return;
		}

		// notify admins and then update proposal
		const proposal = req.body as IProposalModel;
		const msgOpp = proposal.opportunity as any;
		msgOpp.path = '/opportunities/' + (msgOpp.opportunityTypeCd === 'sprint-with-us' ? 'swu' : 'cwu') + '/' + msgOpp.code;
		await MessagesServerController.sendMessages('proposal-submitted', [proposal.user], { opportunity: msgOpp });

		proposal.status = 'Submitted';
		this.update(req, res);
	}

	// Update the document, make sure to apply audit.
	public async update(req: Request, res: Response): Promise<void> {
		if (!this.ensureProposalOwner(req.proposal, (req.user as IUserModel)) && !this.ensureAdminOnOpp(req.proposal.opportunity, (req.user as IUserModel)) && !this.ensureAdmin((req.user as IUserModel))) {
			res.status(403).send({
				message: 'User is not authorized'
			});
			return;
		}

		const newProposalInfo = req.body;

		// set the audit fields so we know who did what when
		CoreServerHelpers.applyAudit(newProposalInfo, (req.user as IUserModel));

		try {
			const updatedProposal = await ProposalModel.findOneAndUpdate({ _id: req.proposal._id }, newProposalInfo, { new: true });
			const populatedProposal = await this.populateProposal(updatedProposal);
			res.json(populatedProposal);
		} catch (error) {
			res.status(500).send({ message: CoreServerErrors.getErrorMessage(error) });
		}
	}

	// Sets the assigned status of the proposal
	public async assign(proposal: IProposalModel, user: IUserModel): Promise<IProposalModel> {
		proposal.status = 'Assigned';

		CoreServerHelpers.applyAudit(proposal, user);

		const updatedProposal = await this.saveProposal(proposal);
		return this.populateProposal(updatedProposal);
	}

	public async assignswu(req: Request, res: Response): Promise<void> {
		const proposal = req.proposal;
		const org = req.proposal.org as IOrgModel;

		// Update org
		org.awardedContractCount = !org.awardedContractCount ? 1 : org.awardedContractCount + 1;
		await org.save();

		// Update proposal
		proposal.status = 'Assigned';
		proposal.isAssigned = true;
		CoreServerHelpers.applyAudit(proposal, (req.user as IUserModel));
		const updatedProposal = await this.saveProposal(proposal);
		const populatedProposal = await this.populateProposal(updatedProposal);
	}

	public async unassignswu(req: Request, res: Response): Promise<void> {
		const proposal = req.proposal;
		const org = req.proposal.org as IOrgModel;

		proposal.status = 'Submitted';
		proposal.isAssigned = false;
		org.awardedContractCount--;
		CoreServerHelpers.applyAudit(proposal, (req.user as IUserModel));

		try {
			const updatedProposal = await this.saveProposal(proposal);
			const populatedProposal = await this.populateProposal(updatedProposal);
			await org.save();
			res.json(populatedProposal);
		} catch (error) {
			res.status(500).send({ message: CoreServerErrors.getErrorMessage(error) });
		}
	}

	// Unassign gets called from the opportunity side, so just do the work
	// and return a promise
	public async unassign(proposal: IProposalModel, user: IUserModel): Promise<IProposalModel> {
		proposal.status = 'Submitted';
		CoreServerHelpers.applyAudit(proposal, user);
		return this.saveProposal(proposal);
	}

	// Delete the proposal
	public async delete(req: Request, res: Response): Promise<void> {
		const proposal = req.proposal;

		try {
			const updatedProposal = await proposal.remove();
			res.json(updatedProposal);
			return;
		} catch (error) {
			res.status(500).send({ message: CoreServerErrors.getErrorMessage(error) });
			return;
		}
	}

	// Return a list of all proposals
	public async list(req: Request, res: Response): Promise<void> {
		try {
			const proposals = await ProposalModel.find({})
				.sort('name')
				.populate('createdBy', 'displayName')
				.populate('updatedBy', 'displayName')
				.populate('opportunity')
				.populate('user', this.userfields)
				.exec();
			res.json(proposals);
			return;
		} catch (error) {
			res.status(500).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
			return;
		}
	}

	// Given an opportunity and an organization, return all members that are
	// qualified to be assigned to each phase in the proposal
	public async getPotentialResources(req: Request, res: Response): Promise<void> {
		const user = req.user as IUserModel;
		const org = req.org;
		const opportunity = req.opportunity;
		const allMembers = _.uniq(org.members.concat(org.admins));

		// if the user is not an admin of the org then bail out
		if (user._id.toString() !== org.owner._id.toString() && org.admins.indexOf(user) === -1) {
			res.status(422).send({
				message: 'User is not authorized'
			});
		}

		// select all the users and start sifting them into buckets that match their capabilities
		const ret: any = {
			inception: [],
			proto: [],
			implementation: []
		};

		try {
			const users = await UserModel.find({ _id: { $in: allMembers } })
				.select('capabilities capabilitySkills _id displayName firstName lastName email username profileImageURL')
				.populate('capabilities', 'code name labelClass')
				.populate('capabilitySkills', 'code name labelClass')
				.exec();

			for (let i = 0; i < users.length; i++) {
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

				let j: number;
				let c: string;
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
		} catch (error) {
			res.status(500).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	}

	// Get submitted/assigned proposals for a given opportunity
	public async getProposalsForOpp(req: Request, res: Response): Promise<void> {
		if (!req.opportunity) {
			res.status(422).send({
				message: 'Valid opportunity not provided'
			});
			return;
		}

		if (!this.ensureAdminOnOpp(req.opportunity, (req.user as IUserModel)) && !this.ensureAdmin((req.user as IUserModel))) {
			res.status(403).send({ message: 'User is not authorized' });
			return;
		}

		try {
			const proposals = await ProposalModel.find({ opportunity: req.opportunity._id, $or: [{ status: 'Submitted' }, { status: 'Assigned' }] })
				.sort('created')
				.populate('createdBy', 'displayName')
				.populate('updatedBy', 'displayName')
				.populate('opportunity')
				.populate('phases.proto.team')
				.populate('phases.inception.team')
				.populate('phases.implementation.team')
				.populate('user')
				.populate('phases.proto.capabilitySkills')
				.populate('phases.inception.capabilitySkills')
				.populate('phases.implementation.capabilitySkills')
				.populate('org')
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
				.exec();
			res.json(proposals);
			return;
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
			return;
		}
	}

	// Populates the proposal on the request
	public async proposalByID(req: Request, res: Response, next: NextFunction, id: string): Promise<IProposalModel> {
		if (!Types.ObjectId.isValid(id)) {
			res.status(400).send({
				message: 'Proposal is invalid'
			});
			return;
		}

		try {
			const proposal = await ProposalModel.findOne({ _id: id });
			const populatedProposal = await this.populateProposal(proposal);
			req.proposal = populatedProposal;
			next();
		} catch (error) {
			res.status(404).send({
				message: 'No proposal with that identifier has been found'
			});
			return;
		}
	}

	// Upload an attachment to a proposal
	public uploaddoc(req: Request, res: Response): void {
		const proposal = req.proposal;
		const user = (req.user as IUserModel);
		const isAdmin = user && user.roles.indexOf('admin') !== -1;
		const isOwner = user && proposal.user._id.toString() === user._id.toString();

		if (!(isOwner || isAdmin)) {
			res.status(403).send({ message: 'Not permitted' });
			return;
		}

		if (proposal) {
			const storage = multer.diskStorage(config.uploads.diskStorage);
			const upload = multer({ storage }).single('file');
			upload(req, res, async uploadError => {
				if (uploadError) {
					res.status(422).send(uploadError);
				} else {
					const storedname = req.file.path;
					const originalname = req.file.originalname;
					const updatedProposal = await this.addAttachment(req, res, proposal, originalname, storedname, req.file.mimetype);
					res.json(updatedProposal);
				}
			});
		} else {
			res.status(422).send({
				message: 'No proposal provided'
			});
		}
	}

	// Remove an attachment from a proposal
	public async removedoc(req: Request, res: Response): Promise<void> {
		const proposal = req.proposal;
		const user = (req.user as IUserModel);
		const isAdmin = user && user.roles.indexOf('admin') !== -1;
		const isOwner = user && proposal.user.id.toString() === user.id.toString();

		if (!(isOwner || isAdmin)) {
			res.status(401).send({ message: 'Not permitted' });
			return;
		}

		const doc = proposal.attachments.find(document => document.id === req.params.documentId);
		await doc.remove();
		const updatedProposal = await this.saveProposal(proposal);
		res.json(updatedProposal);
		return;
	}

	public downloaddoc(req: Request, res: Response): void {
		const proposal = req.proposal;
		const user = (req.user as IUserModel);
		const isAdmin = user && user.roles.indexOf('admin') !== -1;
		const isGov = user && user.roles.indexOf('gov') !== -1;
		const isOwner = user && proposal.user._id.toString() === user._id.toString();

		if (!(user && (isAdmin || isGov || isOwner))) {
			res.status(401).send({ message: 'Not permitted' });
			return;
		}

		const doc = proposal.attachments.find(document => document.id === req.params.documentId);
		this.fileStream.stream(res, doc.path, doc.name, doc.type);
		return;
	}

	private ensureProposalOwner(proposal: IProposalModel, user: IUserModel): boolean {
		if (!user) {
			return false;
		}

		return proposal.user.id === user.id;
	}

	private adminRole(opportunity: IOpportunityModel): string {
		return opportunity.code + '-admin';
	}

	private ensureAdminOnOpp(opportunity: IOpportunityModel, user: IUserModel): boolean {
		return user.roles.indexOf(this.adminRole(opportunity)) !== -1;
	}

	// Returns boolean indicating whether given user has 'admin' role
	private ensureAdmin(user: IUserModel): boolean {
		return user && user.roles.indexOf('admin') !== -1;
	}

	private async addAttachment(req: Request, res: Response, proposal: IProposalModel, name: string, path: string, type: string): Promise<IProposalModel> {
		const attachment = await AttachmentModel.create({
			name,
			path,
			type
		});

		proposal.attachments.push(attachment);
		return this.saveProposal(proposal);
	}

	private async populateProposal(proposal: IProposalModel): Promise<IProposalModel> {
		return proposal
			.populate('createdBy', 'displayName')
			.populate('updatedBy', 'displayName')
			.populate('opportunity')
			.populate('user', this.userfields)
			.populate('phases.implementation.team', '_id displayName firstName lastName email username profileImageURL capabilities capabilitySkills')
			.populate('phases.inception.team', '_id displayName firstName lastName email username profileImageURL capabilities capabilitySkills')
			.populate('phases.proto.team', '_id displayName firstName lastName email username profileImageURL capabilities capabilitySkills')
			.populate('phases.aggregate.team', '_id displayName firstName lastName email username profileImageURL capabilities capabilitySkills')
			.populate('org')
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
			.execPopulate();
	}
}

export default ProposalsServerController.getInstance();
