'use strict';

import fetch from 'node-fetch';
import * as config from '../../../../config/config';

export class CoreGithubController {
	private githubAPI = 'https://api.github.com';
	private githubRepos = this.githubAPI + '/repos/';
	private accessToken = config.github.personalAccessToken;
	private headers = {
		'Content-Type': 'application/json',
		Accept: 'application/vnd.github.v3.full+json'
	};

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
	public createIssue(opts): Promise<any> {
		opts.token = opts.token ? opts.token : this.accessToken;
		opts.repo = this.getrepo(opts.repo);
		return new Promise((resolve, reject) => {
			const url = this.githubRepos + opts.repo + '/issues?access_token=' + opts.token;
			return fetch(url, {
				method: 'post',
				headers: this.headers,
				body: JSON.stringify({
					title: opts.title,
					body: opts.body,
					labels: ['Opportunity']
				})
			})
				.then(res => {
					return res.json();
				})
				.then(json => {
					if (!json.number) {
						reject(json);
					} else {
						resolve(json);
					}
				})
				.catch(result => {
					reject(result);
				});
		});
	}

	// Edit an issue - this is just for body only, nothing else
	// pass in token and repo and also the issue number to make this work
	// opts : {
	// 	number : issue number
	// 	body : string
	// 	token : personal access token or oauth token, only required for non-gov sites
	//  repo: in the form owner/repo, e.g.: 'BCDevExchange/devex'
	// }
	public editIssue(opts): Promise<any> {
		opts.token = opts.token ? opts.token : this.accessToken;
		opts.repo = this.getrepo(opts.repo);
		return new Promise((resolve, reject) => {
			const url = this.githubRepos + opts.repo + '/issues/' + opts.number + '?access_token=' + opts.token;
			return fetch(url, {
				method: 'patch',
				headers: this.headers,
				body: JSON.stringify({
					title: opts.title,
					body: opts.body
				})
			})
				.then(res => {
					return res.json();
				})
				.then(json => {
					if (!json.number) {
						reject(json);
					} else {
						resolve(json);
					}
				})
				.catch(result => {
					reject(result);
				});
		});
	}

	public createOrUpdateIssue(opts): Promise<any> {
		if (opts.number) {
			return this.editIssue(opts);
		} else {
			return this.createIssue(opts);
		}
	}

	// Lock an issue to prevent comments from non-contributors
	public lockIssue(opts) {
		opts.token = opts.token ? opts.token : this.accessToken;
		opts.repo = this.getrepo(opts.repo);
		return new Promise(resolve => {
			const url = this.githubRepos + opts.repo + '/issues/' + opts.number + '/lock?access_token=' + opts.token;
			return fetch(url, {
				method: 'put',
				body: '',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': '0',
					Accept: 'application/vnd.github.v3.full+json'
				}
			}).then(() => {
				resolve(true);
			});
		});
	}

	public unlockIssue(opts) {
		opts.token = opts.token ? opts.token : this.accessToken;
		opts.repo = this.getrepo(opts.repo);
		return new Promise(resolve => {
			const url = this.githubRepos + opts.repo + '/issues/' + opts.number + '/lock?access_token=' + opts.token;
			return fetch(url, {
				method: 'delete',
				body: '',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': '0',
					Accept: 'application/vnd.github.v3.full+json'
				}
			}).then(() => {
				resolve(true);
			});
		});
	}

	// Add a comment to a GitHub issue
	public addCommentToIssue(opts) {
		opts.token = opts.token ? opts.token : this.accessToken;
		opts.repo = this.getrepo(opts.repo);
		return new Promise(resolve => {
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
			return fetch(url, payload).then(() => {
				resolve(true);
			});
		});
	}

	private getrepo = url => {
		const start = url.substr(0, 3);
		if (start === 'htt' || start === 'www' || start === 'git') {
			const b = url.split('.com/');
			const a = b[1].split('/');
			return a[0] + '/' + a[1];
		}
		return url.replace(/^\s+|\s+$/g, '');
	};
}
