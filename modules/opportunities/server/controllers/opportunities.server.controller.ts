'use strict';

import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import * as Nexmo from 'nexmo';
import * as github from '../../../core/server/controllers/core.server.github';
import * as helpers from '../../../core/server/controllers/core.server.helpers';
import * as errorHandler from '../../../core/server/controllers/errors.server.controller';
import * as Messages from '../../../messages/server/controllers/messages.controller';
import { OpportunitiesUtilities } from '../../../opportunities/server/utilities/opportunities.server.utilities';
import * as Proposals from '../../../proposals/server/controllers/proposals.server.controller';
import { Proposal } from '../../../proposals/server/models/proposal.server.model';
import { User } from '../../../users/server/models/user.server.model';
import { IOpportunityDocument } from '../interfaces/IOpportunityDocument';
import { Opportunity } from '../models/opportunity.server.model';

export class OpportunitiesController {
	private opportunitiesUtilities = new OpportunitiesUtilities();
	private sendMessages = Messages.sendMessages;

	// Return a list of all opportunity members. this means all members NOT
	// including users who have requested access and are currently waiting
	public members = (opportunity, cb) => {
		User.find({ roles: this.memberRole(opportunity) })
			.select('isDisplayEmail username displayName updated created roles \
				government profileImageURL email lastName firstName userTitle')
			.exec(cb);
	};

	// Return a list of all users who are currently waiting to be added to the
	// opportunity member list
	public requests = (opportunity, cb) => {
		mongoose
			.model('User')
			.find({ roles: this.requestRole(opportunity) })
			.select('isDisplayEmail username displayName updated created roles \
				government profileImageURL email lastName firstName userTitle')
			.exec(cb);
	};

	// Takes the already queried object and pass it back
	public read = (req, res) => {
		res.json(this.opportunitiesUtilities.decorate(req.opportunity, req.user ? req.user.roles : []));
		this.incrementViews(req.opportunity._id);
	};

