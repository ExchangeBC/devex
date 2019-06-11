package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.By

class InitialCWUProposalPage extends Page {
	static at = { title.startsWith("BCDevExchange") }
	static content = {
        DeveloperTab(wait: true) { $('[data-automation-id ~= "tab-cwu-proposal-developer"]') }
        CompanyTab(wait: true) { $('[data-automation-id ~= "tab-cwu-proposal-company"]') }
        ProposalTab(wait: true) { $('[data-automation-id ~= "tab-cwu-proposal-proposal"]') }
        AttachmentTab(wait: true) { $('[data-automation-id ~= "tab-cwu-proposal-attachment"]') }
        TermsTab(wait: true) { $('[data-automation-id ~= "tab-cwu-proposal-terms"]') }
        Address(wait: true) {$("input",id:"address") }
        BusinessAddress(wait: true) {$("input",id:"businessAddress") }
        BusinessContactPhone(wait: true) {$("input",id:"businessContactPhone") }
        ButtonSubmit(wait: true) { $('[data-automation-id ~= "button-cwu-proposal-submit"]') }
        ButtonDelete(wait: true) { $('[data-automation-id ~= "button-cwu-proposal-delete"]') }
        ButtonWithdraw(wait: true) { $('[data-automation-id ~= "button-cwu-proposal-withdraw"]') }
        ButtonUploadFile(wait: true) { $('[data-automation-id~="button-cwu-proposal-upload-file"]') }
        ButtonModalYes(wait: true) {$('[data-automation-id~="button-modal-yes"]') }
        CheckTerms(wait: true) { $('[data-automation-id ~= "checkbox-cwu-proposal-terms"]').module(Checkbox) }
        Email(wait: true) { $('[id ~= "email"]') }
        IsCompanyCheckBox(wait: true) {$("input",name:"isCompany").module(Checkbox) }
        FirstName(wait: true) { $('[id ~= "firstName"]') }
        MustAgreeTermsMsg(wait: true) {$('data-automation-id':"mustAgreeTermsWarning") }   
        ProposalDescriptionBox(wait: true) {$(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]')) }
        UpdateMyProposalLnk(wait: true) { $("a",id:"proposaladmin.edit",0) }
        SaveUpdatesButton(wait: true) {$("button",'data-automation-id':"button-cwu-proposal-save-updates") }
        SaveChangesButton(wait: true) {$("button",'data-automation-id':"button-cwu-proposal-save-changes") }        
        SubmitProposal(wait: true) {$("button",'data-automation-id':"button-cwu-proposal-submit") }
    }
}
