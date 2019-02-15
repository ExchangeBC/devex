package pages.app
import geb.Page

import geb.module.*

import org.openqa.selenium.By


class InitialSWUProposalPage extends Page {
	static at = { title.startsWith("BCDevExchange") }
	//static at = { title == "BCDevExchange - Proposals List" }
	//static url = ${driver.currentUrl()}   <-- It seems it can not be set dynamically
	static content = {
            EvaluationTab{ $('[data-automation-id ~= "tab-swu-proposal-evaluation"]')}
            TermsTab { $('[data-automation-id ~= "tab-swu-proposal-terms"]') }
            SelectTeamTab { $('[data-automation-id ~= "tab-swu-proposal-selectteam"]') }
            PricingTab { $('[data-automation-id ~= "tab-swu-proposal-pricing"]') }
            QuestionsTab { $('[data-automation-id ~= "tab-swu-proposal-questions"]') }
            ReferencesTab{ $('[data-automation-id ~= "tab-swu-proposal-references"]') }
            AddendaTab{ $('[data-automation-id ~= "tab-swu-proposal-addenda"]') }
            ReviewTab{ $('[data-automation-id ~= "tab-swu-proposal-review"]') }

            ButtonDelete { $('[data-automation-id ~= "btnDeleteSWUProposal"]') }
            ButtonReSubmit { $('[data-automation-id ~= "btnResubmitSWUProposal"]') }
            ButtonSaveChanges { $('[data-automation-id ~= "btnSavesSWUChanges"]') }
            ButtonSubmit { $('[data-automation-id ~= "btnSubmitSWUProposal"]') }
            ExportSWUProposal { $('[data-automation-id ~= "lnkExportSWUProposal"]') }    
            ButtonWithdraw { $('[data-automation-id ~= "btnWithdrawSWUProposal"]') }

            ButtonModalYes{$('[data-automation-id~="button-modal-yes"]')}

            UpdateSWUProposal{ $("a",id:'proposaladmin.edit',0) } //Two nested element share the same id, any of them would be fine

            //EVALUATION TAB Elements
            CodeChallengeDownload{ $("a",href:"/terms/codechallenge") }

            //TERMS TAB Elements
            DownLoadTermsConditions {$("a",href:"/terms/swu1")}

            //SELECT TEAM TAB Elements
            InceptionPhaseTeamMember1{ $('[data-automation-id ~= "inceptionPhaseTeamMember"]',0) }
            InceptionPhaseTeamMember2{ $('[data-automation-id ~= "inceptionPhaseTeamMember"]',1) }

            PrototypePhaseTeamMember1{ $('[data-automation-id ~= "prototypePhaseTeamMember"]',0) }
            PrototypePhaseTeamMember2{ $('[data-automation-id ~= "prototypePhaseTeamMember"]',1) }

            ImplementationPhaseTeamMember1{ $('[data-automation-id ~= "implementationPhaseTeamMember"]',0) }
            ImplementationPhaseTeamMember2{ $('[data-automation-id ~= "implementationPhaseTeamMember"]',1) }

            //PRICING TAB Elements
            BudgetInception{$(id:"budget-inception")}
            BudgetPOC{$(id:"budget-poc")}
            BudgetImplementation{$(id:"budget-imp")}

            //TEAM QUESTIONS TAB Elements
            ProposalQuestionsBox{$(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'))}

            //REFERENCES TAB Elements
            //Upload documents. No able to automate at this moment the uploading of documents 

            //ADDENDA TAB Elements
            //Read Only page
            


            //REVIEW TAB Elements
            AgreeTermsCheckBox{$('data-automation-id':"checkConfirmAgreeTerms").module(Checkbox)}
            
    }


}
