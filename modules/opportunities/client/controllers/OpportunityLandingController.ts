'use strict';

import angular from 'angular';
import { IStateParamsService } from 'angular-ui-router';
import AuthenticationService from '../../../users/client/services/AuthenticationService';

export default class OpportunityLandingController {
	public static $inject = ['authenticationService', '$stateParams'];

	public programId: string;
	public programTitle: string;
	public projectId: string;
	public projectTitle: string;
	public context: any;
	public userCanAdd: boolean;

	private isUser: boolean;
	private isAdmin: boolean;
	private isGov: boolean;

	// Controller for the view of the opportunity landing page
	constructor(authenticationService: AuthenticationService, $stateParams: IStateParamsService) {
		this.programId = $stateParams.programId;
		this.programTitle = $stateParams.programTitle;
		this.projectId = $stateParams.projectId;
		this.projectTitle = $stateParams.projectTitle;
		this.context = $stateParams.context;
		this.isUser = !!authenticationService.user;
		this.isAdmin = this.isUser && authenticationService.user.roles.indexOf('admin') !== -1;
		this.isGov = this.isUser && authenticationService.user.roles.indexOf('gov') !== -1;
		this.userCanAdd = this.isAdmin || this.isGov;
	}
}

angular.module('opportunities').controller('OpportunityLandingController', OpportunityLandingController);
