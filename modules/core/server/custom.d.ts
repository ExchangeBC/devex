import IOpportunityDocument from "../../opportunities/server/interfaces/IOpportunityDocument";
import IProposalDocument from "../../proposals/server/interfaces/IProposalDocument";
import IProgramDocument from "../../programs/server/interfaces/IProgramDocument";
import IUserDocument from "../../users/server/interfaces/IUserDocument";

declare global {
    namespace Express {
        export interface Request {
            opportunity?: IOpportunityDocument;
            proposal?: IProposalDocument;
            program?: IProgramDocument;
        }
    }
} 