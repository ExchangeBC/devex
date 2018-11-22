import { Document } from 'mongoose';

export interface ITeamQuestionResponseDocument extends Document {
	question: string;
	response: string;
	rank: number;
	rejected: boolean;
	score: number;
}
