'use strict';

import fetch from 'node-fetch';
import config from '../../../../config/ApplicationConfig';

interface GitHubOptions {
	token?: string;
	repo?: string;
	number?: string;
	title?: string;
	body?: string;
	comment?: string;
}

class CoreGithubController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: CoreGithubController;

	private githubAPI = 'https://api.github.com';
	private githubRepos = this.githubAPI + '/repos/';
	private accessToken = config.github.personalAccessToken;
	private headers = {
		'Content-Type': 'application/json',
		Accept: 'application/vnd.github.v3.full+json'
	};

	private constructor() {}

	// Create a GitHub issue from the passed in data.
	// opts : {
	// 	title : string
	// 	body : string
	// 	token : personal access token or oauth token, only required for non-gov sites
	//  repo: in the form owner/repo, e.g.: 'BCDevExchange/devex'
	// }
	// The body can be in html
	// The result of this that we care about is the issue number, so that gets
	// Returned if all is well
	public async createIssue(opts: GitHubOptions): Promise<any> {
		opts.token = opts.token ? opts.token : this.accessToken;
		opts.repo = this.getrepo(opts.repo);

		const url = this.githubRepos + opts.repo + '/issues?access_token=' + opts.token;
		const response = await fetch(url, {
			method: 'post',
			headers: this.headers,
			body: JSON.stringify({
				title: opts.title,
				body: opts.body,
				labels: ['Opportunity']
			})
		});

		const jsonResponse = await response.json();
		if (!jsonResponse.number) {
			throw new Error('Unable to create Github issue');
		}

		return jsonResponse;
	}

	// Edit an issue - this is just for body only, nothing else
	// pass in token and repo and also the issue number to make this work
	// opts : {
	// 	number : issue number
	// 	body : string
	// 	token : personal access token or oauth token, only required for non-gov sites
	//  repo: in the form owner/repo, e.g.: 'BCDevExchange/devex'
	// }
	public async editIssue(opts: GitHubOptions): Promise<any> {
		opts.token = opts.token ? opts.token : this.accessToken;
		opts.repo = this.getrepo(opts.repo);
		const url = this.githubRepos + opts.repo + '/issues/' + opts.number + '?access_token=' + opts.token;
		const response = await fetch(url, {
			method: 'patch',
			headers: this.headers,
			body: JSON.stringify({
				title: opts.title,
				body: opts.body
			})
		});

		const jsonResponse = await response.json();
		if (!jsonResponse.number) {
			throw new Error('Unable to edit Github issue');
		}

		return jsonResponse;
	}

	public createOrUpdateIssue(opts: GitHubOptions): Promise<any> {
		if (opts.number) {
			return this.editIssue(opts);
		} else {
			return this.createIssue(opts);
		}
	}

	// Lock an issue to prevent comments from non-contributors
	public async lockIssue(opts: GitHubOptions): Promise<boolean> {
		return await this.setIssueLock(opts, true);
	}

	public async unlockIssue(opts: GitHubOptions): Promise<boolean> {
		return await this.setIssueLock(opts, false);
	}

	// Add a comment to a GitHub issue
	public async addCommentToIssue(opts: GitHubOptions): Promise<boolean> {
		opts.token = opts.token ? opts.token : this.accessToken;
		opts.repo = this.getrepo(opts.repo);

		const url = this.githubRepos + opts.repo + '/issues/' + opts.number + '/comments?access_token=' + opts.token;
		const payload = {
			method: 'post',
			body: JSON.stringify({
				body: opts.comment
			}),
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/vnd.github.v3.full+json'
			}
		};
		await fetch(url, payload);
		return true;
	}

	private async setIssueLock(opts: GitHubOptions, lock: boolean): Promise<boolean> {
		opts.token = opts.token ? opts.token : this.accessToken;
		opts.repo = this.getrepo(opts.repo);
		const url = this.githubRepos + opts.repo + '/issues/' + opts.number + '/lock?access_token=' + opts.token;
		const method = lock ? 'put' : 'delete';
		await fetch(url, {
			method,
			body: '',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': '0',
				Accept: 'application/vnd.github.v3.full+json'
			}
		});
		return true;
	}

	private getrepo(url: string): string {
		const start = url.substr(0, 3);
		if (start === 'htt' || start === 'www' || start === 'git') {
			const b = url.split('.com/');
			const a = b[1].split('/');
			return a[0] + '/' + a[1];
		}
		return url.replace(/^\s+|\s+$/g, '');
	}
}

export default CoreGithubController.getInstance();
