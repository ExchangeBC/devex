import { IOpportunityModel } from "../../opportunities/server/models/OpportunityModel";
import { IProposalModel } from "../../proposals/server/models/ProposalModel";
import { IOpportunity } from "../../opportunities/shared/IOpportunityDTO";
import { IProposal } from "../../proposals/shared/IProposalDTO";
import { IProgramModel } from "../../programs/server/models/ProgramModel";
import { IOrgModel } from "../../orgs/server/models/OrgModel";

declare global {
    namespace Express {
        export interface Request {
            opportunity?: IOpportunityModel;
            proposal?: IProposalModel;
            program?: IProgramModel;
            org?: IOrgModel;
        }
    }
} 