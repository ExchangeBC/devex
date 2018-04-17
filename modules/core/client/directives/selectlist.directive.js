'use strict';

  // Focus the element on page load
  // Unless the user is on a small device, because this could obscure the page with a keyboard

  // Options
  // options.title (label for field)
  // options.name (name setting for the form)
  // options.id (id setting)
  //
  // options.objectSave (bool) = save the complete object or just a key.
  // options.leaveOpen (bool) = don't close the list on selection.
  // options.horizontal (bool) = the element is snown in a horizontal form so leave out the form-grouping

angular.module('core')
.constant('UILISTSETTINGS', [
		{'pos':0, 'class':'btn-default'}, // unselected
		{'pos':1, 'class':'btn-info'}, // selected
		{'pos':2, 'class':'btn-warning'}
	])
.filter('startFrom', function() {
    return function(input, start) {
        start = +start; // parse to int
        return input.slice(start);
    }
})
.directive('selectList', ['UILISTSETTINGS', '$q',  '$window', '$document', function(UILISTSETTINGS, $q, $window, $document) {
	return {
		require: 'ngModel',
		replace: true,
		transclude: true,
		scope: {
			values: '=',
			ngModel: '=',
			setValue: '=?', // set possible second value of object
			index: '=?',
			parentForm: '=form',
			refresh: '=?',
			all: '@?', // allow select all
			type: '@?', // arrayOfStrings, arrayOfObjects, objectOfStrings, objectOfObjects
			options: '='
		},
		template: function(elem, attrs) {
			var _ = window._;
			//
			var options = JSON.parse(attrs.options);
			var listStyle = 'list-unstyled';
			if ( options.hasOwnProperty('listStyle') ) {
				listStyle = options.listStyle;
			}
			//
			var tmpl = '<div';
			// if the label is included with the configuration, add the form-group class, otherwise the
			// label is external and the form-group class should be too.
			if ( !options.horizontal) {
				tmpl += ' show-errors class="form-group ';
			} else {
				tmpl += ' class="';
			}
			tmpl += 'select-list-control"';
			if ( options.hasOwnProperty('required') ) {
				tmpl += 'ng-class="{\'has-error\': (parentForm.$submitted && parentForm.' + options.name + '.$error)}"';
			}
			tmpl += '>';
			// show the title if set.
			if ( options.hasOwnProperty('title') ) {
				tmpl += '<label class="" for="' + options.name + '">' + options.title;
				if ( options.hasOwnProperty('required') ) {
					tmpl += ' <span class="text-muted" title="This field is required">*</span>';
				}
				tmpl += '</label>';
			}
			if ( options.hasOwnProperty('titleTransclude') && options.titleTransclude ) {
				tmpl += '<label class="" for="' + options.name + '" ng-transclude></label>';
			}
			// create hidden field to base validation on.
			tmpl += '<input type="hidden" id="' + options.id + '" name="' + options.name + '" class="form-control" ng-model="ngModel"';
			tmpl += (options.hasOwnProperty('required') && options.required) ? ' required' : '';
			tmpl += '/>';

			if ( options.hasOwnProperty('filter') && options.filter && options.hasOwnProperty('single') && options.single) {
				tmpl += '<input type="text" class="form-control" ng-model=\'controlFilter' + attrs.name + '\' placeholder="Start typing here" ng-show="!closed">';
			}
			tmpl +=	'<ul class="'+listStyle+'">';
			tmpl += 	'<li ng-repeat="item in filteredItems = (';
			tmpl +=	'items';
			if ( options.hasOwnProperty('filter') && options.filter ) {
				tmpl +=	' | filter:controlFilter' + attrs.name + ':startsWith';
				tmpl += ' | limitTo:10';
			}
			tmpl += ')';
			//
			// type: arrayOfStrings
			if (attrs.type === 'arrayOfStrings') {
				tmpl += ' track by $index" ng-show="!closed || itemStatus[item].pos === 2 || (!primary && itemStatus[item].pos === 1)">'+
						'<button type="button" ng-click="valueSelect(item, $index)" class="btn  btn-full-left" '+
						'ng-class="{';

				_.each (UILISTSETTINGS, function(item, key) {
					tmpl += '\'' + item.class + '\': itemStatus[item].pos === ' + key;
					tmpl += key < (UILISTSETTINGS.length - 1) ? ',' : '';
				});

				tmpl +=	'}">'+
						'<span ng-show="itemStatus[item].pos === 2 && !closed && !single" class="pull-right glyphicon glyphicon-star" style="margin-top: 2px"></span>'+
						'<span ng-if="!single && closed && primary" class="pull-right">{{ ngModel.length || 0 }}</span>'+
						'{{ item ' + (attrs.textFilter ? ('|' + attrs.textFilter) : '') + '}}'+
						'</button>';
			}
			//
			// type: arrayOfObjects
			if (attrs.type === 'arrayOfObjects') {
				tmpl += ' track by $index " ng-show="!closed || itemStatus[item.' + options.objectKeyAttribute + '].pos === 2 || (!primary && itemStatus[item.' + options.objectKeyAttribute + '].pos === 1)">'+
						'<button type="button" ng-click="valueSelect(item, $index)" class="btn  btn-full-left" '+
						'ng-class="{';

				_.each (UILISTSETTINGS, function(item, key) {
					tmpl += '\'' + item.class + '\': itemStatus[item.' + options.objectKeyAttribute + '].pos === ' + key;
					tmpl += key < (UILISTSETTINGS.length - 1) ? ',' : '';
				});

				tmpl += '}">'+
						'<span ng-show="itemStatus[item.' + options.objectKeyAttribute + '].pos === 2 && !closed && !single" '+
						'class="pull-right glyphicon glyphicon-star" style="margin-top: 2px"></span>'+
						'<span ng-if="!single && closed && primary" class="pull-right">{{ ngModel.length || 0 }}</span>'+
						'{{' + options.objectDisplayAttribute + (attrs.textFilter ? ('|' + attrs.textFilter) : '') + '}}'+
						'</button>';
			}
			//
			// if (attrs.source === 'key' || attrs.source === 'array') {
			// 	tmpl += 	'<li ng-repeat="item in items track by $index" ng-show="!closed || expandTo === $index">'+
			// 			'<button type="button" ng-click="toggleSelect(item)" class="btn  btn-full-left" ng-class="{\'btn-default\':itemPos(item) === -1, \'btn-info\':itemPos(item) > 0, \'btn-primary\':itemPos(item) === 0}">'+
			// 			'<span ng-show="itemPos(item) === 0 && !closed && !single" class="pull-right glyphicon glyphicon-star"></span>{{ item }}'+
			// 			'</button>';
			// }
			// if (attrs.source === 'object') {
			// 	tmpl += 	'<li ng-repeat="item in items track by ' + attrs.objectKeyAttribute + '" ng-show="!closed || expandTo === $index">'+
			// 			'<button type="button" ng-click="toggleSelect(item.' + attrs.objectKeyAttribute + ')" class="btn  btn-full-left" ng-class="{\'btn-default\':itemPos(item.' + attrs.objectKeyAttribute + ') === -1, \'btn-info\':itemPos(item.' + attrs.objectKeyAttribute + ') > 0, \'btn-primary\':itemPos(item.' + attrs.objectKeyAttribute + ') === 0}">'+
			// 			'<span ng-show="itemPos(item.' + attrs.objectKeyAttribute + ') === 0 && !closed && !single" class="pull-right glyphicon glyphicon-star"></span>';

			// 	if (attrs.objectDisplayAttribute) {
			// 		tmpl += '{{ item.' + attrs.objectDisplayAttribute + '}}';
			// 	} else {
			// 		tmpl += '{{ item }}';
			// 	}

			// 	tmpl += 	'</button>';
			// }
			tmpl +=	'</li>';
			//
			if ( options.hasOwnProperty('filter') && options.filter ) {
				tmpl += '<li ng-show="!closed && filteredItems.length > 1"><small class="text-muted">Top {{ filteredItems.length }} shown</small></li>';
				tmpl += '<li ng-show="!closed && filteredItems.length === 1"><small class="text-muted">Top choice shown</small></li>';
				tmpl += '<li ng-show="!closed && filteredItems.length === 0"><small class="text-muted">No matches available</small></li>';
			}
			var leaveOpen = true;
			if (options.hasOwnProperty('leaveOpen')) {
				leaveOpen = options.leaveOpen;
			}
			//
			// if the leaveOpen is set or false then allow the close control.
			if (!leaveOpen) {
				tmpl +=	'<li ng-show="!closed && ngModel">'+
						'<a href ng-click="hideChoices($event)" class="small">Hide Choices</a>'+
						'</li>';
			}
			//
			if (attrs.all === 'true') {
				tmpl +=	'<li><a href class="small" ng-click="selectAll()">'+
						'<span ng-show="!allSelected">All</span>'+
						'<span ng-show="allSelected">None</span>'+
						'</a></li>';
			}
			tmpl +=	'</li>';
			tmpl +=	'</ul>';

			if (options.hasOwnProperty('required') && options.required) {
				tmpl += '<div ng-messages="parentForm.$submitted && parentForm.' + options.name + '.$error" role="alert">';
				tmpl += '<p class="help-block error-text" ng-message="required">' + options.required + '</p>';
				tmpl += '</div>';
			}

			// display place holder
			if (options.hasOwnProperty('placeHolder') && options.placeHolder) {
				tmpl += '<div class="form-control-static" ng-show="values.length===0">';
				tmpl += '<p>' + options.placeHolder + '</p>';
				tmpl += '</div>';
			}
			//
			tmpl += '</div>';

			return tmpl;
		},
		restrict: 'E',
		compile: function compile(tElement, tAttrs, transclude) {
	  		return {
				post: function (scope, elem, attrs, ngModelCtrl) {

					var options = JSON.parse(attrs.options);
					var leaveOpen = true;
					if (options.hasOwnProperty('leaveOpen')) {
						leaveOpen = options.leaveOpen;
					}
					options.leaveOpen = leaveOpen;

					scope.internalReset = false;
					scope.currentPage = 1;

					// set primary setting, unset default is true.
					scope.primary = (options.hasOwnProperty('primary')) ? options.primary : false;

					// set single setting, unset default is false.
					scope.single = (options.hasOwnProperty('single')) ? options.single : true;

					// initialize defaults
					scope.firstRunValues = true;
					scope.firstRunModel = true;
					scope.closed = false;
					scope.itemStatus = {};
					scope.items = [];

					scope.$watch('ngModel', function(newValue, oldValue) {
						// if values are provided, load those in to the ui.
						if (
							(!newValue && !!oldValue) ||
							((newValue && newValue.length === 0) && (oldValue && oldValue.length !== 0))
						)
						{
							scope.closed = false;
							scope.itemStatus = {};
							scope.completeItemStatus();
						} else if (newValue && !scope.internalReset) {
							// a selected value has changed.
							scope.processModel (newValue, oldValue);
						}
					}, true);

					scope.$watch('values', function(newValue, oldValue) {
						// if values are provided, load those in to the ui.
						if ( newValue ) {
							// reset the underlying structure then reload
							if (!angular.equals(newValue, oldValue)) {
								scope.internalReset = true;
								scope.resetAllData();
								scope.items = [];
							}
							scope.processValues (newValue);
						}
					}, true);

					scope.$watch('refresh', function(newValue, oldValue) {
						if ( newValue === 1 ) {
							scope.refresh = 0;
							scope.resetAllData();
							scope.items = [];
							scope.processValues (scope.values);
						}
					});
					//
					//
					// when the values and model are loaded, this is run to create the ui tracking hash.
					scope.processValues = function(newValue) {
						angular.forEach(newValue, function(item) {
							if (item) {
								// if the source is an array of strings, use the item
								// as the hash key for the row status.
								var key = item;
								// for objects where one attribute is the key,
								// separate and use that key as the hash key for
								// the row status.
								if (options.objectKeyAttribute) {
									key = item[options.objectKeyAttribute];
								}
								// set the defaults, pos 0 is not selected at all
								// if the item is undefined.
								if (scope.items.indexOf(item) === -1) {
									if (!scope.itemStatus.hasOwnProperty(key)) {
										scope.itemStatus[key] = {pos:0, class:'btn-default'};
									}
								}
							}
						});
						scope.items = angular.copy( newValue );
					};


					scope.resetAllData = function() {
						scope.firstRunValues = true;
						scope.firstRunModel = true;
						scope.closed = false;
						scope.itemStatus = {};
						scope.processValues ();

						// set empty value depends on the type
						scope.ngModel = scope.single ? null : [];
						// reset the internalReset so the watch on the model will fire next time.
						scope.internalReset = false;
					};
					//
					// seed the items with base data choices
					// this will help reduce calls from the template.
					//
					scope.completeItemStatus = function() {
						angular.forEach(scope.items, function(item) {
							if (item) {
								// if the source is an array of strings, use the item
								// as the hash key for the row status.
								var key = item;
								// for objects where one attribute is the key,
								// separate and use that key as the hash key for
								// the row status.
								if (options.objectKeyAttribute) {
									key = item[options.objectKeyAttribute];
								}
								// set the defaults, pos 0 is not selected at all
								// if the item is undefined.
								if (!scope.itemStatus.hasOwnProperty(key)) {
									scope.itemStatus[key] = {pos:0, class:'btn-default'};
								}
							}
						});
					};

					//
					//
					// when the values and model are loaded, this is run to create the ui tracking hash.
					scope.processModel = function(newValue, oldValue) {
						// now we'll do the same for the actual data and set some
						// flags to base UI decisions on: Primary and Classes
						// This gets a bit complex.  Apologies in advance.
						// If the control is set to a single item, a single item is in the data so no repeat is needed.
						// If the control is set to save the object, then use the attribute to find the key in the object saved.
						if (scope.single) {
							if (options.objectSave === true) {
								scope.itemStatus[newValue[options.objectKeyAttribute]] = UILISTSETTINGS[1];
							} else {
								// we didn't save the full object so the thing we saved is the key.
								scope.itemStatus[oldValue] = UILISTSETTINGS[0];
								scope.itemStatus[newValue] = UILISTSETTINGS[1]; // 2 is primary (at the front of the array), 1 is selected.
							}
						} else {
							// set old values to blank
							angular.forEach(oldValue, function(item, idx) {
								scope.itemStatus[item] = UILISTSETTINGS[0];
							});
							// set new values
							angular.forEach(newValue, function(item, idx) {
								// if the source is an array of strings, use the item
								// as the hash key for the row status.
								var key = item;
								// for objects where one attribute is the key,
								// separate and use that key as the hash key for
								// the row status.
								if (attrs.objectKeyAttribute && item.hasOwnProperty(attrs.objectKeyAttribute) ) {
									key = item[attrs.objectKeyAttribute];
								}
								// we'll create a hash with a number to designate in or out or first (idx === 0) in the list.
								// now we'll iterate through the model value provided and check each item into the hash.
								// 2 is primary (at the front of the array), 1 is selected.
								if (idx === 0 && scope.primary) {
									scope.itemStatus[key] = UILISTSETTINGS[2];
								} else {
									scope.itemStatus[key] = UILISTSETTINGS[1];
								}
							});
						}
						// if there are already values set, close the ui to show those.  Otherwise keep it open to see all values.
						if (scope.firstRunModel && ((!scope.single && newValue.length > 1) || (scope.single && newValue !== '')) ) {
							scope.hideChoices();
							scope.firstRunModel = false;
						}
					};
					// handler to select a value from a list.
					// set the settings in the itemStatus hash and modify the model.
					// set the model to dirty so any form validation works.
					scope.valueSelect = function(item, index) {
						// update selected index
						if (attrs.index) scope.index = index;
						// set parent form's status to dirty
						scope.parentForm.$dirty = true;
						// if the contol is closed, just open it.
						if (scope.closed) {
							scope.closed = false;
							return;
						}

						// control is open and there are changes being made.
						// in most cases, we're adding a string that is also
						// the hash key.
						var saveItem = item;
						var saveKey = item;
						// sometimes we want to save the object but refer to it by a single attribute.
						// if the objectKeyAttribute is set, use it for the saveKey
						if (options.objectKeyAttribute) {
							saveKey = item[options.objectKeyAttribute];
							// sometimes we want to save the whole object, if
							// objectSave is not set (meaning don't save the object, only the attribute), put the object key as the saveItem
							if (!options.objectSave) {
								saveItem = item[options.objectKeyAttribute];
							}
						}
						// set second value of object when needed
						if (options.objectValueAttribute) {
							scope.setValue = item[options.objectValueAttribute];
						}

						// take a look at current state of the saveKey and use that
						// to change to the next state.
						// 1 -> 2 (selected to primary)
						// 0 -> 1 (not selected to selected)
						// 2 -> 0 (deselect primary to none)
						switch (scope.itemStatus[saveKey].pos) {
							// not selected, so select it.
							case 0:
								// add the item to the ngModel too.
								if (scope.single) {
									// set the model value and let the catchall get the display below
									scope.ngModel = saveItem;
								} else {
									// add the item to the array and manually set the display
									scope.ngModel.push(saveItem);
								}
								// set the hash to state 1.
								break;

							// selected already, so make it primary or deselect it.
							case 1:
								// deselect the item.
								if (scope.primary) {
									// first remove the old primary by setting it to just selected.
									// remove the current item from its old position.
									_.pull(scope.ngModel, saveItem);
									// add the item to the beginning of the ngModel
									// the new primary is set in the catchall below.
									scope.ngModel.unshift(saveItem);
								} else {
									// not primary so toggle back to unselected
									if (scope.single) {
										scope.ngModel = null;
									} else {
										_.pull(scope.ngModel, saveItem);
									}
									saveKey = null;
								}
								break;
							case 2:
								// primary cycles back to unselected
								// when manually clicked.
								scope.itemStatus[saveKey] = UILISTSETTINGS[0];
								//
								if (scope.single) {
									scope.ngModel = null;
								} else {
									_.pull(scope.ngModel, saveItem);
								}
								break;
						}
						// catchall
						// enforce the primary setting for the first element en mass.
						if (options.single) {
							// since we just need one choice, deselect the rest.
							_.map( scope.itemStatus, function(val, iKey) {
								if (iKey === saveKey) {
									scope.itemStatus[iKey] = UILISTSETTINGS[1];
								} else {
									scope.itemStatus[iKey] = UILISTSETTINGS[0];
								}
							});
						} else {
							_.map( scope.itemStatus, function(val, iKey) {
								if (scope.ngModel.indexOf(iKey) > -1) {
									scope.itemStatus[iKey] = UILISTSETTINGS[1];
								} else {
									scope.itemStatus[iKey] = UILISTSETTINGS[0];
								}
							});

							// if this is an array, get the first item of the model and make it the primary.
							if (scope.primary) {
								scope.itemStatus[scope.ngModel[0]] = UILISTSETTINGS[2];
							}
						}
						// if the model has no value, open the choices.
						if (scope.ngModel === null || scope.ngModel.length === 0) {
							scope.closed = false;
						} else {
							// the model has a value, if shiftkey was held down, automatically close the choices.
							if (scope.single) {
								scope.hideChoices();
							}
						}
						// set the model to dirty so the save controls work where this is applicable.
						ngModelCtrl.$setViewValue(scope.ngModel);
						ngModelCtrl.$render();
						// there's a callback, better call back.
						if (options.eventAfter) {
							scope.$emit(options.eventAfter, item);
						}
					};
					// end arrayOfStringsSelect
					//
					//
					scope.startsWith = function (actual, expected) {
						var lowerStr = (actual + '').toLowerCase();
						return lowerStr.indexOf(expected.toLowerCase()) === 0;
					};
					//
					// if you use the filter on an object
					scope.objectFilter = function (compareValue) {
						return function(item) {
							if (!options.objectDisplayAttribute || !compareValue) {
								return true;
							} else {
								var lowerStr = (item[options.objectDisplayAttribute.replace('item.', '')] + '').toLowerCase();
								return lowerStr.indexOf(compareValue.toLowerCase()) === 0;
							}
						};
					};
					//
					// Close the items
					//
					scope.hideChoices = function($event) {
						if ($event) {
							$event.stopPropagation();
							$event.preventDefault();
						}
						if (!options.leaveOpen) {
							//
							// the choices could have extended down the page and the element is off the page on collapse.
							//
							if ( (( elem[0].offsetTop - $window.pageYOffset) + 100) < 0) {
								$document.scrollToElementAnimated(elem, 100).then( function() {
									scope.closed = true;
								});
							} else {
								scope.closed = true;
							}
						}
					};
				}  // link
			};
		}
	};
}]);
