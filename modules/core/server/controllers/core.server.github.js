'use strict';

var path   = require('path');
var config = require(path.resolve('./config/config'));
var fetch  = require('node-fetch');

var githubAPI   = 'https://api.github.com';
var githubRepos = githubAPI+'/repos/';
var accessToken = config.github.accessToken;
console.log ('access token = ', accessToken);
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
	return url;
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
		// console.log ('create an issue', opts);
		opts.token = opts.token ? opts.token : accessToken;
		opts.repo = getrepo (opts.repo);
		return new Promise (function (resolve, reject) {
			var url = githubRepos+opts.repo+'/issues?access_token='+opts.token
			// console.log ('fetching ', url);
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
				// console.log (json);
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
		// console.log ('edit an issue', opts);
		opts.token = opts.token ? opts.token : accessToken;
		opts.repo = getrepo (opts.repo);
		return new Promise (function (resolve, reject) {
			var url = githubRepos+opts.repo+'/issues/'+opts.number+'?access_token='+opts.token
			// console.log ('fetching ', url);
			return fetch (url, {
				method  : 'patch',
				headers : headers,
				body    : JSON.stringify ({
					body   : opts.body
				})
			})
			.then (function (res) {
				return res.json();
			})
			.then (function (json) {
				// console.log (json);
				if (!json.number) reject (json);
				else resolve (json);
			})
			.catch (function (result) {
				reject (result);
			});
		});
	},
	createOrUpdateIssue: function (opts) {
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
		// console.log ('lock an issue', opts);
		opts.token = opts.token ? opts.token : accessToken;
		opts.repo = getrepo (opts.repo);
		return new Promise (function (resolve, reject) {
			var url = githubRepos+opts.repo+'/issues/'+opts.number+'/lock?access_token='+opts.token
			// console.log ('fetching ', url);
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
	}
};

module.exports = funcs;

// var lIssue = function (owner, repo, title, body, token) {
// 	// 248864713
// 	var url = 'https://api.github.com/repos/'+owner+'/'+repo+'/issues/3/lock?access_token='+token
// 	console.log ('fetching ', url);
// 	return fetch (url, {
// 		method: 'put',
// 		body: '',
// 		headers: {
// 			'Content-Type': 'application/json',
// 			'Content-Length': '0',
// 			'Accept': 'application/vnd.github.v3.full+json'
// 		}
// 	})
// 	.then(function(res) {
// 		return res.json();
// 	})
// 	.then (function (json) {
// 		console.log (json);
// 	});
// }
// var cIssue = function (owner, repo, title, body, token) {
// 	var url = 'https://api.github.com/repos/'+owner+'/'+repo+'/issues?access_token='+token
// 	console.log ('fetching ', url);
// 	return fetch (url, {
// 		method: 'post',
// 		body: JSON.stringify ({
// 			title  : title,
// 			body   : body,
// 			labels : ['Opportunity']
// 		}),
// 		headers: {
// 			'Content-Type': 'application/json',
// 			'Accept': 'application/vnd.github.v3.full+json'
// 		}
// 	})
// 	.then(function(res) {
// 		return res.json();
// 	})
// 	.then (function (json) {
// 		console.log (json);
// 	});
// }
// var uIssue = function (owner, repo, title, body, token) {
// 	// 248864713
// 	var url = 'https://api.github.com/repos/'+owner+'/'+repo+'/issues/3?access_token='+token
// 	console.log ('fetching ', url);
// 	return fetch (url, {
// 		method: 'patch',
// 		body: JSON.stringify ({
// 			title  : title,
// 			body   : 'different text',
// 			labels : ['Opportunity']
// 		}),
// 		headers: {
// 			'Content-Type': 'application/json',
// 			'Accept': 'application/vnd.github.v3.full+json'
// 		}
// 	})
// 	.then(function(res) {
// 		return res.json();
// 	})
// 	.then (function (json) {
// 		console.log (json);
// 	});
// }
