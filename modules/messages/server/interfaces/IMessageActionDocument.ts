import { TemplateDelegate } from 'handlebars';

export default interface IMessageActionDocument {
	actionCd: string;
	linkTitleTemplate?: string;
	isDefault: boolean;
	linkTitle: string;
	linkResolver?: TemplateDelegate<any>;
}
