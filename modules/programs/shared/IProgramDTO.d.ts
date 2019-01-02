import { IUser } from "../../users/shared/IUserDTO";

export interface IProgram {
	code: string;
	title: string;
	short: string;
	description: string;
	owner: string;
	website: string;
	logo: string;
	tags: string[];
	isPublished: boolean;
	created: Date;
	createdBy: IUser;
	updated: Date;
	updatedBy: IUser;
}