export default interface IMessageEmailsDocument extends Document {
	dateSent: Date;
	isOk: boolean;
	error: any;
}
