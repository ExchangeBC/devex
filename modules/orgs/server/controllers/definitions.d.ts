import { IOrgDocument } from '../interfaces/IOrgDocument';
import { IUserDocument } from '../../../users/server/interfaces/IUserDocument';

declare global {
	namespace Express {
		interface Request {
			user?: IUserDocument;
		   	org?: IOrgDocument;
		   	profile?: IUserDocument;
		  	model?: IUserDocument;
	   }
   }
}

