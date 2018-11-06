'use strict';

const path = require('path');

module.exports = {
	src: path.resolve(__dirname, 'modules'),
	build: path.resolve(__dirname, 'public/dist'),
	node_modules: path.resolve(__dirname, 'node_modules')
};