	// Create a new opportunity. the user doing the creation will be set as the
	// administrator
	public create = (req, res) => {
		const opportunity = new Opportunity(req.body);
		//
		// set the code, this is used setting roles and other stuff
		//
		Opportunity.findUniqueCode(opportunity.name, null, newcode => {
			opportunity.code = newcode;
			//
			// set the audit fields so we know who did what when
			//
			helpers.applyAudit(opportunity, req.user);
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
						message: errorHandler.getErrorMessage(err)
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
			return res.json(this.opportunitiesUtilities.decorate(req.opportunity, req.user ? req.user.roles : []));
		}

		// copy over everything passed in. This will overwrite the
		// audit fields, but they get updated in the following step
		let opportunity = _.mergeWith(req.opportunity, req.body, (objValue, srcValue) => {
			if (_.isArray(objValue)) {
				return srcValue;
			}
		});

		// manually transfer over skills, as the merge won't handle removals properly from the skills array
		// opportunity.skills = req.body.skills;
		//
		// set the audit fields so we know who did what when
		//
		helpers.applyAudit(opportunity, req.user);
		//
		// update phase information
		//
		this.setPhases(opportunity);
		//
		// save
		//
		this.updateSave(opportunity)
			.then(() => {
				// send out approval request messages as needed
				if (!opportunity.isApproved) {
					this.sendApprovalMessages(req.user, opportunity);
				}

				// send out opportunity update notifications on published opportunities that are still open
				if (opportunity.isPublished && opportunity.deadline.getTime() - new Date().getTime() > 0) {
					this.sendMessages('opportunity-update', opportunity.watchers, {
						opportunity: this.setMessageData(opportunity)
					});
					github
						.createOrUpdateIssue({
							title: opportunity.name,
							body: this.getOppBody(opportunity),
							repo: opportunity.github,
							number: opportunity.issueNumber
						})
						.then(result => {
							opportunity.issueUrl = result.html_url;
							opportunity.issueNumber = result.number;
							this.updateSave(opportunity).then(updatedOpportunity => {
								opportunity = updatedOpportunity;
								res.json(this.opportunitiesUtilities.decorate(opportunity, req.user ? req.user.roles : []));
							});
						})
						.catch(() => {
							res.status(422).send({
								message: 'Opportunity saved, but there was an error updating the github issue. \
									Please check your repo url and try again.'
							});
						});
				} else {
					res.json(this.opportunitiesUtilities.decorate(opportunity, req.user ? req.user.roles : []));
				}
			})
			.catch(err => {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			});
	};

	public publish = (req, res) => {
		return this.pub(req, res, true);
	};

	public unpublish = (req, res) => {
		return this.pub(req, res, false);
	};

	// Unassign the given proposal from the given opportunity
	public unassign = (req, res) => {
		let opportunity = req.opportunity;
		const proposal = req.proposal;
		const user = req.user;

		// unassign the proposal
		Proposals.unassign(proposal, user)

			// update the opportunity into pending status with no proposal
			.then(() => {
				opportunity.status = 'Pending';
				opportunity.proposal = null;
				return this.updateSave(opportunity);
			})

			// notify of changes
			// update the issue on github
			.then(savedOpportunity => {
				opportunity = savedOpportunity;
				this.sendMessages('opportunity-update', opportunity.watchers, {
					opportunity: this.setMessageData(opportunity)
				});

				return github
					.unlockIssue({
						repo: opportunity.github,
						number: opportunity.issueNumber
					})
					.then(() => {
						return github.addCommentToIssue({
							comment: 'This opportunity has been un-assigned',
							repo: opportunity.github,
							number: opportunity.issueNumber
						});
					});
			})

			// return the new opportunity or fail
			.then(() => {
				res.json(this.opportunitiesUtilities.decorate(opportunity, req.user ? req.user.roles : []));
			})
			.catch(err => {
				res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			});
	};

	// Assign the passed in proposal
	public assign = (req, res) => {
		let opportunity = req.opportunity;
		const proposal = req.proposal;
		const user = req.user;

		Proposals.assign(proposal, user)

			.then(() => {
				opportunity.status = 'Assigned';
				opportunity.proposal = proposal;
				return this.updateSave(opportunity);
			})

			// notify of changes
			// update the issue on github
			.then(savedOpportunity => {
				opportunity = savedOpportunity;
				this.sendMessages('opportunity-update', opportunity.watchers, {
					opportunity: this.setMessageData(opportunity)
				});

				opportunity.assignor = user.displayName;
				opportunity.assignoremail = opportunity.proposalEmail;
				this.sendMessages('opportunity-assign-cwu', [proposal.user], {
					opportunity: this.setMessageData(opportunity)
				});

				return (
					github
						.unlockIssue({
							repo: opportunity.github,
							number: opportunity.issueNumber
						})
						.then(() => {
							return github
								.addCommentToIssue({
									comment: 'This opportunity has been assigned',
									repo: opportunity.github,
									number: opportunity.issueNumber
								})
								.then(() => {
									return github.lockIssue({
										repo: opportunity.github,
										number: opportunity.issueNumber
									});
								});
						})

						// return the new opportunity or fail
						.then(() => {
							res.json(this.opportunitiesUtilities.decorate(opportunity, req.user ? req.user.roles : []));
						})
						.catch(err => {
							res.status(422).send({
								message: errorHandler.getErrorMessage(err)
							});
						})
				);
			});
	};

	// Assign the passed in swu proposal
	public assignswu = (opportunityId, proposalId, proposalUser, user) => {
		return new Promise((resolve, reject) => {
			Opportunity.findById(opportunityId).exec((err, opportunity) => {
				if (err) {
					reject(err);
				} else if (!opportunity) {
					reject(new Error('No opportunity with that identifier has been found'));
				} else {
					opportunity.status = 'Assigned';
					opportunity.proposal = proposalId;
					opportunity.evaluationStage = 4; // TBD: this is terrible, how would we know this anyhow ?
					this.updateSave(opportunity)
						.then((opp: IOpportunityDocument) => {
							opportunity = opp;
							// var data = setNotificationData (opportunity);
							this.sendMessages('opportunity-update', opportunity.watchers, {
								opportunity: this.setMessageData(opportunity)
							});
							// data.username = proposalUser.displayName;
							// data.useremail = proposalUser.email;
							//
							// in future, if we want to attach we can: data.filename = 'cwuterms.pdf';
							//
							// data.assignor = user.displayName;
							// data.assignoremail = opportunity.proposalEmail;
							opportunity.assignor = user.displayName;
							opportunity.assignoremail = opportunity.proposalEmail;
							this.sendMessages('opportunity-assign-swu', [proposalUser], {
								opportunity: this.setMessageData(opportunity)
							});
							// Notifications.notifyUserAdHoc ('assignopp', data);
							return github
								.addCommentToIssue({
									comment: 'This opportunity has been assigned',
									repo: opportunity.github,
									number: opportunity.issueNumber
								})
								.then(() => {
									return github.lockIssue({
										repo: opportunity.github,
										number: opportunity.issueNumber
									});
								});
						})
						.then(resolve, reject);
				}
			});
		});
	};

	// Get opportunities under program
	public forProgram = (req, res) => {
		this.opportunitiesUtilities.opplist(this.searchTerm(req, { program: req.program._id }), req, (err, opportunities) => {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.json(opportunities);
			}
		});
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
	public opportunityByID = (req, res, next, id) => {
		if (id.substr(0, 3) === 'opp') {
			Opportunity.findOne({ code: id })
				.populate('createdBy', 'displayName email')
				.populate('updatedBy', 'displayName')
				.populate('project', 'code name _id isPublished')
				.populate('program', 'code title _id logo isPublished')
				.populate('phases.implementation.capabilities', 'code name')
				.populate('phases.implementation.capabilitiesCore', 'code name')
				.populate('phases.implementation.capabilitySkills', 'code name')
				.populate('phases.inception.capabilities', 'code name')
				.populate('phases.inception.capabilitiesCore', 'code name')
				.populate('phases.inception.capabilitySkills', 'code name')
				.populate('phases.proto.capabilities', 'code name')
				.populate('phases.proto.capabilitiesCore', 'code name')
				.populate('phases.proto.capabilitySkills', 'code name')
				.populate('phases.aggregate.capabilities', 'code name')
				.populate('phases.aggregate.capabilitiesCore', 'code name')
				.populate('phases.aggregate.capabilitySkills', 'code name')
				.populate('intermediateApproval.requestor', 'displayName email')
				.populate('finalApproval.requestor', 'displayName email')
				.populate({
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
				})
				.populate('addenda.createdBy', 'displayName')
				.exec((err, opportunity) => {
					if (err) {
						return next(err);
					} else if (!opportunity) {
						return res.status(404).send({
							message: 'No opportunity with that identifier has been found'
						});
					}
					req.opportunity = opportunity;
					next();
				});
		} else {
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).send({
					message: 'Opportunity is invalid'
				});
			}

			Opportunity.findById(id)
				.populate('createdBy', 'displayName')
				.populate('updatedBy', 'displayName')
				.populate('project', 'code name _id isPublished')
				.populate('program', 'code title _id logo isPublished')
				.populate('phases.implementation.capabilities', 'code name')
				.populate('phases.implementation.capabilitiesCore', 'code name')
				.populate('phases.implementation.capabilitySkills', 'code name')
				.populate('phases.inception.capabilities', 'code name')
				.populate('phases.inception.capabilitiesCore', 'code name')
				.populate('phases.inception.capabilitySkills', 'code name')
				.populate('phases.proto.capabilities', 'code name')
				.populate('phases.proto.capabilitiesCore', 'code name')
				.populate('phases.proto.capabilitySkills', 'code name')
				.populate('phases.aggregate.capabilities', 'code name')
				.populate('phases.aggregate.capabilitiesCore', 'code name')
				.populate('phases.aggregate.capabilitySkills', 'code name')
				.populate('intermediateApproval.requestor', 'displayName email')
				.populate('finalApproval.requestor', 'displayName email')
				.populate({
					path: 'proposal',
					model: 'Proposal',
					populate: {
						path: 'user',
						model: 'User'
					}
				})
				.exec((err, opportunity) => {
					if (err) {
						return next(err);
					} else if (!opportunity) {
						return res.status(404).send({
							message: 'No opportunity with that identifier has been found'
						});
					}
					req.opportunity = opportunity;
					next();
				});
		}
	};

	// Return a list of all opportunities
	public list = (req, res) => {
		this.opportunitiesUtilities.opplist(this.searchTerm(req), req, (err, opportunities) => {
			if (err) {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.json(opportunities);
			}
		});
	};

	// Action an opportunity approval request (pre-approval or final approval)
	// Upon actioning, the appropriate follow up notifications are dispatched
	public action = (req, res) => {
		const code = Number(req.body.code);
		const action = req.body.action;
		const isPreApproval = req.body.preapproval === 'true';
		let opportunity = req.opportunity;

		const approvalInfo = isPreApproval ? opportunity.intermediateApproval : opportunity.finalApproval;

		// if code matches, action and then return 200
		if (approvalInfo.twoFACode === code) {
			// mark as approved
			if (action === 'approve') {
				approvalInfo.state = 'actioned';
				approvalInfo.action = 'approved';
				approvalInfo.actioned = Date.now();

				if (isPreApproval === false) {
					opportunity.isApproved = true;
					this.updateSave(opportunity).then(() => {
						// send a notification message to original requestor notifying of approval
						this.sendMessages('opportunity-approved-notification', [opportunity.finalApproval.requestor], { opportunity: this.setMessageData(opportunity) });
						res.status(200).json({
							message: 'Opportunity approved!',
							succeed: true
						});
					});
				} else {
					// now that pre-approval is done, initiate the final approval process
					opportunity.finalApproval.routeCode = new Date().valueOf();
					opportunity.finalApproval.state = 'sent';
					opportunity.finalApproval.initiated = Date.now();
					this.updateSave(opportunity).then(savedOpportunity => {
						opportunity = savedOpportunity;
						this.sendMessages('opportunity-approval-request', [{ email: opportunity.finalApproval.email }], { opportunity: this.setMessageData(opportunity) });
						res.status(200).json({
							message: 'Opportunity pre-approved!',
							succeed: true
						});
					});
				}
			} else {
				approvalInfo.state = 'actioned';
				approvalInfo.action = 'denied';
				approvalInfo.actioned = Date.now();

				this.updateSave(opportunity).then(() => {
					// send a notification message to original requestor notifying of rejection
					this.sendMessages('opportunity-denied-notification', [opportunity.finalApproval.requestor], { opportunity: this.setMessageData(opportunity) });
					res.status(200).json({
						message: 'Opportunity rejected',
						succeed: true
					});
				});
			}
		} else {
			approvalInfo.twoFAAttemptCount++;
			this.updateSave(opportunity).then(() => {
				res.status(200).json({
					message: 'Invalid code',
					succeed: false
				});
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
						message: errorHandler.getErrorMessage(err)
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
				this.send2FAviaSMS(approvalToAction);
			}

			res.status(200).send();
		});
	};

	// Get proposals for a given opportunity
	public getProposals = (req, res) => {
		if (!req.opportunity) {
			return res.status(422).send({
				message: 'Valid opportunity not provided'
			});
		}

		if (!this.ensureAdmin(req.opportunity, req.user, res)) {
			return res.json({ message: 'User is not authorized' });
		}

		Proposal.find({ opportunity: req.opportunity._id, $or: [{ status: 'Submitted' }, { status: 'Assigned' }] })
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
						message: errorHandler.getErrorMessage(err)
					});
				} else {
					res.json(proposals);
				}
			});
	};

	// -------------------------------------------------------------------------
	//
	// Get proposal statistics for the given opportunity in the request
	//
	// -------------------------------------------------------------------------
	public getProposalStats = (req, res) => {
		if (!req.opportunity) {
			return res.status(422).send({
				message: 'Valid opportunity not provided'
			});
		}

		if (!this.ensureAdmin(req.opportunity, req.user, res)) {
			return res.json({ message: 'User is not authorized' });
		}

		const op = req.opportunity;
		const ret: any = {
			following: 0
		};

		Promise.resolve()
			.then(() => {
				if (op.watchers) {
					ret.following = op.watchers.length;
				}
				ret.submitted = 0;
				ret.draft = 0;
				return this.countStatus(op._id);
			})
			.then(result => {
				result
					.eachAsync(doc => {
						ret[doc._id.toLowerCase()] = doc.count;
					})
					.then(() => {
						res.json(ret);
					});
			})
			.catch(err => {
				res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			});
	};

	// Create an archive of all proposals for the given opportunity in the request
	public getProposalArchive = (req, res) => {
		const zip = new (require('jszip'))();
		const fs = require('fs');

		// Make sure user has admin access
		if (!this.ensureAdmin(req.opportunity, req.user, res)) {
			return res.json([]);
		}

		// Make a zip archive with the opportunity name
		const opportunityName = req.opportunity.name.replace(/\W/g, '-').replace(/-+/, '-');
		let proponentName;
		let email;
		let files;
		let links;
		let proposalHtml;
		let header;
		let content;

		// Create the zip file;
		zip.folder(opportunityName);

		// Get all submitted and assigned proposals
		Proposal.find({ opportunity: req.opportunity._id, status: { $in: ['Submitted', 'Assigned'] } })
			.sort('status created')
			.populate('user')
			.populate('opportunity', 'opportunityTypeCd name code')
			.exec((err, proposals) => {
				if (err) {
					return res.status(422).send({
						message: errorHandler.getErrorMessage(err)
					});
				} else {
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
						files.forEach(file => {
							zip.folder(opportunityName)
								.folder(proponentName)
								.folder('docs')
								.file(file.name, fs.readFileSync(file.path), { binary: true });
						});
					});

					res.setHeader('Content-Type', 'application/zip');
					res.setHeader('Content-Type', 'application/octet-stream');
					res.setHeader('Content-Description', 'File Transfer');
					res.setHeader('Content-Transfer-Encoding', 'binary');
					res.setHeader('Content-Disposition', 'attachment; inline=false; filename="' + opportunityName + '.zip' + '"');

					zip.generateNodeStream({ base64: false, compression: 'DEFLATE', streamFiles: true }).pipe(res);
				}
			});
	};

	// Create an archive of a single proposal for the given opportunity and belong to the given user
	public getMyProposalArchive = (req, res) => {
		const zip = new (require('jszip'))();
		const fs = require('fs');

		// Create a zip archive from the opportunity name
		const opportunityName = req.opportunity.name.replace(/\W/g, '-').replace(/-+/, '-');

		zip.folder(opportunityName);

		Proposal.findOne({ user: req.user._id, opportunity: req.opportunity._id })
			.populate('createdBy', 'displayName')
			.populate('updatedBy', 'displayName')
			.populate('opportunity')
			.populate('phases.inception.team')
			.populate('phases.proto.team')
			.populate('phases.implementation.team')
			.populate('user')
			.exec((err, proposal) => {
				if (err) {
					return res.status(422).send({
						message: errorHandler.getErrorMessage(err)
					});
				} else {
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
					phases += '$' + proposal.phases.aggregate.cost.toFixed(2);
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
					//
					// add the directory, content and documents for this proposal
					//
					zip.folder(opportunityName).folder(proponentName);
					zip.folder(opportunityName)
						.folder(proponentName)
						.file('proposal-summary.html', content);
					files.forEach(file => {
						zip.folder(opportunityName)
							.folder(proponentName)
							.folder('docs')
							.file(file.name, fs.readFileSync(file.path), { binary: true });
					});

					res.setHeader('Content-Type', 'application/zip');
					res.setHeader('Content-Type', 'application/octet-stream');
					res.setHeader('Content-Description', 'File Transfer');
					res.setHeader('Content-Transfer-Encoding', 'binary');
					res.setHeader('Content-Disposition', 'attachment; inline=false; filename="' + opportunityName + '.zip' + '"');

					zip.generateNodeStream({ base64: false, compression: 'DEFLATE', streamFiles: true }).pipe(res);
				}
			});
	};

	// ---------------  //
	// Private methods //
	// ---------------  //

	private countStatus = (id): Promise<any> => {
		return new Promise(resolve => {
			const cursor = Proposal.aggregate([
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

			resolve(cursor);
		});
	};

	// Initiate the opportunity approval workflow by sending the initial
	// pre-approval email and configuring the opportunity as required
	private sendApprovalMessages = (requestingUser, opportunity) => {
		if (opportunity.intermediateApproval.state === 'ready-to-send') {
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
	private send2FAviaSMS = approvalInfo => {
		const nexmo = new Nexmo({
			apiKey: process.env.NEXMO_API_KEY,
			apiSecret: process.env.NEXMO_API_SECRET
		});

		const from = process.env.NEXMO_FROM_NUMBER;
		const to = approvalInfo.mobileNumber;
		const msg = approvalInfo.twoFACode;

		nexmo.message.sendSms(from, to, msg);
	};

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

	private setOpportunityMember = (opportunity, user) => {
		user.addRoles([this.memberRole(opportunity)]);
	};

	private setOpportunityAdmin = (opportunity, user) => {
		user.addRoles([this.memberRole(opportunity), this.adminRole(opportunity)]);
	};

	private unsetOpportunityMember = (opportunity, user) => {
		user.removeRoles([this.memberRole(opportunity)]);
	};

	private unsetOpportunityRequest = (opportunity, user) => {
		user.removeRoles([this.requestRole(opportunity)]);
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

	private searchTerm = (req, opts?) => {
		opts = opts || {};
		const me = helpers.myStuff(req.user && req.user.roles ? req.user.roles : null);
		if (!me.isAdmin) {
			opts.$or = [{ isPublished: true }, { code: { $in: me.opportunities.admin } }];
		}
		return opts;
	};

	private incrementViews = id => {
		Opportunity.update({ _id: id }, { $inc: { views: 1 } }).exec();
	};

	// Set all the info we need for notification merging
	private setNotificationData = opportunity => {
		return {
			name: opportunity.name,
			short: opportunity.short,
			description: opportunity.description,
			earn_format_mnoney: helpers.formatMoney(opportunity.opportunityTypeCd === 'sprint-with-us' ? opportunity.phases.aggregate.target : opportunity.earn, 2),
			earn: helpers.formatMoney(opportunity.opportunityTypeCd === 'sprint-with-us' ? opportunity.phases.aggregate.target : opportunity.earn, 2),
			dateDeadline: helpers.formatDate(new Date(opportunity.deadline)),
			timeDeadline: helpers.formatTime(new Date(opportunity.deadline)),
			dateAssignment: helpers.formatDate(new Date(opportunity.assignment)),
			dateStart: helpers.formatDate(new Date(opportunity.start)),
			datePublished: helpers.formatDate(new Date(opportunity.lastPublished)),
			deadline_format_date: helpers.formatDate(new Date(opportunity.deadline)),
			deadline_format_time: helpers.formatTime(new Date(opportunity.deadline)),
			updatenotification: 'not-update-' + opportunity.code,
			code: opportunity.code,
			opptype: opportunity.opportunityTypeCd === 'sprint-with-us' ? 'swu' : 'cwu',
			skills: opportunity.skills.join(', ')
		};
	};

	private setMessageData = opportunity => {
		opportunity.path = '/opportunities/' + (opportunity.opportunityTypeCd === 'sprint-with-us' ? 'swu' : 'cwu') + '/' + opportunity.code;
		opportunity.earn_format_mnoney = helpers.formatMoney(opportunity.opportunityTypeCd === 'sprint-with-us' ? opportunity.phases.aggregate.target : opportunity.earn, 2);
		opportunity.earn = opportunity.opportunityTypeCd === 'sprint-with-us' ? opportunity.phases.aggregate.target : opportunity.earn;
		opportunity.dateDeadline = helpers.formatDate(new Date(opportunity.deadline));
		opportunity.timeDeadline = helpers.formatTime(new Date(opportunity.deadline));
		opportunity.dateAssignment = helpers.formatDate(new Date(opportunity.assignment));
		opportunity.dateStart = helpers.formatDate(new Date(opportunity.start));
		opportunity.datePublished = helpers.formatDate(new Date(opportunity.lastPublished));
		opportunity.deadline_format_date = helpers.formatDate(new Date(opportunity.deadline));
		opportunity.deadline_format_time = helpers.formatTime(new Date(opportunity.deadline));

		opportunity.contract.estimatedValue_formatted = helpers.formatMoney(opportunity.contract.estimatedValue);
		opportunity.contract.stobExpenditures_formatted = helpers.formatMoney(opportunity.contract.stobExpenditures);
		opportunity.contract.stobBudget_formatted = helpers.formatMoney(opportunity.contract.stobBudget);
		opportunity.contract.contractType_formatted = opportunity.contract.contractType.charAt(0).toUpperCase() + opportunity.contract.contractType.slice(1);
		opportunity.contract.legallyRequired_formatted = opportunity.contract.legallyRequired ? 'Yes' : 'No';
		opportunity.intermediateApproval.actioned_formatted = helpers.formatDate(new Date(opportunity.intermediateApproval.actioned));

		return opportunity;
	};

	// Publish or unpublish
	private pub = (req, res, isToBePublished) => {
		const opportunity = req.opportunity;
		// if no change or we dont have permission to do this just return as a no-op
		if (req.opportunity.isPublished === isToBePublished || !this.ensureAdmin(req.opportunity, req.user, res)) {
			return res.json(this.opportunitiesUtilities.decorate(req.opportunity, req.user ? req.user.roles : []));
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
				const data = this.setNotificationData(opportunity);
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
				github
					.createOrUpdateIssue({
						title: opportunity.name,
						body: this.getOppBody(opportunity),
						repo: opportunity.github,
						number: opportunity.issueNumber
					})
					.then(result => {
						opportunity.issueUrl = result.html_url;
						opportunity.issueNumber = result.number;
						opportunity.save();
						res.json(this.opportunitiesUtilities.decorate(opportunity, req.user ? req.user.roles : []));
					})
					.catch(() => {
						res.status(422).send({
							message: 'Opportunity saved, but there was an error creating the github issue. Please check your repo url and try again.'
						});
					});
			})
			.catch(err => {
				return res.status(422).send({
					message: errorHandler.getErrorMessage(err)
				});
			});
	};

	// Get a list of all users who are listening to the add opp event
	private getSubscribedUsers = () => {
		return new Promise((resolve, reject) => {
			User.find({ notifyOpportunities: true }, '_id email firstName lastName displayName').exec((err, users) => {
				if (err) {
					reject(err);
				} else {
					resolve(users);
				}
			});
		});
	};

	private updateSave = opportunity => {
		return new Promise((resolve, reject) => {
			opportunity.save((err, updatedOpportunity) => {
				if (err) {
					reject(err);
				} else {
					resolve(updatedOpportunity);
				}
			});
		});
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
		imp.target = helpers.numericOrZero(imp.target);
		inp.target = helpers.numericOrZero(inp.target);
		prp.target = helpers.numericOrZero(prp.target);
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
		let dt = opp.deadline;
		const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const deadline = dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
		dt = opp.assignment;
		const assignment = dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
		dt = opp.start;
		const start = dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
		let earn = helpers.formatMoney(opp.earn, 2);
		const locs = {
			offsite: 'In-person work NOT required',
			onsite: 'In-person work required',
			mixed: 'Some in-person work required'
		};
		let opptype = 'cwu';
		if (opp.opportunityTypeCd === 'sprint-with-us') {
			opptype = 'swu';
			earn = helpers.formatMoney(opp.phases.aggregate.target, 2);
		}
		let ret = '';

		ret +=
			'<p>This issue has been auto-generated to facilitate questions about \
			<a href="https://bcdevexchange.org/opportunities/' +
			opptype +
			'/' +
			opp.code +
			'">a paid opportunity</a> that has just been posted on the \
			<a href="https://bcdevexchange.org">BCDevExchange</a>.</p>';
		ret +=
			'<p>To learn more or apply, <a href="https://bcdevexchange.org/opportunities/' +
			opptype +
			'/' +
			opp.code +
			'">visit the opportunity page</a>. The opportunity closes on <b>' +
			deadline +
			'</b>.</p>';
		return ret;
	};
}
