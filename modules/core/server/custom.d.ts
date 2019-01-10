import { IOpportunityModel } from "../../opportunities/server/models/OpportunityModel";
import { IProposalModel } from "../../proposals/server/models/ProposalModel";
import { IOpportunity } from "../../opportunities/shared/IOpportunityDTO";
import { IProposal } from "../../proposals/shared/IProposalDTO";
import { IProgramModel } from "../../programs/server/models/ProgramModel";
import { IOrgModel } from "../../orgs/server/models/OrgModel";
import { ICapabilityModel } from "../../capabilities/server/models/CapabilityModel";
import { ICapabilitySkill } from "../../capabilities/shared/ICapabilitySkillDTO";
import { ICapabilitySkillModel } from "../../capabilities/server/models/CapabilitySkillModel";

declare global {
    namespace Express {
        export interface Request {
            opportunity?: IOpportunityModel;
            proposal?: IProposalModel;
            program?: IProgramModel;
            org?: IOrgModel;
            capability?: ICapabilityModel;
            capabilitySkill?: ICapabilitySkillModel;
        }
    }
} 