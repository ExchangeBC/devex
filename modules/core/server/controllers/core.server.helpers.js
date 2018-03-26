'use strict';
var _ = require('lodash');
var path = require('path');
var config = require(path.resolve('./config/config'));
var errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

exports.generateCode = function (s) {
	return s.toLowerCase().replace(/\W/g,'-').replace(/-+/,'-');
};

exports.applyAudit = function (model, user) {
	model.updated   = Date.now ();
	model.updatedBy = (user && user._id) ? user._id : null;
	if (!model.created) {
		model.created   = model.updated;
		model.createdBy = model.updatedBy;
	}
};

exports.isNumeric = function (n) {
	return !isNaN (parseFloat (n)) && isFinite (n);
}
exports.numericOrZero = function (n) {
	return exports.isNumeric (n) ? parseFloat (n) : 0;
}

exports.myStuff = function (roles) {
	var a;
	var l;
	var r = {
		isAdmin       : false,
		isUser        : false,
		programs      : {
			member        : [],
			admin         : [],
			request       : []
		},
		projects      : {
			member        : [],
			admin         : [],
			request       : []
		},
		opportunities : {
			member        : [],
			admin         : [],
			request       : []
		}
	};
	if (roles) {
		_.each (roles, function (role) {
			if (role === 'admin') r.isAdmin = true;
			else if (role === 'user') r.isUser = true;
			else {
				a = role.split ('-');
				l = a.pop ();
				if (a[0] === 'prj') {
					if (l === 'request') r.projects.request.push (a.join ('-'));
					else if (l === 'admin') r.projects.admin.push (a.join ('-'));
					else r.projects.member.push (role);
				} else if (a[0] === 'opp') {
					if (l === 'request') r.opportunities.request.push (a.join ('-'));
					else if (l === 'admin') r.opportunities.admin.push (a.join ('-'));
					else r.opportunities.member.push (role);
				} else {
					if (l === 'request') r.programs.request.push (a.join ('-'));
					else if (l === 'admin') r.programs.admin.push (a.join ('-'));
					else r.programs.member.push (role);
				}
			}
		});
	}
	return r;
}

exports.fileUploadFunctions = function (doc, Model, field, req, res, upload, existingImageUrl) {
	var fs = require('fs');
	return {
		uploadImage : function () {
			return new Promise(function (resolve, reject) {
				upload(req, res, function (uploadError) {
					if (uploadError) {
						reject(errorHandler.getErrorMessage(uploadError));
					} else {
						resolve();
					}
				});
			});
		},
		updateDocument : function () {
			return new Promise(function (resolve, reject) {
				doc[field] = config.uploads.fileUpload.display + req.file.filename;
				doc.save(function (err, result) {
					if (err) {
						reject(err);
					} else {
						resolve(result);
					}
				});
			});
		},
		deleteOldImage : function () {
			return new Promise(function (resolve, reject) {
				if (existingImageUrl !== Model.schema.path(field).defaultValue) {
					fs.unlink(existingImageUrl, function () {
						resolve ();
					});
				} else {
					resolve();
				}
			});
		}

	}
}
exports.formatMoney = function(n, ic, id, iit){
var c = isNaN(ic = Math.abs(ic)) ? 2 : ic,
    d = id === undefined ? '.' : id,
    t = iit === undefined ? ',' : iit,
    s = n < 0 ? '-' : '',
    i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c)));
    var j = i.length;
    j = (j) > 3 ? j % 3 : 0;
   return '$' +s + (j ? i.substr(0, j) + t : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : '');
 };

exports.formatDate = function (d) {
var monthNames = [
'January', 'February', 'March',
'April', 'May', 'June', 'July',
'August', 'September', 'October',
'November', 'December'
];
var day = d.getDate();
var monthIndex = d.getMonth();
var year = d.getFullYear();
return monthNames[monthIndex] + ' ' + day + ', '+ year;
}

exports.formatTime = function (d) {
  return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
}

exports.modelFindUniqueCode = function (_this, prefix, title, suffix, callback) {
	prefix = prefix || '';
	var possible = prefix + '-' + (title.toLowerCase ().replace (/\W/g,'-').replace (/-+/,'-')) + (suffix || '');
	_this.findOne ({
		code: possible
	}, function (err, result) {
		if (!err) {
			if (!result) {
				callback (possible);
			} else {
				return _this.findUniqueCode (title, (suffix || 0) + 1, callback);
			}
		} else {
			callback (null);
		}
	});
};

exports.soundex = function(s) {
	var a = s.toLowerCase().split('');
	var f = a.shift();
	var r = '';
	var codes = {
		a: '',
		e: '',
		i: '',
		o: '',
		u: '',
		b: 1,
		f: 1,
		p: 1,
		v: 1,
		c: 2,
		g: 2,
		j: 2,
		k: 2,
		q: 2,
		s: 2,
		x: 2,
		z: 2,
		d: 3,
		t: 3,
		l: 4,
		m: 5,
		n: 5,
		r: 6
	};
	r = a.map(function(v, i, a) {
		return codes[v]
	}).filter(function(v, i, a) {
		return ((i === 0) ? v !== codes[f] : v !== a[i - 1]);
	}).join('');
	r += f;
	return (r + '000').slice(0, 4).toUpperCase();
};




