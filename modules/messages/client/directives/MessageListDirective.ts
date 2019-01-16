'use strict';

import angular, { IController, IRootScopeService, ISCEService, IScope } from 'angular';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IMessage, IMessageAction } from '../../shared/IMessageDTO';

class MessageListDirectiveController implements IController {
	public static $inject = ['$sce', '$rootScope', '$scope', 'MessagesService', 'AuthenticationService'];
	public messages: IMessage[];
	public resultMsg = '';

	constructor(private $sce: ISCEService, private $rootScope: IRootScopeService, private $scope: IScope, private MessagesService: any, private AuthenticationService: IAuthenticationService) {
		this.refreshMessages();
	}

	public async takeAction(messageId: string, action: IMessageAction): Promise<void> {
		const response = await this.MessagesService.actioned({ messageId }, { action: action.actionCd }).$promise;
		this.resultMsg = response.message;
		const message = this.messages.find(message => message._id === messageId);
		message.actionTaken = action.actionCd;
		this.$rootScope.$broadcast('updateMessageCount', 'done');
		setTimeout(() => {
			const removeIndex = this.messages.indexOf(message);
			this.messages.splice(removeIndex, 1);
			this.$scope.$apply();
		}, 2000);
	}

	private async refreshMessages(): Promise<void> {
		this.messages = await this.MessagesService.my();
	}
}

angular.module('messages').directive('messageList', () => {
	return {
		restrict: 'E',
		controllerAs: 'vm',
		scope: {
			context: '@'
		},
		templateUrl: '/modules/messages/client/views/message-list.html',
		controller: MessageListDirectiveController
	};
});
