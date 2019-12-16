'use strict';

import chalk from 'chalk';
import { Request, Response } from 'express';
import fs from 'fs';
import handlebars from 'handlebars';
import htmlToText from 'html-to-text';
import _ from 'lodash';
import { Types } from 'mongoose';
import nodemailer from 'nodemailer';
import config from '../../../../config/ApplicationConfig';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import { IUserModel, UserModel } from '../../../users/server/models/UserModel';
import { MessageArchiveModel } from '../models/MessageArchiveModel';
import { IMessageModel, MessageModel } from '../models/MessageModel';
import { IMessageTemplateModel, MessageTemplateModel } from '../models/MessageTemplateModel';

interface HostInfo {
	url: string;
	host: string;
	port: number;
	protocol: string;
}

class MessagesServerController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: MessagesServerController;

	private smtpTransport = nodemailer.createTransport(config.mailer.options);

	private constructor() {
		this.seedMessageTemplates = this.seedMessageTemplates.bind(this);
		this.sendMessages = this.sendMessages.bind(this);
		this.mycount = this.mycount.bind(this);
		this.list = this.list.bind(this);
		this.actioned = this.actioned.bind(this);
	}

	public async clearMessageTemplates(): Promise<void> {
		await MessageTemplateModel.deleteMany({});
	}

	public async seedMessageTemplates(): Promise<void> {
		await Promise.all([
			MessageTemplateModel.create({
				messageCd: 'opportunity-update',
				messageLevel: 'info',
				description: 'notify the user that there were updates to an opportunity they are watching',
				isSubscriptionType: true,
				messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/opportunity-update-msg.html'),
				messageShortTemplate: '',
				messageTitleTemplate: "An opportunity you're watching has been updated",
				emailBodyTemplate: fs.readFileSync('config/email-templates/opportunities/opportunity-update-email.html'),
				emailSubjectTemplate: 'Opportunity {{ opportunity.name }} has been updated',
				modelsRequired: ['opportunity'],
				daysToArchive: 1,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'Dismiss',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'opportunity-add-cwu',
				messageLevel: 'info',
				description: 'notify the user that there is a new opportunity',
				isSubscriptionType: true,
				messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/opportunity-add-cwu-msg.html'),
				messageShortTemplate: '',
				messageTitleTemplate: 'A new opportunity has just been posted!',
				emailBodyTemplate: fs.readFileSync('config/email-templates/opportunities/opportunity-add-cwu-email.html'),
				emailSubjectTemplate: 'A new opportunity has just been posted!',
				modelsRequired: ['opportunity'],
				daysToArchive: 1,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'Dismiss',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'opportunity-add-swu',
				messageLevel: 'info',
				description: 'notify the user that there is a new opportunity',
				isSubscriptionType: true,
				messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/opportunity-add-swu-msg.html'),
				messageShortTemplate: '',
				messageTitleTemplate: 'A new opportunity has just been posted!',
				emailBodyTemplate: fs.readFileSync('config/email-templates/opportunities/opportunity-add-swu-email.html'),
				emailSubjectTemplate: 'A new opportunity has just been posted!',
				modelsRequired: ['opportunity'],
				daysToArchive: 1,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'Dismiss',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'opportunity-assign-cwu',
				messageLevel: 'info',
				description: 'notify the user that they have been assigned the opportunity',
				isSubscriptionType: true,
				messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/opportunity-assign-cwu-msg.html'),
				messageShortTemplate: '<a href="{{ opportunity.path }}">{{ opportunity.name }}</a>',
				messageTitleTemplate: 'Your Proposal has been selected!',
				emailBodyTemplate: fs.readFileSync('config/email-templates/opportunities/opportunity-assign-cwu-email.html'),
				emailSubjectTemplate: 'Your Proposal has been selected!',
				modelsRequired: ['opportunity'],
				daysToArchive: 1,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'OK',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'opportunity-assign-swu',
				messageLevel: 'info',
				description: 'notify the user that they have been assigned the opportunity',
				isSubscriptionType: true,
				messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/opportunity-assign-swu-msg.html'),
				messageShortTemplate: '<a href="{{ opportunity.path }}">{{ opportunity.name }}</a>',
				messageTitleTemplate: 'Your Proposal has been selected!',
				emailBodyTemplate: fs.readFileSync('config/email-templates/opportunities/opportunity-assign-swu-email.html'),
				emailSubjectTemplate: 'Your Proposal has been selected!',
				modelsRequired: ['opportunity'],
				daysToArchive: 1,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'OK',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'gov-member-request',
				messageLevel: 'request',
				description: 'Notify the devex administrator account of a new government membership request',
				isSubscriptionType: false,
				messageBodyTemplate: fs.readFileSync('config/message-templates/users/gov-member-request-msg.html'),
				messageShortTemplate: '',
				messageTitleTemplate: '',
				emailBodyTemplate: fs.readFileSync('config/email-templates/users/gov-member-request-email.html'),
				emailSubjectTemplate: "BC Developer's Exchange - Government Access Request",
				modelsRequired: ['user'],
				daysToArchive: 0,
				linkTemplate: '/gov/add/{{ requestingUser._id }}',
				actions: [
					{
						actionCd: 'approve',
						linkTitleTemplate: 'Approve'
					},
					{
						actionCd: 'decline',
						linkTitleTemplate: 'Decline',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'gov-request-declined',
				messageLevel: 'info',
				description: 'Notify a user requesting government access that their request has been declined',
				isSubscriptionType: false,
				messageBodyTemplate: fs.readFileSync('config/message-templates/users/gov-request-declined-msg.html'),
				messageShortTemplate: '',
				messageTitleTemplate: '',
				emailBodyTemplate: fs.readFileSync('config/email-templates/users/gov-request-declined-email.html'),
				emailSubjectTemplate: "BC Developer's Exchange - Government Access Request",
				modelsRequired: ['user'],
				daysToArchive: 0,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'OK',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'gov-request-approved',
				messageLevel: 'info',
				description: 'Notify a user requesting government access that their request has been approved',
				isSubscriptionType: false,
				messageBodyTemplate: fs.readFileSync('config/message-templates/users/gov-request-approved-msg.html'),
				messageShortTemplate: '',
				messageTitleTemplate: '',
				emailBodyTemplate: fs.readFileSync('config/email-templates/users/gov-request-approved-email.html'),
				emailSubjectTemplate: "BC Developer's Exchange - Government Access Request",
				modelsRequired: ['user'],
				daysToArchive: 0,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'OK',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'opportunity-pre-approval-request',
				messageLevel: 'request',
				description: 'Send a pre-approval for publishing an opportunity',
				isSubscriptionType: false,
				messageBodyTemplate: '',
				messageShortTemplate: '',
				messageTitleTemplate: '',
				emailBodyTemplate: fs.readFileSync('config/message-templates/opportunities/pre-approval-request.html'),
				emailSubjectTemplate: "BC Developer's Exchange - Opportunity Pre-Approval",
				modelsRequired: ['opportunity'],
				daysToArchive: 0,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'OK',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'opportunity-approval-request',
				messageLevel: 'request',
				description: 'Send an approval for publishing an opportunity',
				isSubscriptionType: false,
				messageBodyTemplate: '',
				messageShortTemplate: '',
				messageTitleTemplate: '',
				emailBodyTemplate: fs.readFileSync('config/message-templates/opportunities/approval-request.html'),
				emailSubjectTemplate: "BC Developer's Exchange - Opportunity Approval",
				modelsRequired: ['opportunity'],
				daysToArchive: 0,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'OK',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'opportunity-approved-notification',
				messageLevel: 'info',
				description: 'Send a notification that an approval request has been approved',
				isSubscriptionType: false,
				messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/request-approved.html'),
				messageShortTemplate: '',
				messageTitleTemplate: '',
				emailBodyTemplate: fs.readFileSync('config/message-templates/opportunities/request-approved.html'),
				emailSubjectTemplate: "BC Developer's Exchange - Opportunity Approved",
				modelsRequired: ['opportunity'],
				daysToArchive: 0,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'OK',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'opportunity-denied-notification',
				messageLevel: 'info',
				description: 'Send a notification that an approval request has been denied',
				isSubscriptionType: false,
				messageBodyTemplate: fs.readFileSync('config/message-templates/opportunities/request-denied.html'),
				messageShortTemplate: '',
				messageTitleTemplate: '',
				emailBodyTemplate: fs.readFileSync('config/message-templates/opportunities/request-denied.html'),
				emailSubjectTemplate: "BC Developer's Exchange - Opportunity Denied",
				modelsRequired: ['opportunity'],
				daysToArchive: 0,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'OK',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'opportunity-approval-2FA',
				messageLevel: 'info',
				description: 'Send a 2FA token for approval by email',
				isSubscriptionType: false,
				messageBodyTemplate: '',
				messageShortTemplate: '',
				messageTitleTemplate: '',
				emailBodyTemplate: fs.readFileSync('config/message-templates/opportunities/approval-2FA.html'),
				emailSubjectTemplate: "BC Developer's Exchange - 2FA Approval Token",
				modelsRequired: ['approvalInfo'],
				daysToArchive: 0,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'OK',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'company-join-request',
				messageLevel: 'info',
				description: 'Notification sent to company contact stating that a member has requested to join the company',
				isSubscriptionType: false,
				messageBodyTemplate: fs.readFileSync('config/message-templates/orgs/company-join-request-msg.html'),
				messageShortTemplate: '',
				messageTitleTemplate: '',
				emailBodyTemplate: fs.readFileSync('config/email-templates/orgs/company-join-request-email.html'),
				emailSubjectTemplate: "BC Developer's Exchange - Request to join {{ org.name }}",
				modelsRequired: [],
				daysToArchive: 0,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'Dismiss',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'company-join-request-accepted',
				messageLevel: 'info',
				description: 'Notification sent to user stating that a company has accepted their request to join',
				isSubscriptionType: false,
				messageBodyTemplate: fs.readFileSync('config/message-templates/orgs/company-join-request-accepted-msg.html'),
				messageShortTemplate: '',
				messageTitleTemplate: '',
				emailBodyTemplate: fs.readFileSync('config/email-templates/orgs/company-join-request-accepted-email.html'),
				emailSubjectTemplate: "BC Developer's Exchange - Request to join {{ org.name }} accepted!",
				modelsRequired: [],
				daysToArchive: 0,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'Dismiss',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'company-join-request-declined',
				messageLevel: 'info',
				description: 'Notification sent to user stating that a company has declined their request to join',
				isSubscriptionType: false,
				messageBodyTemplate: fs.readFileSync('config/message-templates/orgs/company-join-request-declined-msg.html'),
				messageShortTemplate: '',
				messageTitleTemplate: '',
				emailBodyTemplate: fs.readFileSync('config/email-templates/orgs/company-join-request-declined-email.html'),
				emailSubjectTemplate: "BC Developer's Exchange - Request to join {{ org.name }} declined.",
				modelsRequired: [],
				daysToArchive: 0,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'Dismiss',
						isDefault: true
					}
				]
			}),

			MessageTemplateModel.create({
				messageCd: 'proposal-submitted',
				messageLevel: 'info',
				description: 'Notification sent to a vendor letting them know that they have submitted a proposal',
				isSubscriptionType: false,
				messageBodyTemplate: fs.readFileSync('config/message-templates/proposals/proposal-submitted-msg.html'),
				messageShortTemplate: '',
				messageTitleTemplate: '',
				emailBodyTemplate: fs.readFileSync('config/email-templates/proposals/proposal-submitted-email.html'),
				emailSubjectTemplate: "BC Developer's Exchange - Your proposal has been submitted",
				modelsRequired: [],
				daysToArchive: 0,
				linkTemplate: '/defaultonly',
				actions: [
					{
						actionCd: 'ok',
						linkTitleTemplate: 'Dismiss',
						isDefault: true
					}
				]
			})
		]);
	}

	// Sends messages to an array of users
	// First pre-compile templates, then loop and send
	public async sendMessages(messageCd: string, users: any[], data: any): Promise<void> {
		if (users.length === 0) {
			return;
		}

		// ensure the domain is set properly
		data.domain = config.app.domain ? config.app.domain : 'http://localhost:3000';

		// get the template and then send
		const template = await MessageTemplateModel.findOne({ messageCd }).exec();

		// compile all the templates
		template.messageBody = handlebars.compile(template.messageBodyTemplate);
		template.messageShort = handlebars.compile(template.messageShortTemplate);
		template.messageTitle = handlebars.compile(template.messageTitleTemplate);
		template.emailBody = handlebars.compile(this.appendNotificationLink(template.emailBodyTemplate));
		template.emailSubject = handlebars.compile(template.emailSubjectTemplate);
		template.link = handlebars.compile(template.linkTemplate);
		template.actions.forEach(action => {
			action.linkResolver = handlebars.compile(action.linkTitleTemplate);
		});

		// if this is a list of userids
		if (Types.ObjectId.isValid(users[0])) {
			users.forEach(async (userId: string) => {
				const user = await this.getUser(userId);
				await this.sendMessage(template, user, data);
			});
		} else {
			users.forEach(async user => {
				await this.sendMessage(template, user, data);
			});
		}
	}

	// Return a list of this users' messages
	public async list(req: Request, res: Response): Promise<void> {
		if (!req.user) {
			res.status(400).send({ message: 'No user context supplied' });
		}

		try {
			const messages = await this.query({ user: (req.user as IUserModel)._id });
			res.status(200).json(messages);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	}

	// Count the number of messages for the current user
	public async mycount(req: Request, res: Response): Promise<void> {
		if (!req.user) {
			res.status(400).send({ message: 'No user context supplied' });
		}

		try {
			const countResult = await this.count({ user: (req.user as IUserModel)._id });
			res.status(200).json({ count: countResult });
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	}

	// This gets called when the user actions the message
	public async actioned(req: Request, res: Response): Promise<void> {
		if (!req.user) {
			res.status(400).send({ message: 'No user context supplied' });
		}
		if ((req.user as IUserModel)._id.toString() !== req.message.user.toString()) {
			res.status(403).send({ message: 'Not owner of message' });
		}

		// get the local domain, port, host, protocol info
		// this gets over a potential risk by disallowing any calls to outside APIs through this
		// mechanism
		const options = this.getHostInfoFromDomain('/api/message/handler/action/' + req.body.action + '/user/' + (req.user as IUserModel)._id + req.message.link);

		let data: any;
		try {
			data = await CoreServerHelpers.getJSON(options);
			req.message.actionTaken = req.params.action;
			req.message.dateActioned = new Date();
			this.archiveMessage(req.message);
			res.status(200).json(data);
		} catch (error) {
			res.status(299).send(data);
		}
	}

	public async send(req: Request, res: Response): Promise<void> {
		if ((req.user as IUserModel).roles.indexOf('admin') === -1) {
			res.status(403).send({ message: 'Only admin can send via REST' });
		}
		req.body.users = req.body.users || [];
		req.body.data = req.body.data || {};

		try {
			const messages = this.sendMessages(req.params.messagecd, req.body.users, req.body.data);
			res.status(200).json(messages);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	}

	// Perform a query on the messages table
	private async query(queryObject: any): Promise<IMessageModel[]> {
		return await MessageModel.find(queryObject)
			.select('-link')
			.sort({ dateSent: -1, dateExpired: 1 })
			.populate('user', 'displayName email')
			.exec();
	}

	private async count(queryObject: any): Promise<number> {
		return await MessageModel.countDocuments(queryObject);
	}

	private appendNotificationLink(messageBody: string): string {
		const link = '<a href="{{domain}}/settings/messages">Sign in to the BCDevExchange</a>';
		const m = 'To respond to this message, ' + link + ' and navigate to your messages.';
		return messageBody + '<p><br/>' + m + '<br/></p>';
	}

	// Archive a message
	private async archiveMessage(message: IMessageModel): Promise<void> {
		message.dateArchived = new Date();
		const archive = new MessageArchiveModel(message.toObject());
		try {
			await archive.save();
		} catch (error) {
			throw new Error(error.message);
		}
	}

	// Save a message
	private async saveMessage(message: IMessageModel): Promise<IMessageModel> {
		return await message.save();
	}

	// Send a message through email
	private sendMail(message: IMessageModel): Promise<IMessageModel> {
		const opts = {
			to: message.userEmail,
			from: config.mailer.from,
			subject: message.emailSubject,
			html: message.emailBody,
			text: htmlToText.fromString(message.emailBody, { wordwrap: 130 })
		};

		const result = {
			dateSent: new Date(),
			isOk: true,
			error: {}
		};

		return new Promise(resolve => {
			this.smtpTransport.sendMail(opts, err => {
				if (err) {
					// tslint:disable:no-console
					console.error(chalk.red('+++ Error sending email: '));
					console.error(err);
					result.error = err;
					result.isOk = false;
				} else {
					message.emailSent = true;
				}

				message.emailRetries++;
				message.emails.push(result);
				resolve(message);
			});
		});
	}

	// Get a user from an id
	private async getUser(userId: string): Promise<IUserModel> {
		return await UserModel.findById(userId, '_id firstName lastName displayName email username').exec();
	}

	// Gets the domain and uses the correct protocol based on configuration
	private getDomain(): string {
		let domain = '';
		if (config.secure && config.secure.ssl) {
			domain += 'https://';
		} else {
			domain += 'http://';
		}

		domain += 'localhost:3000';
		return domain;
	}

	private getHostInfoFromDomain(path: string): HostInfo {
		const domain = this.getDomain();
		const part1 = domain.split('://');
		const part2 = part1[1].split(':');
		const protocol = part1[0];
		const host = part2[0];
		let port = protocol === 'https' ? 443 : 80;
		port = part2[1] ? Number(part2[1]) : port;

		const hostInfo = {
			protocol,
			host,
			port,
			url: domain + path
		};
		return hostInfo;
	}

	// Prepare a single message
	private prepareMessage(template: IMessageTemplateModel, data: any): IMessageModel {
		// deal with archive and current dates
		const datePosted = new Date();
		const date2Archive = new Date();
		date2Archive.setDate(date2Archive.getDate() + template.daysToArchive);

		// put them in the data as well
		data.datePosted = CoreServerHelpers.formatDate(datePosted);
		data.date2Archive = CoreServerHelpers.formatDate(date2Archive);

		// make the new message by applying the templates with data
		const messageUser = !data.user || !data.user._id ? null : data.user;
		const message = new MessageModel({
			messageCd: template.messageCd,
			user: messageUser,
			userEmail: data.user.email,
			datePosted: Date.now()
		});

		// include the id in the data so the links can be built
		data.messageid = message._id;

		// run the templates
		message.messageBody = template.messageBody(data);
		message.messageShort = template.messageShort(data);
		message.messageTitle = template.messageTitle(data);
		message.emailBody = template.emailBody(data);
		message.emailSubject = template.emailSubject(data);
		message.link = template.link(data);

		// now run the action tempaltes
		template.actions.forEach(action => {
			message.actions.push({
				actionCd: action.actionCd,
				linkTitle: action.linkResolver(data),
				isDefault: action.isDefault
			});
		});
		return message;
	}

	// Send a specific template to a specific user
	private async sendMessage(template: IMessageTemplateModel, user: IUserModel, data: any): Promise<void> {
		data.user = user;

		if (data.opportunity) {
			// eslint-disable-next-line new-cap
			data.formattedEarnings = Intl.NumberFormat('en', {
				style: 'currency',
				currency: 'USD'
			}).format(data.opportunity.earn);
			// eslint-disable-next-line new-cap
			data.formattedBudget = Intl.NumberFormat('en', {
				style: 'currency',
				currency: 'USD'
			}).format(data.opportunity.budget);
		}

		const message = this.prepareMessage(template, data);
		const mailedMessage = await this.sendMail(message);
		await this.saveMessage(mailedMessage);
	}
}

export default MessagesServerController.getInstance();
