'use strict';

var path   = require('path');
var config = require(path.resolve('./config/config'));
var fetch  = require('node-fetch');

var githubAPI   = 'https://api.github.com';
var githubRepos = githubAPI+'/repos/';
var accessToken = config.github.personalAccessToken;
var headers = {
	'Content-Type' : 'application/json',
	'Accept'       : 'application/vnd.github.v3.full+json'
};

var getrepo = function (url) {
	var start = url.substr (0, 3);
	if (start === 'htt' || start === 'www' || start === 'git') {
		var b = url.split ('.com/');
		var a = b[1].split ('/');
		return a[0] + '/' + a[1];
	}
	return url.replace(/^\s+|\s+$/g, '');
}

var funcs = {
	// -------------------------------------------------------------------------
	//
	// create an issue from the passed in data.
	// opts : {
	// 	title : string
	// 	body : string
	// 	token : personal access token or oauth token, only required for non-gov sites
	//  repo: in the form owner/repo, e.g.: 'BCDevExchange/devex'
	// }
	// the body can be in html
	// the result of this that we care about is the issue number, so that gets
	// returned if all is well
	//
	// -------------------------------------------------------------------------
	createIssue: function (opts) {
		opts.token = opts.token ? opts.token : accessToken;
		opts.repo = getrepo (opts.repo);
		return new Promise (function (resolve, reject) {
			var url = githubRepos+opts.repo+'/issues?access_token='+opts.token
			return fetch (url, {
				method  : 'post',
				headers : headers,
				body    : JSON.stringify ({
					title  : opts.title,
					body   : opts.body,
					labels : ['Opportunity']
				})
			})
			.then (function (res) {
				return res.json();
			})
			.then (function (json) {
				if (!json.number) reject (json);
				else resolve (json);
			})
			.catch (function (result) {
				reject (result);
			});
		});
	},
	// -------------------------------------------------------------------------
	//
	// Edit an issue - this is just for body only, nothing else
	// pass in token and repo and also the issue number to make this work
	// opts : {
	// 	number : issue number
	// 	body : string
	// 	token : personal access token or oauth token, only required for non-gov sites
	//  repo: in the form owner/repo, e.g.: 'BCDevExchange/devex'
	// }
	//
	// -------------------------------------------------------------------------
	editIssue: function (opts) {
		opts.token = opts.token ? opts.token : accessToken;
		opts.repo = getrepo (opts.repo);
		return new Promise (function (resolve, reject) {
			var url = githubRepos+opts.repo+'/issues/'+opts.number+'?access_token='+opts.token
			return fetch (url, {
				method  : 'patch',
				headers : headers,
				body    : JSON.stringify ({
					title  : opts.title,
					body   : opts.body
				})
			})
			.then (function (res) {
				return res.json();
			})
			.then (function (json) {
				if (!json.number) reject (json);
				else resolve (json);
			})
			.catch (function (result) {
				reject (result);
			});
		});
	},
	createOrUpdateIssue: function (opts) {
		console.log ('creating issue', opts);
		if (opts.number) {
			return funcs.editIssue (opts);
		} else {
			return funcs.createIssue (opts);
		}
	},
	// -------------------------------------------------------------------------
	//
	// lock an issue to prevent comments from non-contributors
	//
	// -------------------------------------------------------------------------
	lockIssue: function (opts) {
		opts.token = opts.token ? opts.token : accessToken;
		opts.repo = getrepo (opts.repo);
		return new Promise (function (resolve) {
			var url = githubRepos+opts.repo+'/issues/'+opts.number+'/lock?access_token='+opts.token
			return fetch (url, {
				method  : 'put',
				body    : '',
				headers : {
					'Content-Type': 'application/json',
					'Content-Length': '0',
					'Accept': 'application/vnd.github.v3.full+json'
				}
			})
			.then (function () {
				resolve (true);
			});
		});
	},
	unlockIssue: function (opts) {
		opts.token = opts.token ? opts.token : accessToken;
		opts.repo = getrepo (opts.repo);
		return new Promise (function (resolve) {
			var url = githubRepos+opts.repo+'/issues/'+opts.number+'/lock?access_token='+opts.token;
			return fetch (url, {
				method  : 'delete',
				body    : '',
				headers : {
					'Content-Type': 'application/json',
					'Content-Length': '0',
					'Accept': 'application/vnd.github.v3.full+json'
				}
			})
			.then (function () {
				resolve (true);
			});
		});
	},
	// -------------------------------------------------------------------------
	//
	// add a comment to an issue
	//
	// -------------------------------------------------------------------------
	addCommentToIssue: function (opts) {
		opts.token = opts.token ? opts.token : accessToken;
		opts.repo = getrepo (opts.repo);
		return new Promise (function (resolve) {
			var url = githubRepos+opts.repo+'/issues/'+opts.number+'/comments?access_token='+opts.token;
			var payload = {
				method  : 'post',
				body    : JSON.stringify ({
					body   : opts.comment
				}),
				headers : {
					'Content-Type': 'application/json',
					'Accept': 'application/vnd.github.v3.full+json'
				}
			};
			return fetch (url, payload)
			.then (function () {
				resolve (true);
			});
		});
	}
};

module.exports = funcs;

