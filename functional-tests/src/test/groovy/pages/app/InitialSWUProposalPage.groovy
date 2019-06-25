package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.By

class InitialSWUProposalPage extends Page {
	static at = { title.startsWith("BCDevExchange") }
	static content = {
            EvaluationTab(wait: true) { $('[data-automation-id ~= "tab-swu-proposal-evaluation"]')}
            TermsTab(wait: true) { $('[data-automation-id ~= "tab-swu-proposal-terms"]') }
            SelectTeamTab(wait: true) { $('[data-automation-id ~= "tab-swu-proposal-selectteam"]') }
            PricingTab(wait: true) { $('[data-automation-id ~= "tab-swu-proposal-pricing"]') }
            QuestionsTab(wait: true) { $('[data-automation-id ~= "tab-swu-proposal-questions"]') }
            ReferencesTab(wait: true) { $('[data-automation-id ~= "tab-swu-proposal-references"]') }
            AddendaTab(wait: true) { $('[data-automation-id ~= "tab-swu-proposal-addenda"]') }
            ReviewTab(wait: true) { $('[data-automation-id ~= "tab-swu-proposal-review"]') }

            ButtonDelete(wait: true) { $('[data-automation-id ~= "btnDeleteSWUProposal"]') }
            ButtonReSubmit(wait: true) { $('[data-automation-id ~= "btnResubmitSWUProposal"]') }
            ButtonSaveChanges(wait: true) { $('[data-automation-id ~= "btnSavesSWUChanges"]') }
            ButtonSubmit(wait: true) { $('[data-automation-id ~= "btnSubmitSWUProposal"]') }
            ExportSWUProposal(wait: true) { $('[data-automation-id ~= "lnkExportSWUProposal"]') }    
            ButtonWithdraw(wait: true) { $('[data-automation-id ~= "btnWithdrawSWUProposal"]') }

            ButtonModalYes(wait: true) {$('[data-automation-id~="button-modal-yes"]')}

            UpdateSWUProposal(wait: true) { $("a",id:'proposaladmin.edit',0) } //Two nested element share the same id, any of them would be fine

            //EVALUATION TAB Elements
            CodeChallengeDownload(wait: true) { $("a",href:"/terms/codechallenge") }

            //TERMS TAB Elements
            DownLoadTermsConditions(wait: true) {$("a",href:"/terms/swu1")}

            //SELECT TEAM TAB Elements
            InceptionPhaseTeamMember1(wait: true) { $('[data-automation-id ~= "inceptionPhaseTeamMember"]',0) }
            InceptionPhaseTeamMember2(wait: true) { $('[data-automation-id ~= "inceptionPhaseTeamMember"]',1) }

            PrototypePhaseTeamMember1(wait: true) { $('[data-automation-id ~= "prototypePhaseTeamMember"]',0) }
            PrototypePhaseTeamMember2(wait: true) { $('[data-automation-id ~= "prototypePhaseTeamMember"]',1) }

            ImplementationPhaseTeamMember1(wait: true) { $('[data-automation-id ~= "implementationPhaseTeamMember"]',0) }
            ImplementationPhaseTeamMember2(wait: true) { $('[data-automation-id ~= "implementationPhaseTeamMember"]',1) }

            //PRICING TAB Elements
            BudgetInception(wait: true) { $(id:"budget-inception") }
            BudgetPOC(wait: true) { $(id:"budget-poc") }
            BudgetImplementation(wait: true) { $(id:"budget-imp") }

            //TEAM QUESTIONS TAB Elements
            ProposalQuestionsBox(wait: true) { $(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]')) }
            
            //REVIEW TAB Elements
            AgreeTermsCheckBox(wait: true) { $('data-automation-id':"checkConfirmAgreeTerms").module(Checkbox) }
            
    }


}
