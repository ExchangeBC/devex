import { IApplicationConfiguration } from './ApplicationConfiguration';

declare global {
	interface Window {
		env: string;
		ApplicationConfiguration: IApplicationConfiguration;
		sessionTimeoutWarning: number;
		sessionTimeout: number;
		allowCapabilityEditing: boolean;
		enableSave: any;
		recaptchaSiteId: string;
	}
}
