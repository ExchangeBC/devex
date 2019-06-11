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
        HeaderTab(wait: 2)  { $('[data-automation-id ~= "tab-cwu-header"]') }
        BackgroundTab(wait: 2)  { $('[data-automation-id ~= "tab-cwu-background"]') }
        AcceptanceTab(wait: 2)  { $('[data-automation-id ~= "tab-cwu-acceptance"]') }
        DetailsTab(wait: 2)  { $('[data-automation-id ~= "tab-cwu-details"]') }
           
        OppBackgroundBox(wait: 2)  { $(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),0) }
        OppAcceptanceBox(wait: 2)  { $(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),1) }
        ProposalAcceptanceBox(wait: 2)  { $(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),2) }

        SaveButton(wait: 2)  { $('button[data-automation-id ~= "button-cwu-save"]') }
        DeleteButton(wait: 2)  { $('a[data-automation-id ~= "button-cwu-delete"]') }
            
        selectProject(wait: 2) { $('[id=project]') }
        oppTitle(wait: 2)  { $("input",id:"title") }
        oppTeaser(wait: 2)  { $("#short") }
        oppGithub(wait: 2)  { $("input",id:"github") }
        oppSkills(wait: 2)  { $("input", id:"skilllist") }
        selectLocation (wait: 2) { $('select',name:'location') }
        selectEarn(wait: 2) { $('select', name:'earn') }
        LocationRadioButton(wait: 2) {option -> $("input[type='radio']", name: "onsite", value: option)}

        //Dates section
        proposalDeadLine(wait: 2) { $("input",id:"deadline") }
        proposalAssignment(wait: 2) { $("input", type:"date", name:"assignment") }
        proposalStartDate(wait: 2) { $('input[name="start"]') }

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
