(function () {
	'use strict';
	var citylist = [
		'Victoria', 'Vancouver', '100 Mile House', 'Abbotsford', 'Armstrong', 'Barriere', 'Burnaby', 'Campbell River', 'Castlegar', 'Central Saanich', 'Chetwynd', 'Chilliwack', 'Clearwater', 'Coldstream', 'Colwood', 'Comox', 'Coquitlam', 'Courtenay', 'Cranbrook', 'Creston', 'Dawson Creek', 'Delta', 'Duncan', 'Elkford', 'Enderby', 'Esquimalt', 'Fernie', 'Fort St. James', 'Fort St. John', 'Grand Forks', 'Greenwood', 'Highlands', 'Hope', 'Houston', 'Hudson\'s Hope', 'Invermere', 'Kamloops', 'Kelowna', 'Kent', 'Kimberley', 'Kitimat', 'Ladysmith', 'Lake Country', 'Langford', 'Langley', 'Langley', 'Lantzville', 'Lillooet', 'Logan Lake', 'Mackenzie', 'Maple Ridge', 'Merritt', 'Metchosin', 'Mission', 'Nanaimo', 'Nelson', 'New Hazelton', 'New Westminster', 'North Cowichan', 'North Saanich', 'North Vancouver', 'North Vancouver', 'Northern Rockies', 'Oak Bay', 'Parksville', 'Peachland', 'Penticton', 'Pitt Meadows', 'Port Alberni', 'Port Coquitlam', 'Port Edward', 'Port Hardy', 'Port Moody', 'Powell River', 'Prince George', 'Prince Rupert', 'Qualicum Beach', 'Quesnel', 'Revelstoke', 'Richmond', 'Rossland', 'Saanich', 'Salmon Arm', 'Sechelt', 'Sicamous', 'Sidney', 'Smithers', 'Sooke', 'Spallumcheen', 'Sparwood', 'Squamish', 'Stewart', 'Summerland', 'Surrey', 'Taylor', 'Terrace', 'Tofino', 'Trail', 'Tumbler Ridge', 'Ucluelet', 'Vanderhoof', 'Vernon', 'View Royal', 'Wells', 'West Kelowna', 'West Vancouver', 'White Rock', 'Williams Lake'
	];


	angular.module('core')

	.factory ('dataService', function () {
		return {
			cities: citylist,
			questions : [
				'What performance metrics does your team measure?',
				'How do the developers and User Experience people on your team interact?',
				'Describe the level of detail your team generally needs in order to start work on a task or feature.',
				'As a team, how do you discuss user stories?',
				'At what point in the development cycle does your team start to talk about testing?'
			]
		};
	});
}());
