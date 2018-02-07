(function () {
	'use strict';

	angular.module('core')
	.constant('_', window._)
	.constant ('TINYMCE_OPTIONS', {
		resize      : true,
		width       : '100%',  // I *think* its a number and not '400' string
		height      : 100,
		menubar     : '',
		elementpath : false,
		plugins     : 'textcolor lists advlist link',
		toolbar     : 'undo redo | styleselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | forecolor backcolor'
	})
	;
}());
