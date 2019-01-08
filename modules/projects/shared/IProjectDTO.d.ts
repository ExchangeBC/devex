import { IUser } from "../../users/shared/IUserDTO";

export interface IProject {
	code: string;
	name: string;
	short: string;
	description: string;
	github: string;
	isPublished: boolean;
	wasPublished: boolean;
	created: Date;
	createdBy: IUser;
	updated: Date;
	updatedBy: IUser;
	program: any;
	user: IUser;
	activity: number;
	tags: [string];
}