(function () {
	'use strict';
	var citylist = [
		'Victoria', 'Vancouver', '100 Mile House', 'Abbotsford', 'Armstrong', 'Barriere', 'Burnaby', 'Campbell River', 'Castlegar', 'Central Saanich', 'Chetwynd', 'Chilliwack', 'Clearwater', 'Coldstream', 'Colwood', 'Comox', 'Coquitlam', 'Courtenay', 'Cranbrook', 'Creston', 'Dawson Creek', 'Delta', 'Duncan', 'Elkford', 'Enderby', 'Esquimalt', 'Fernie', 'Fort St. James', 'Fort St. John', 'Grand Forks', 'Greenwood', 'Highlands', 'Hope', 'Houston', 'Hudson\'s Hope', 'Invermere', 'Kamloops', 'Kelowna', 'Kent', 'Kimberley', 'Kitimat', 'Ladysmith', 'Lake Country', 'Langford', 'Langley', 'Langley', 'Lantzville', 'Lillooet', 'Logan Lake', 'Mackenzie', 'Maple Ridge', 'Merritt', 'Metchosin', 'Mission', 'Nanaimo', 'Nelson', 'New Hazelton', 'New Westminster', 'North Cowichan', 'North Saanich', 'North Vancouver', 'North Vancouver', 'Northern Rockies', 'Oak Bay', 'Parksville', 'Peachland', 'Penticton', 'Pitt Meadows', 'Port Alberni', 'Port Coquitlam', 'Port Edward', 'Port Hardy', 'Port Moody', 'Powell River', 'Prince George', 'Prince Rupert', 'Qualicum Beach', 'Quesnel', 'Revelstoke', 'Richmond', 'Rossland', 'Saanich', 'Salmon Arm', 'Sechelt', 'Sicamous', 'Sidney', 'Smithers', 'Sooke', 'Spallumcheen', 'Sparwood', 'Squamish', 'Stewart', 'Summerland', 'Surrey', 'Taylor', 'Terrace', 'Tofino', 'Trail', 'Tumbler Ridge', 'Ucluelet', 'Vanderhoof', 'Vernon', 'View Royal', 'Wells', 'West Kelowna', 'West Vancouver', 'White Rock', 'Williams Lake'
	];
	var capabilities = [
		{id:'agile-coach',  text:'Agile Coach'},
		{id:'backend-web-developer',  text:'Backend Web Developer'},
		{id:'business-analyst',  text:'Business Analyst'},
		{id:'delivery-manager',  text:'Delivery Manager'},
		{id:'devops-engineer',  text:'DevOps Engineer'},
		{id:'digital-performance-analyst',  text:'Digital Performance Analyst'},
		{id:'frontend-web-developer',  text:'Frontend Web Developer'},
		{id:'interaction-designer-user-researcher-usability-tester',  text:'Interaction Designer / User Researcher / Usability Tester'},
		{id:'product-manager',  text:'Product Manager'},
		{id:'security-engineer', text:'Security Engineer'},
		{id:'technical-architect', text:'Technical Architect'},
		{id:'visual-designer', text:'Visual Designer'},
		{id:'writer-content-designer-content-strategist', text:'Writer / Content Designer / Content Strategist'}
	];

	angular.module('core')

	.factory ('dataService', function () {
		return {
			cities: citylist,
			capabilities : capabilities
		};
	})


	;
}());

