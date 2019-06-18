import { IOpportunityModel } from "../../opportunities/server/models/OpportunityModel";
import { IProposalModel } from "../../proposals/server/models/ProposalModel";
import { IOpportunity } from "../../opportunities/shared/IOpportunityDTO";
import { IProposal } from "../../proposals/shared/IProposalDTO";
import { IProgramModel } from "../../programs/server/models/ProgramModel";
import { IOrgModel } from "../../orgs/server/models/OrgModel";
import { ICapabilityModel } from "../../capabilities/server/models/CapabilityModel";
import { ICapabilitySkill } from "../../capabilities/shared/ICapabilitySkillDTO";
import { ICapabilitySkillModel } from "../../capabilities/server/models/CapabilitySkillModel";
import { IMessageModel } from "../../messages/server/models/MessageModel";
import { IMessageTemplateModel } from "../../messages/server/models/MessageTemplateModel";
import { IUserModel } from "../../users/server/models/UserModel";
import { IProjectModel } from "../../projects/server/models/ProjectModel";

declare global {
    namespace Express {
        export interface Request {
            opportunity?: IOpportunityModel;
            proposal?: IProposalModel;
            program?: IProgramModel;
            project?: IProjectModel;
            org?: IOrgModel;
            capability?: ICapabilityModel;
            capabilitySkill?: ICapabilitySkillModel;
            message?: IMessageModel;
            template?: IMessageTemplateModel;
            profile?: IUserModel;
            model?: IUserModel;
        }
    }
}

declare module '@uirouter/angularjs/lib/interface' {
    export interface Ng1StateDeclaration {
        ncyBreadcrumb?: {
            label: string;
            parent?: string;
        };
    }
}