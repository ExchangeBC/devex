import { Document } from 'mongoose';
import IPhaseDocument from './IPhaseDocument';

export default interface IPhasesDocument extends Document {
	aggregate: IPhaseDocument;
	implementation: IPhaseDocument;
	inception: IPhaseDocument;
	proto: IPhaseDocument;
}
