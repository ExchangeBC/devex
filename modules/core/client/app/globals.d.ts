import { IApplicationConfiguration } from './ApplicationConfiguration';

declare global {
	interface Window {
		env: string;
		ApplicationConfiguration: IApplicationConfiguration;
	}
}
