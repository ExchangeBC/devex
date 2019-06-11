package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.By
import org.openqa.selenium.Keys
import geb.Browser
import modules.CheckboxModule
import modules.AngularValidated

class OpportunitiesAdminCreatePage extends Page {  
	static at = {title.startsWith("BCDevExchange - The BC Developer") } 
    static url = "createcwu"

	static content = {
        HeaderTab(wait: true)  { $('[data-automation-id ~= "tab-cwu-header"]') }
        BackgroundTab(wait: true)  { $('[data-automation-id ~= "tab-cwu-background"]') }
        AcceptanceTab(wait: true)  { $('[data-automation-id ~= "tab-cwu-acceptance"]') }
        DetailsTab(wait: true)  { $('[data-automation-id ~= "tab-cwu-details"]') }
           
        OppBackgroundBox(wait: true)  { $(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),0) }
        OppAcceptanceBox(wait: true)  { $(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),1) }
        ProposalAcceptanceBox(wait: true)  { $(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),2) }

        SaveButton(wait: true)  { $('button[data-automation-id ~= "button-cwu-save"]') }
        DeleteButton(wait: true)  { $('a[data-automation-id ~= "button-cwu-delete"]') }
            
        ProjectSelector(wait: true) { $('[id=project]') }
        OppTitleTextInput(wait: true)  { $("input",id:"title") }
        OppTeaserInput(wait: true)  { $("#short") }
        OppGithubInput(wait: true)  { $("input",id:"github") }
        oppSkills(wait: true)  { $("input", id:"skilllist") }
        LocationSelector (wait: true) { $('select',name:'location') }
        selectEarn(wait: true) { $('select', name:'earn') }
        LocationRadioButton(wait: true) {option -> $("input[type='radio']", name: "onsite", value: option)}

        //Dates section
        ProposalDeadlineInput(wait: true) { $("input",id:"deadline") }
        ProposalAssignmentInput(wait: true) { $("input", type:"date", name:"assignment") }
        proposalStartDate(wait: true) { $('input[name="start"]') }

    }
   
    void "Set All Dates"() {
        def dateFormat = 'yyyy-MM-dd'
        def deadline = new Date().plus('7')
        def assignment = new Date().plus('21')
        def start = new Date().plus('42')
        deadline = deadline.format( dateFormat )
        assignment = assignment.format( dateFormat )
        start = start.format( dateFormat )
        println deadline
        println assignment
        println start
        "Set Deadline Date"("$deadline")        
        "Set Assignment Date"("$assignment")        
        "Set Start Date"("$start")
    }

    void "Set Deadline Date"(String dDate){
        $("input", type:"date", name:"deadline").jquery.val(dDate)
    }

    void "Set Assignment Date"(String dDate){
        $("input", type:"date", name:"assignment").jquery.val(dDate)
    }

    void "Set Start Date"(String dDate){
        $("input", type:"date", name:"start").jquery.val(dDate)
    }
}
