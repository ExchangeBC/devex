'use strict';

import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import JSZip from 'jszip';
import _ from 'lodash';
import moment from 'moment-timezone';
import { Types } from 'mongoose';
import MongooseController from '../../../../config/lib/MongooseController';
import CoreGithubController from '../../../core/server/controllers/CoreGithubController';
import CoreServerErrors from '../../../core/server/controllers/CoreServerErrors';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import MessagesServerController from '../../../messages/server/controllers/MessagesServerController';
import ProposalsServerController from '../../../proposals/server/controllers/ProposalsServerController';
import { IAttachmentModel, ProposalModel } from '../../../proposals/server/models/ProposalModel';
import { IUserModel, UserModel } from '../../../users/server/models/UserModel';
import { IOpportunityModel, OpportunityModel } from '../models/OpportunityModel';
import OpportunitiesUtilities from '../utilities/OpportunitiesUtilities';

class OpportunitiesServerController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: OpportunitiesServerController;

	private sendMessages = MessagesServerController.sendMessages;

	private constructor() {}

	// Return a list of all opportunity members. this means all members NOT
	// including users who have requested access and are currently waiting
	public members = (opportunity, cb) => {
		UserModel.find({ roles: this.memberRole(opportunity) })
			.select('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle')
			.exec(cb);
	};

	// Return a list of all users who are currently waiting to be added to the
	// opportunity member list
	public requests = (opportunity, cb) => {
		MongooseController.mongoose
			.model('User')
			.find({ roles: this.requestRole(opportunity) })
			.select('isDisplayEmail username displayName updated created roles government profileImageURL email lastName firstName userTitle')
			.exec(cb);
	};

	// Takes the already queried object and pass it back
	public read = (req, res) => {
		// Ensure that the opportunity is only viewable when published or when the user is either the admin for the opportunity or a root admin
		if (req.opportunity.isPublished || req.user && (req.user.roles.indexOf(this.adminRole(req.opportunity)) !== -1 || req.user.roles.indexOf('admin') !== -1)) {
			const opportunity = req.opportunity.toObject()
			// Check if the current user is admin, and if not, remove any sensitive data (i.e. winning proposal details)
			if (!this.ensureAdmin(opportunity, req.user)) {
				// If not an admin, we still need to be able to see winning business name and org image url.
				if (opportunity.proposal) {
					const isCompany = opportunity.proposal.org || opportunity.opportunityTypeCd !== 'code-with-us'
					opportunity.proposal = {
						proponentName: isCompany ? opportunity.proposal.businessName : opportunity.proposal.user.displayName,
						imageUrl: isCompany ? opportunity.proposal.org.orgImageURL : opportunity.proposal.user.profileImageURL
					}
				}
			} else {
				if (opportunity.proposal) {
					const isCompany = opportunity.proposal.org || opportunity.opportunityTypeCd !== 'code-with-us'
					opportunity.proposal = {
						...opportunity.proposal,
						proponentName: isCompany ? opportunity.proposal.businessName : opportunity.proposal.user.displayName,
						imageUrl: isCompany ? opportunity.proposal.org.orgImageURL : opportunity.proposal.user.profileImageURL
					}
				}
			}
			res.json(OpportunitiesUtilities.decorate(opportunity, req.user ? req.user.roles : []));
			this.incrementViews(req.opportunity._id);
		} else {
			return res.status(403).send({
				message: 'User is not authorized'
			});
		}
	};

	// Create a new opportunity. the user doing the creation will be set as the
	// administrator
	public create = (req, res) => {
		const opportunity = new OpportunityModel(req.body);
		//
		// set the code, this is used setting roles and other stuff
		//
		OpportunityModel.schema.statics.findUniqueCode(opportunity.name, null, newcode => {
			opportunity.code = newcode;
			//
			// set the audit fields so we know who did what when
			//
			CoreServerHelpers.applyAudit(opportunity, req.user);
			//
			// update phase information
			//
			this.setPhases(opportunity);
			//
			// save and return
			//
			opportunity.save(err => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					this.setOpportunityAdmin(opportunity, req.user);
					req.user.save();
					res.json(opportunity);
				}
			});
		});
	};

	// Update the document, make sure to apply audit. We don't mess with the
	// code if they change the name as that would mean reworking all the roles
	public update = (req, res) => {
		// if we dont have permission to do this just return as a no-op
		if (!this.ensureAdmin(req.opportunity, req.user, res)) {
			return res.json(OpportunitiesUtilities.decorate(req.opportunity, req.user ? req.user.roles : []));
		}

		const newOppInfo = req.body;

		// set the audit fields so we know who did what when
		CoreServerHelpers.applyAudit(newOppInfo, req.user);

		// update phase information
		this.setPhases(newOppInfo);

		// find, update, and return the updated document in the response
		OpportunityModel.findOneAndUpdate({ code: req.opportunity.code }, newOppInfo, { new: true }, (err, updatedOpp) => {
			if (err) {
				res.status(500).send({
					message: CoreServerErrors.getErrorMessage(err)
				});
			} else {
				// send out approval request messages as needed
				if (!updatedOpp.isApproved) {
					this.sendApprovalMessages(req.user, updatedOpp);
				}

				// send out opportunity update notifications on published opportunities that are still open
				if (updatedOpp.isPublished && updatedOpp.deadline.getTime() - new Date().getTime() > 0) {
					this.sendMessages('opportunity-update', updatedOpp.watchers, {
						opportunity: this.setMessageData(updatedOpp)
					});

					CoreGithubController.createOrUpdateIssue({
						title: updatedOpp.name,
						body: this.getOppBody(updatedOpp),
						repo: updatedOpp.github,
						number: updatedOpp.issueNumber
					})
						.then(result => {
							updatedOpp.issueUrl = result.html_url;
							updatedOpp.issueNumber = result.number;
							this.updateSave(updatedOpp).then((updatedOpportunity: IOpportunityModel) => {
								this.populateOpportunity(updatedOpportunity).then(populatedOpportunity => {
									res.json(OpportunitiesUtilities.decorate(populatedOpportunity, req.user ? req.user.roles : []));
								});
							});
						})
						.catch(() => {
							this.respondWithRepoEditError(res);
						});
				} else {
					this.populateOpportunity(updatedOpp).then(populatedOpportunity => {
						res.json(OpportunitiesUtilities.decorate(populatedOpportunity, req.user ? req.user.roles : []));
					});
				}
			}
		});
	};

	public publish = (req, res) => {
		return this.pub(req, res, true);
	};

	public unpublish = (req, res) => {
		return this.pub(req, res, false);
	};

	// Unassign the given proposal from the given opportunity
	public unassign = async (req: Request, res: Response): Promise<void> => {
		const opportunity = req.opportunity;
		const proposal = req.proposal;
		const user = (req.user as IUserModel);

		try {
			// unassign the proposal
			await ProposalsServerController.unassign(proposal, user);

			// update the opportunity
			opportunity.status = 'Pending';
			opportunity.proposal = null;
			const savedOpportunity = await this.updateSave(opportunity);

			// update any subscribers
			this.sendMessages('opportunity-update', savedOpportunity.watchers, {
				opportunity: this.setMessageData(savedOpportunity)
			});

			// unlock github issue
			await CoreGithubController.unlockIssue({
				repo: savedOpportunity.github,
				number: savedOpportunity.issueNumber
			});

			// add comment to github issue
			await CoreGithubController.addCommentToIssue({
				comment: 'This opportunity has been un-assigned',
				repo: savedOpportunity.github,
				number: savedOpportunity.issueNumber
			});

			// decorate the opportunity with the current user roles
			const decoratedOpportunity = OpportunitiesUtilities.decorate(savedOpportunity, req.user ? (req.user as IUserModel).roles : []);

			// respond with the decorated opportunity
			res.json(decoratedOpportunity);

			return;
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	};

	// Assign the passed in proposal
	public assign = async (req: Request, res: Response): Promise<void> => {
		const opportunity = req.opportunity;
		const proposal = req.proposal;
		const user = (req.user as IUserModel);

		try {
			// assign the proposal
			await ProposalsServerController.assign(proposal, user);

			// update the opportunity
			opportunity.status = 'Assigned';
			opportunity.proposal = proposal;
			opportunity.assignedAt = new Date();
			const savedOpportunity = await this.updateSave(opportunity);

			// update any subscribers
			this.sendMessages('opportunity-update', savedOpportunity.watchers, {
				opportunity: this.setMessageData(savedOpportunity)
			});

			// send message to assigned user
			savedOpportunity.assignor = user;
			savedOpportunity.assignoremail = savedOpportunity.proposalEmail;
			this.sendMessages('opportunity-assign-cwu', [proposal.user], {
				opportunity: this.setMessageData(savedOpportunity)
			});

			// unlock github issue
			await CoreGithubController.unlockIssue({
				repo: savedOpportunity.github,
				number: savedOpportunity.issueNumber
			});

			// add comment to github issue
			await CoreGithubController.addCommentToIssue({
				comment: 'This opportunity has been assigned',
				repo: savedOpportunity.github,
				number: savedOpportunity.issueNumber
			});

			// lock the github issue
			await CoreGithubController.lockIssue({
				repo: savedOpportunity.github,
				number: savedOpportunity.issueNumber
			});

			// decorate the opportunity with the current user roles
			const decoratedOpportunity = OpportunitiesUtilities.decorate(savedOpportunity, req.user ? (req.user as IUserModel).roles : []);

			// respond with the decorated opportunity
			res.json(decoratedOpportunity);

			return;
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	};

	// Assign the passed in swu proposal
	public assignswu = async (req: Request, res: Response): Promise<void> => {
		const opportunity = req.opportunity;
		const proposal = req.proposal;
		const user = (req.user as IUserModel);

		try {
			// assign the proposal
			await ProposalsServerController.assignswu(req, res);

			// update the opportunity
			opportunity.status = 'Assigned';
			opportunity.assignedAt = new Date();
			opportunity.proposal = proposal;
			opportunity.evaluationStage = 8;
			const savedOpportunity = await this.updateSave(opportunity);

			// update any subscribers
			this.sendMessages('opportunity-update', savedOpportunity.watchers, {
				opportunity: this.setMessageData(savedOpportunity)
			});

			// send message to assigned user
			savedOpportunity.assignor = user;
			savedOpportunity.assignoremail = savedOpportunity.proposalEmail;
			this.sendMessages('opportunity-assign-swu', [proposal.user], {
				opportunity: this.setMessageData(savedOpportunity)
			});

			// unlock github issue
			await CoreGithubController.unlockIssue({
				repo: savedOpportunity.github,
				number: savedOpportunity.issueNumber
			});

			// add comment to github issue
			await CoreGithubController.addCommentToIssue({
				comment: 'This opportunity has been assigned',
				repo: savedOpportunity.github,
				number: savedOpportunity.issueNumber
			});

			// lock the github issue
			await CoreGithubController.lockIssue({
				repo: savedOpportunity.github,
				number: savedOpportunity.issueNumber
			});

			// decorate the opportunity with the current user roles
			const decoratedOpportunity = OpportunitiesUtilities.decorate(savedOpportunity, req.user ? (req.user as IUserModel).roles : []);

			// respond with the decorated opportunity
			res.json(decoratedOpportunity);

			return;
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	};

	// REST operation for getting opportunities associated with a program
	public forProgram = async (req: Request, res: Response): Promise<void> => {
		const query = this.searchTerm(req, { program: req.program._id });
		try {
			const oppList = await OpportunitiesUtilities.getOpportunityList(query, req);
			res.json(oppList);
			return;
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
			return;
		}
	};

	// Add ro remove watches for the current user
	public addWatch = (req, res) => {
		req.opportunity.watchers.addToSet(req.user._id);
		req.opportunity.save();
		res.json({ ok: true });
	};

	public removeWatch = (req, res) => {
		req.opportunity.watchers.pull(req.user._id);
		req.opportunity.save();
		res.json({ ok: true });
	};

	public deadlineStatus = (req, res) => {
		const deadlineStatus = new Date(req.opportunity.deadline).getTime() - new Date().getTime() <= 0 ? 'CLOSED' : 'OPEN';
		res.json({ deadlineStatus });
	};

	// Populates the opportunity on the request
	public opportunityByID = async (req: Request, res: Response, next: NextFunction, id: string): Promise<IOpportunityModel> => {
		// determine whether we are querying by code or by mongoose id
		let query: any;
		if (id.substr(0, 3) === 'opp') {
			query = { code: id };
		} else {
			if (!Types.ObjectId.isValid(id)) {
				res.status(400).send({
					message: 'Opportunity is invalid'
				});
				return;
			} else {
				query = { _id: id };
			}
		}

		// perform the query and go to next middleware
		try {
			const opportunity = await OpportunityModel.findOne(query);
			const populatedOpportunity = await this.populateOpportunity(opportunity);
			req.opportunity = populatedOpportunity;
			next();
		} catch (error) {
			res.status(404).send({
				message: 'No opportunity with that identifier has been found'
			});
			return;
		}
	};

	// REST operation for returning a list of all opportunities
	public list = async (req: Request, res: Response): Promise<void> => {
		const query = this.searchTerm(req);
		try {
			const oppList = await OpportunitiesUtilities.getOpportunityList(query, req);
			res.json(oppList);
			return;
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
			return;
		}
	};

	// Action an opportunity approval request (pre-approval or final approval)
	// Upon actioning, the appropriate follow up notifications are dispatched
	public action = async (req: Request, res: Response): Promise<void> => {
		const code = Number(req.body.code);
		const action = req.body.action;
		const isPreApproval = req.body.preapproval === 'true';
		const opportunity = req.opportunity;
		const approvalInfo = isPreApproval ? opportunity.intermediateApproval : opportunity.finalApproval;

		// if code matches, action and then return 200
		if (approvalInfo.twoFACode === code) {
			let notification: string;
			let whoToNotifyWhenDone: any;

			// set up depending on action type (approve or deny) and state (pre-approval or final approval)
			if (action === 'approve') {
				approvalInfo.action = 'approved';
				notification = isPreApproval ? 'opportunity-approval-request' : 'opportunity-approved-notification';
				whoToNotifyWhenDone = isPreApproval ? { email: opportunity.finalApproval.email } : opportunity.finalApproval.requestor;
				if (!isPreApproval) {
					opportunity.isApproved = true;
					opportunity.finalApproval.routeCode = new Date().valueOf().toString();
					opportunity.finalApproval.state = 'sent';
					opportunity.finalApproval.initiated = new Date();
				}
			} else {
				approvalInfo.action = 'denied';
				notification = 'opportunity-denied-notification';
				whoToNotifyWhenDone = opportunity.finalApproval.requestor;
			}

			// record actioned timestamp
			approvalInfo.state = 'actioned';
			approvalInfo.actioned = new Date();

			// save the opportunity
			const updatedOpportunity = await this.updateSave(opportunity);

			// notify the requestor if final, or the final if pre-approval
			this.sendMessages(notification, [whoToNotifyWhenDone], { opportunity: this.setMessageData(updatedOpportunity) });
			res.json(updatedOpportunity);
			return;
		} else {
			approvalInfo.twoFAAttemptCount++;
			await this.updateSave(opportunity);
			res.status(401).json({
				message: 'Invalid code'
			});
		}
	};

	// Delete the opportunity
	public delete = (req, res) => {
		if (this.ensureAdmin(req.opportunity, req.user, res)) {
			const opportunity = req.opportunity;
			opportunity.remove(err => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(opportunity);
				}
			});
		}
	};

	// Sends a 2FA code using the opportunity and approval info in the request
	public send2FA = (req, res) => {
		let opportunity = req.opportunity;
		const intermediateApproval = opportunity.intermediateApproval;
		const finalApproval = opportunity.finalApproval;

		const approvalToAction = intermediateApproval.state === 'sent' ? intermediateApproval : finalApproval;

		// generate a new 2FA code and save to opportunity
		const twoFA = Math.floor(100000 + Math.random() * 900000);
		approvalToAction.twoFACode = twoFA;
		approvalToAction.twoFASendCount++;
		this.updateSave(opportunity).then(savedOpportunity => {
			opportunity = savedOpportunity;
			if (approvalToAction.twoFAMethod === 'email') {
				this.send2FAviaEmail(approvalToAction);
			} else {
				// this.send2FAviaSMS(approvalToAction);
			}

			res.json(opportunity);
		});
	};

	// Get proposal statistics for the given opportunity in the request
	public getProposalStats = async (req: Request, res: Response): Promise<void> => {
		if (!this.ensureAdmin(req.opportunity, req.user, res)) {
			res.json({
				message: 'User is not authorized'
			});
			return;
		}

		const opportunity = req.opportunity;
		const result: any = {
			following: opportunity.watchers ? opportunity.watchers.length : 0,
			submitted: 0,
			draft: 0
		};

		try {
			const aggregateCountDoc = await this.getCountAggregate(opportunity._id);
			await aggregateCountDoc.eachAsync((doc: any) => {
				result[doc._id.toLowerCase()] = doc.count;
			});
			res.json(result);
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
		return;
	};

	// Create an archive of all proposals for the given opportunity in the request
	public getProposalArchive = async (req: Request, res: Response): Promise<void> => {
		// Make sure user has admin access
		if (!this.ensureAdmin(req.opportunity, req.user, res)) {
			res.json([]);
			return;
		}

		// Make a zip archive with the opportunity name
		const opportunityName = req.opportunity.name.replace(/\W/g, '-').replace(/-+/, '-');
		const zip = new JSZip();
		let proponentName: string;
		let email: string;
		let files: IAttachmentModel[];
		let links: string[];
		let proposalHtml: string;
		let header: string;
		let content: string;

		// Create the zip file;
		zip.folder(opportunityName);

		// Get all submitted and assigned proposals
		try {
			const proposals = await ProposalModel.find({ opportunity: req.opportunity._id, status: { $in: ['Submitted', 'Assigned'] } })
				.sort('status created')
				.populate('user')
				.populate('opportunity', 'opportunityTypeCd name code')
				.exec();

			proposals.forEach(proposal => {
				proponentName = proposal.user.displayName.replace(/\W/g, '-').replace(/-+/, '-');
				if (proposal.status === 'Assigned') {
					proponentName += '-ASSIGNED';
				}
				files = proposal.attachments;
				email = proposal.user.email;
				proposalHtml = proposal.detail;

				// Go through the files and build the internal links (reset links first)
				// also build the index.html content
				links = [];
				files.forEach(file => {
					links.push('<a href="docs/' + encodeURIComponent(file.name) + '" target="_blank">' + file.name + '</a>');
				});
				header = '<h2>Proponent</h2>' + proposal.user.displayName + '<br/>';
				header += email + '<br/>';
				if (!proposal.isCompany) {
					header += proposal.user.address + '<br/>';
					header += proposal.user.phone + '<br/>';
				} else {
					header += '<b><i>Company:</i></b>' + '<br/>';
					header += proposal.user.businessName + '<br/>';
					header += proposal.user.businessAddress + '<br/>';
					header += '<b><i>Contact:</i></b>' + '<br/>';
					header += proposal.user.businessContactName + '<br/>';
					header += proposal.user.businessContactPhone + '<br/>';
					header += proposal.user.businessContactEmail + '<br/>';
				}
				header += '<h2>Documents</h2><ul><li>' + links.join('</li><li>') + '</li></ul>';
				content = '<html><body>' + header + '<h2>Proposal</h2>' + proposalHtml + '</body></html>';

				// Add the directory, content and documents for this proposal
				zip.folder(opportunityName).folder(proponentName);
				zip.folder(opportunityName)
					.folder(proponentName)
					.file('index.html', content);
				this.addFilesToZip(zip, opportunityName, proponentName, files);
			});

			res.setHeader('Content-Type', 'application/zip');
			res.setHeader('Content-Type', 'application/octet-stream');
			res.setHeader('Content-Description', 'File Transfer');
			res.setHeader('Content-Transfer-Encoding', 'binary');
			res.setHeader('Content-Disposition', 'attachment; inline=false; filename="' + opportunityName + '.zip' + '"');

			zip.generateNodeStream({ compression: 'DEFLATE', streamFiles: true }).pipe(res);
			return;
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
			return;
		}
	};

	// Create an archive of a single proposal for the given opportunity and belong to the given user
	public getMyProposalArchive = async (req: Request, res: Response): Promise<void> => {
		// Create a zip archive from the opportunity name
		const opportunityName = req.opportunity.name.replace(/\W/g, '-').replace(/-+/, '-');
		const zip = new JSZip();

		zip.folder(opportunityName);

		try {
			const proposal = await ProposalModel.findOne({ user: (req.user as IUserModel)._id, opportunity: req.opportunity._id })
				.populate('createdBy', 'displayName')
				.populate('updatedBy', 'displayName')
				.populate('opportunity')
				.populate('phases.inception.team')
				.populate('phases.proto.team')
				.populate('phases.implementation.team')
				.populate('user')
				.exec();

			let proponentName = proposal.user.displayName.replace(/\W/g, '-').replace(/-+/, '-');
			if (proposal.status === 'Assigned') {
				proponentName += '-ASSIGNED';
			}
			const files = proposal.attachments;
			const email = proposal.user.email;

			// go through the files and build the internal links (reset links first)
			// also build the index.html content
			const links = [];
			files.forEach(file => {
				links.push('<a href="docs/' + encodeURIComponent(file.name) + '" target="_blank">' + file.name + '</a>');
			});
			let questions = '<ol>';
			proposal.teamQuestionResponses.forEach(question => {
				questions += '<li style="margin: 10px 0;"><i>Question: ' + question.question + '</i><br/>Response: ' + question.response + '<br/>';
			});
			questions += '</ol>';
			let phases = '<h3>Inception</h3>';
			phases += 'Team:<ol>';
			proposal.phases.inception.team.forEach(teamMember => {
				phases += '<li>' + teamMember.displayName + '</li>';
			});
			phases += '</ol>';
			phases += 'Cost: ';
			phases += '$' + proposal.phases.inception.cost.toFixed(2);

			phases += '<h3>Prototype</h3>';
			phases += 'Team:<ol>';
			proposal.phases.proto.team.forEach(teamMember => {
				phases += '<li>' + teamMember.displayName + '</li>';
			});
			phases += '</ol>';
			phases += 'Cost: ';
			phases += '$' + proposal.phases.proto.cost.toFixed(2);

			phases += '<h3>Implementation</h3>';
			phases += 'Team:<ol>';
			proposal.phases.implementation.team.forEach(teamMember => {
				phases += '<li>' + teamMember.displayName + '</li>';
			});
			phases += '</ol>';
			phases += 'Cost: ';
			phases += '$' + proposal.phases.implementation.cost.toFixed(2);

			phases += '<br/><br/><b>Total Cost: ';
			phases += '$' + (proposal.phases.inception.cost + proposal.phases.proto.cost + proposal.phases.implementation.cost).toFixed(2);
			phases += '</b><br/>';

			let header = '<h2>Proposal</h2>';
			header += 'Status: ';
			header += proposal.status;
			header += '<br/>';
			header += 'Accepted Terms: ';
			header += proposal.isAcceptedTerms ? 'Yes' : 'No';
			header += '<br/>';
			header += 'Created on: ';
			header += new Date(proposal.created).toDateString();
			header += '<br/>';
			header += 'Lasted updated: ';
			header += new Date(proposal.updated).toDateString();
			header += '<h2>Proponent</h2>' + proposal.user.displayName + '<br/>';
			header += email + '<br/>';
			header += '<b><i>Company:</i></b>' + '<br/>';
			header += proposal.businessName + '<br/>';
			header += proposal.businessAddress + '<br/>';
			header += '<b><i>Contact:</i></b>' + '<br/>';
			header += proposal.businessContactName + '<br/>';
			header += proposal.businessContactPhone + '<br/>';
			header += proposal.businessContactEmail + '<br/>';
			if (links.length > 0) {
				header += '<h2>Attachments/References</h2><ul><li>' + links.join('</li><li>') + '</li></ul>';
			}
			let content = '<html><body>';
			content += header;
			content += '<h2>Phases</h2>' + phases;
			content += '<h2>Team Questions</h2>' + questions;
			content += '</body></html>';

			// add the directory, content and documents for this proposal
			zip.folder(opportunityName).folder(proponentName);
			zip.folder(opportunityName)
				.folder(proponentName)
				.file('proposal-summary.html', content);
			this.addFilesToZip(zip, opportunityName, proponentName, files);

			res.setHeader('Content-Type', 'application/zip');
			res.setHeader('Content-Type', 'application/octet-stream');
			res.setHeader('Content-Description', 'File Transfer');
			res.setHeader('Content-Transfer-Encoding', 'binary');
			res.setHeader('Content-Disposition', 'attachment; inline=false; filename="' + opportunityName + '.zip' + '"');

			zip.generateNodeStream({ compression: 'DEFLATE', streamFiles: true }).pipe(res);
			return;
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
			return;
		}
	};

	// Returns an aggregate cursor that counts proposals on an opportunity and groups by their status
	private getCountAggregate = async (id: any): Promise<any> => {
		return ProposalModel.aggregate([
			{
				$match: {
					opportunity: id
				}
			},
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 }
				}
			}
		])
			.cursor({})
			.exec();
	};

	// Initiate the opportunity approval workflow by sending the initial
	// pre-approval email and configuring the opportunity as required
	private sendApprovalMessages = async (requestingUser, opportunity) => {
		if (opportunity.intermediateApproval.state === 'ready-to-send') {
			// ensure opportunity is populated
			opportunity = await this.populateOpportunity(opportunity);

			// send intermediate approval request
			this.sendMessages('opportunity-pre-approval-request', [{ email: opportunity.intermediateApproval.email }], { opportunity: this.setMessageData(opportunity) });
			opportunity.intermediateApproval.state = 'sent';
			opportunity.intermediateApproval.twoFASendCount = 0;
			opportunity.intermediateApproval.twoFAAttemptCount = 0;
			opportunity.finalApproval.state = 'draft';
			opportunity.finalApproval.twoFASendCount = 0;
			opportunity.finalApproval.twoFAAttemptCount = 0;
			this.updateSave(opportunity);
		}
	};

	//
	// Send a 2FA token via SMS using the passed approval info
	//
	// private send2FAviaSMS = approvalInfo => {
	// 	const nexmo = new Nexmo({
	// 		apiKey: process.env.NEXMO_API_KEY,
	// 		apiSecret: process.env.NEXMO_API_SECRET
	// 	});

	// 	const from = process.env.NEXMO_FROM_NUMBER;
	// 	const to = approvalInfo.mobileNumber;
	// 	const msg = approvalInfo.twoFACode;

	// 	nexmo.message.sendSms(from, to, msg);
	// };

	//
	// Send a 2FA token via email using the passed approval info
	//
	private send2FAviaEmail = approvalInfo => {
		this.sendMessages('opportunity-approval-2FA', [{ email: approvalInfo.email }], {
			approvalInfo
		});
	};

	private adminRole = opportunity => {
		return opportunity.code + '-admin';
	};

	private memberRole = opportunity => {
		return opportunity.code;
	};

	private requestRole = opportunity => {
		return opportunity.code + '-request';
	};

	private setOpportunityAdmin = (opportunity, user) => {
		user.addRoles([this.memberRole(opportunity), this.adminRole(opportunity)]);
	};

	private ensureAdmin = (opportunity, user, res?) => {
		if (!user || (user.roles.indexOf(this.adminRole(opportunity)) === -1 && user.roles.indexOf('admin') === -1)) {
			if (res) {
				res.status(422).send({
					message: 'User Not Authorized'
				});
			}
			return false;
		} else {
			return true;
		}
	};

	private searchTerm = (req: Request, opts?: any): any => {
		opts = opts || {};
		const me = CoreServerHelpers.summarizeRoles(req.user && (req.user as IUserModel).roles ? (req.user as IUserModel).roles : null);
		if (!me.isAdmin) {
			opts.$or = [{ isPublished: true }, { code: { $in: me.opportunities.admin } }];
		}
		return opts;
	};

	private incrementViews = id => {
		OpportunityModel.updateOne({ _id: id }, { $inc: { views: 1 } }).exec();
	};

	// Set all the info we need for notification merging
	private setNotificationData = opportunity => {
		return {
			name: opportunity.name,
			short: opportunity.short,
			description: opportunity.description,
			earn: CoreServerHelpers.formatMoney(opportunity.opportunityTypeCd === 'sprint-with-us' ? opportunity.phases.aggregate.target : opportunity.earn, 2),
			dateDeadline: CoreServerHelpers.formatDate(new Date(opportunity.deadline)),
			dateAssignment: CoreServerHelpers.formatDate(new Date(opportunity.assignment)),
			dateStart: CoreServerHelpers.formatDate(new Date(opportunity.start)),
			datePublished: CoreServerHelpers.formatDate(new Date(opportunity.lastPublished)),
			updatenotification: 'not-update-' + opportunity.code,
			code: opportunity.code,
			opptype: opportunity.opportunityTypeCd === 'sprint-with-us' ? 'swu' : 'cwu',
			skills: opportunity.skills.join(', ')
		};
	};

	private setMessageData = opportunity => {
		opportunity.path = '/opportunities/' + (opportunity.opportunityTypeCd === 'sprint-with-us' ? 'swu' : 'cwu') + '/' + opportunity.code;
		opportunity.earn = opportunity.opportunityTypeCd === 'sprint-with-us' ? opportunity.phases.aggregate.target : opportunity.earn;
		opportunity.dateDeadline = CoreServerHelpers.formatDate(new Date(opportunity.deadline));
		opportunity.dateAssignment = CoreServerHelpers.formatDate(new Date(opportunity.assignment));
		opportunity.dateStart = CoreServerHelpers.formatDate(new Date(opportunity.start));
		opportunity.datePublished = CoreServerHelpers.formatDate(new Date(opportunity.lastPublished));

		opportunity.contract.estimatedValue_formatted = Intl.NumberFormat('en', {
			style: 'currency',
			currency: 'USD'
		}).format(opportunity.contract.estimatedValue);

		opportunity.contract.stobExpenditures_formatted = Intl.NumberFormat('en', {
			style: 'currency',
			currency: 'USD'
		}).format(opportunity.contract.stobExpenditures);

		opportunity.contract.stobBudget_formatted = Intl.NumberFormat('en', {
			style: 'currency',
			currency: 'USD'
		}).format(opportunity.contract.stobBudget);

		opportunity.contract.contractType_formatted = opportunity.contract.contractType.charAt(0).toUpperCase() + opportunity.contract.contractType.slice(1);
		opportunity.contract.legallyRequired_formatted = opportunity.contract.legallyRequired ? 'Yes' : 'No';
		opportunity.intermediateApproval.actioned_formatted = CoreServerHelpers.formatDate(new Date(opportunity.intermediateApproval.actioned));

		return opportunity;
	};

	// Publish or unpublish
	private pub = (req, res, isToBePublished) => {
		const opportunity = req.opportunity;
		// if no change or we dont have permission to do this just return as a no-op
		if (req.opportunity.isPublished === isToBePublished || !this.ensureAdmin(req.opportunity, req.user, res)) {
			return res.json(OpportunitiesUtilities.decorate(req.opportunity, req.user ? req.user.roles : []));
		}

		// determine first time or not
		const firstTime = isToBePublished && !opportunity.wasPublished;

		// set the correct new state and set the publish date if being published
		opportunity.isPublished = isToBePublished;
		if (isToBePublished) {
			opportunity.lastPublished = new Date();
			opportunity.wasPublished = true;
		}

		// save and notify
		this.updateSave(opportunity)
			.then(() => {
				if (firstTime) {
					this.getSubscribedUsers().then(users => {
						const messageCode = opportunity.opportunityTypeCd === 'code-with-us' ? 'opportunity-add-cwu' : 'opportunity-add-swu';
						this.sendMessages(messageCode, users, {
							opportunity: this.setMessageData(opportunity)
						});
					});
				} else if (isToBePublished) {
					this.sendMessages('opportunity-update', opportunity.watchers, {
						opportunity: this.setMessageData(opportunity)
					});
				}
				CoreGithubController.createOrUpdateIssue({
					title: opportunity.name,
					body: this.getOppBody(opportunity),
					repo: opportunity.github,
					number: opportunity.issueNumber
				})
					.then(result => {
						opportunity.issueUrl = result.html_url;
						opportunity.issueNumber = result.number;
						opportunity.save();
						res.json(OpportunitiesUtilities.decorate(opportunity, req.user ? req.user.roles : []));
					})
					.catch(() => {
						this.respondWithRepoEditError(res);
					});
			})
			.catch(err => {
				return res.status(422).send({
					message: CoreServerErrors.getErrorMessage(err)
				});
			});
	};

	// Get a list of all users who are listening to the add opp event
	private async getSubscribedUsers(): Promise<IUserModel[]> {
		return await UserModel.find({ notifyOpportunities: true, email: { $ne: null } }, '_id email firstName lastName displayName').exec();
	}

	// Save the given opportunity and returns the updated version
	private updateSave = async (opportunity: IOpportunityModel): Promise<IOpportunityModel> => {
		return await opportunity.save();
	};

	// Set up internal aggregate states for phase information
	private setPhases = opportunity => {
		//
		// only for sprint with us
		//
		if (opportunity.opportunityTypeCd !== 'sprint-with-us') {
			return;
		}
		const imp = opportunity.phases.implementation;
		const inp = opportunity.phases.inception;
		const prp = opportunity.phases.proto;
		const agg = opportunity.phases.aggregate;
		//
		// for sprint with us opportunities we may have arrays of phase capabilities
		// we need to copy those into the aggregate view, simplest using a little pivot
		//
		const capabilities = imp.capabilities.concat(inp.capabilities, prp.capabilities);
		const capabilitiesCore = imp.capabilitiesCore.concat(inp.capabilitiesCore, prp.capabilitiesCore);
		const capabilitySkills = imp.capabilitySkills.concat(inp.capabilitySkills, prp.capabilitySkills);

		agg.capabilities = capabilities;
		agg.capabilitiesCore = capabilitiesCore;
		agg.capabilitySkills = capabilitySkills;
		//
		// total up the targets
		//
		imp.target = CoreServerHelpers.numericOrZero(imp.target);
		inp.target = CoreServerHelpers.numericOrZero(inp.target);
		prp.target = CoreServerHelpers.numericOrZero(prp.target);
		agg.target = imp.target + inp.target + prp.target;
		//
		// if the budget was set it takes priority over the total targets
		//
		if (opportunity.budget && opportunity.budget > 0) {
			agg.target = opportunity.budget;
		}
		//
		// get the earliest and latest date
		//
		agg.startDate = [imp.startDate, inp.startDate, prp.startDate].sort()[0];
		agg.endDate = [imp.endDate, inp.endDate, prp.endDate].sort()[2];
	};

	private getOppBody = opp => {
		// This will format the deadline like:
		// Thursday, January 31, 2019 at 16:00 PST
		const deadline = moment(opp.deadline)
			.tz('America/Vancouver')
			.format('dddd, MMMM Do, YYYY [at] HH:mm z');
		const oppType = opp.opportunityTypeCd === 'sprint-with-us' ? 'swu' : 'cwu';
		const oppUrl = `https://bcdevexchange.org/opportunities/${oppType}/${opp.code}`;

		return `
<p>This issue has been auto-generated to facilitate questions about
<a href="${oppUrl}"> a paid opportunity</a> that has just been posted on the
<a href="https://bcdevexchange.org">BCDevExchange</a>.</p>

<p>To learn more or apply, <a href="${oppUrl}">visit the opportunity page</a>.
The opportunity closes on <b>${deadline}</b>.</p>
		`;
	};

	private populateOpportunity = (opportunity: IOpportunityModel): Promise<IOpportunityModel> => {
		return opportunity
			.populate('createdBy', 'displayName email')
			.populate('updatedBy', 'displayName')
			.populate('project', 'code name _id isPublished')
			.populate('program', 'code title _id logo isPublished')
			.populate('phases.implementation.capabilities')
			.populate('phases.implementation.capabilitiesCore')
			.populate('phases.implementation.capabilitySkills')
			.populate('phases.inception.capabilities')
			.populate('phases.inception.capabilitiesCore')
			.populate('phases.inception.capabilitySkills')
			.populate('phases.proto.capabilities')
			.populate('phases.proto.capabilitiesCore')
			.populate('phases.proto.capabilitySkills')
			.populate('phases.aggregate.capabilities')
			.populate('phases.aggregate.capabilitiesCore')
			.populate('phases.aggregate.capabilitySkills')
			.populate('intermediateApproval.requestor', 'displayName email')
			.populate('finalApproval.requestor', 'displayName email')
			.populate('watchers')
			.populate([
				{
					path: 'proposal',
					model: 'Proposal',
					populate: [
						{
							path: 'user',
							model: 'User'
						},
						{
							path: 'org',
							model: 'Org'
						}
					]
				},
				{
					path: 'phases.inception.capabilities',
					model: 'Capability',
					populate: [
						{
							path: 'skills',
							model: 'CapabilitySkill'
						}
					]
				},
				{
					path: 'phases.proto.capabilities',
					model: 'Capability',
					populate: [
						{
							path: 'skills',
							model: 'CapabilitySkill'
						}
					]
				},
				{
					path: 'phases.implementation.capabilities',
					model: 'Capability',
					populate: [
						{
							path: 'skills',
							model: 'CapabilitySkill'
						}
					]
				}
			])
			.populate('addenda.createdBy', 'displayName')
			.execPopulate();
	};

	private addFilesToZip(zip: JSZip, opportunityName: string, proponentName: string, files: IAttachmentModel[]): void {
		files.forEach(file => {
			zip.folder(opportunityName)
				.folder(proponentName)
				.folder('docs')
				.file(file.name, fs.readFileSync(file.path), { binary: true });
		});
	}

	private respondWithRepoEditError(res: Response) {
		res.status(422).send({
			message: 'Opportunity saved, but there was an error updating the github issue. Please check your repo url and try again.'
		});
	}
}

export default OpportunitiesServerController.getInstance();
