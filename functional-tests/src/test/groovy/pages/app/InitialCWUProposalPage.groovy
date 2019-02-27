package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.By

class InitialCWUProposalPage extends Page {
	static at = { title.startsWith("BCDevExchange") }
	//static at = { title == "BCDevExchange - Proposals List" }
	//static url = ${driver.currentUrl()}   <-- Can not be set dynamically
	static content = {
            DeveloperTab{ $('[data-automation-id ~= "tab-cwu-proposal-developer"]')}
            CompanyTab { $('[data-automation-id ~= "tab-cwu-proposal-company"]') }
            ProposalTab { $('[data-automation-id ~= "tab-cwu-proposal-proposal"]') }
            AttachmentTab { $('[data-automation-id ~= "tab-cwu-proposal-attachment"]') }
            TermsTab { $('[data-automation-id ~= "tab-cwu-proposal-terms"]') }
 
            Address{$("input",id:"address")}
            BusinessAddress{$("input",id:"businessAddress")}
            BusinessContactPhone{$("input",id:"businessContactPhone")}
            ButtonSubmit { $('[data-automation-id ~= "button-cwu-proposal-submit"]') }
            ButtonSaveUpdates { $('[data-automation-id ~= "button-cwu-proposal-save-updates"]') }
            ButtonSaveChanges { $('[data-automation-id ~= "button-cwu-proposal-save-changes"]') }
            ButtonDelete { $('[data-automation-id ~= "button-cwu-proposal-delete"]') }
            ButtonWithdraw { $('[data-automation-id ~= "button-cwu-proposal-withdraw"]') }
            ButtonUploadFile{ $('[data-automation-id~="button-cwu-proposal-upload-file"]') }
            ButtonModalYes{$('[data-automation-id~="button-modal-yes"]')}
            CheckTerms{ $('[data-automation-id ~= "checkbox-cwu-proposal-terms"]').module(Checkbox)}
            Email{ $('[id ~= "email"]') }
            IsCompanyCheckBox{$("input",name:"isCompany").module(Checkbox)}           
            FirstName{ $('[id ~= "firstName"]') }
            MustAgreeTermsMsg{$('data-automation-id':"mustAgreeTermsWarning")}
             
            ProposalDescriptionBox{$(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'))}
            UpdateMyProposalLnk{ $("a",id:"proposaladmin.edit",0)} //there are two of these links
            SaveChangesButton{$("button",'data-automation-id':"button-cwu-proposal-save-changes")}
            SaveUpdatesButton{$("button",'data-automation-id':"button-cwu-proposal-save-updates")}
            SubmitProposal{$("button",'data-automation-id':"button-cwu-proposal-submit")}
    }
    
}
