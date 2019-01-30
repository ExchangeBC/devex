/* tslint:disable:no-console */
'use strict';

import chalk from 'chalk';
import _ from 'lodash';
import CoreServerErrors from '../../modules/core/server/controllers/CoreServerErrors';
import MessagesServerController from '../../modules/messages/server/controllers/MessagesServerController';
import { IUserModel, UserModel } from '../../modules/users/server/models/UserModel';
import config from '../ApplicationConfig';

class Seed {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: Seed;

	private constructor() {
		this.start = this.start.bind(this);
	}

	public async start(): Promise<void> {
		await this.seedMessageTemplates();
		await this.seedLocalUserAccounts();
	}

	// Seeds the database with any preconfigured or default accounts
	private async seedLocalUserAccounts(): Promise<void> {
		const seedOptions = config.seedDB.options;
		const adminAccount = new UserModel(seedOptions.seedAdmin);
		const localAccounts = [];
		localAccounts.push(adminAccount);
		localAccounts.push(new UserModel(seedOptions.seedUser));
		localAccounts.push(new UserModel(seedOptions.seedDev));
		localAccounts.push(new UserModel(seedOptions.seedDev2));
		localAccounts.push(new UserModel(seedOptions.seedGov));

		const isDevexProd = config.devexProd === 'true';

		// If production, only seed admin account and use environment defined password
		// Otherwise, seed all local accounts
		process.stdout.write(chalk.yellow('Database seeding:\tSeeding development accounts...'));
		if (isDevexProd) {
			const password = process.env.ADMINPW;
			if (!password) {
				throw new Error('Attempt to create Administrator account in production with default password: aborting.');
			} else {
				adminAccount.password = password;
				await this.saveUser(adminAccount);
			}
		} else {
			await Promise.all([
				localAccounts.map(async account => {
					account.password = process.env[`DEV_${account.username.toUpperCase()}_PWD`];
					return this.saveUser(account);
				})
			]);
		}
		console.log(chalk.yellow('done'));
	}

	private async saveUser(user: IUserModel): Promise<void> {
		try {
			const existingUsers = await UserModel.find({ username: user.username });
			if (existingUsers.length > 0) {
				existingUsers[0].password = user.password;
				await existingUsers[0].save();
			} else {
				await user.save();
			}
		} catch (error) {
			console.error(error);
			console.error('Error occurred while seeding account: ' + user.displayName);
		}
	}

	private async seedMessageTemplates(): Promise<void> {
		process.stdout.write(chalk.yellow('Database seeding:\tSeeding message templates...'));
		try {
			await MessagesServerController.clearMessageTemplates();
		} catch (error) {
			console.error(chalk.red(CoreServerErrors.getErrorMessage(error)));
			console.error(chalk.red('Error clearing message templates'));
		}

		try {
			await MessagesServerController.seedMessageTemplates();
		} catch (error) {
			console.error(chalk.red(CoreServerErrors.getErrorMessage(error)));
			console.error(chalk.red('Error seeding message templates'));
		}

		console.log(chalk.yellow('done'));
	}
}

export default Seed.getInstance();
