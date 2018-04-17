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
				'What is your favourite project your team has delivered? Why?',
				'What steps does your team take to understand the business and prioritize what should be delivered?',
				'What tools and practices does your team find most effective to collaborate and deliver a new digital product?',
				'How do you evaluate the working relationships on the team and resolve conflicts?',
				'Why is your company interested in this project?'
			]
		};
	})


	;
}());

