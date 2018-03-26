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
				'When you are old, what do you think children will ask you to tell stories about?',
				'If your job gave you a surprise three day paid break to rest and recuperate, what would you do with those three days?',
				'What’s the best / worst practical joke that you’ve played on someone or that was played on you?',
				'If you were moving to another country, but could only pack one carry-on sized bag, what would you pack?',
				'What’s something that everyone, absolutely everyone, in the entire world can agree on?'
			]
		};
	})


	;
}());

