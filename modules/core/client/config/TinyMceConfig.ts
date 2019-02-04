'use strict';

import angular from 'angular';
import { Settings } from 'tinymce';
import 'tinymce';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/textcolor';
import 'tinymce/plugins/wordcount';
import 'tinymce/themes/modern/theme';
import 'tinymce/tinymce';

require.context('file-loader?name=[path][name].[ext]&context=node_modules/tinymce!tinymce/skins', true, /.*/);

const tinyMceConfiguration: Settings = {
	elementpath: false,
	height: 100,
	menubar: '',
	plugins: 'textcolor lists advlist link wordcount',
	resize: true,
	statusbar: true,
	toolbar: 'undo redo | styleselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | forecolor backcolor',
	width: '100%'
};

angular.module('core').constant('TinyMceConfiguration', tinyMceConfiguration);
