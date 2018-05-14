package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.By
import org.openqa.selenium.Keys
import geb.Browser
import extensions.AngularJSAware
import modules.CheckboxModule

class OpportunitiesAdminCreatePage extends Page implements AngularJSAware {
    
	static at = { angularReady && title == "BCDevExchange - New Opportunity" }
	static url = "opportunityadmin/createcwu"
	static content = {
            HeaderTabClick { $('[data-automation-id ~= "tab-cwu-header"]').click() }
            BackgroundTabClick { $('[data-automation-id ~= "tab-cwu-background"]').click() }
            AcceptanceTabClick { $('[data-automation-id ~= "tab-cwu-acceptance"]').click() }
            DetailsTabClick { $('[data-automation-id ~= "tab-cwu-details"]').click() }
           
           descriptionFrame(page: MCEFrame) { $(By.xpath('//iframe[@id=concat(//textarea[@data-automation-id="text-cwu-description"]//@id,"_ifr")]'), 0) }

            evaluationFrame(page: MCEFrame) { $(By.xpath('//iframe[@id=concat(//textarea[@data-automation-id="text-cwu-evaluation"]//@id,"_ifr")]'), 0) }

            acceptanceFrame(page: MCEFrame) { $(By.xpath('//iframe[@id=concat(//textarea[@data-automation-id="text-cwu-acceptance"]//@id,"_ifr")]'), 0) }

        
            SaveButton { $('button[data-automation-id ~= "button-cwu-save"]') }
            DeleteButton { $('a[data-automation-id ~= "button-cwu-delete"]') }
            
            oppTitle { $("input",id:"title") }
            oppTeaser { $("#short") }
            selectProject { $("#opportunityForm") }
            oppEmail { $("input", id:"proposalEmail") }
            oppGithub { $("input",id:"github") }
            oppSkills { $("input", id:"skilllist") }
            selectEarn { $("#opportunityForm") }
            selectLocation { $("#opportunityForm") }
            selectOnsite { $("#opportunityForm") }
        }

    void "Add Description"(String desc){
            waitFor { angularReady }
            withFrame( waitFor { descriptionFrame } ) {
              mceBody << desc
          }
    }
    
    void "Add Acceptance Criteria"(String desc){
            waitFor { angularReady }
            withFrame( waitFor { acceptanceFrame } ) {
              mceBody << desc
          }
    }

    void "Add Proposal Criteria"(String desc){
            waitFor { angularReady }
            withFrame( waitFor { evaluationFrame } ) {
              mceBody << desc
          }
    }
   
    void "Set All Dates"(){
        def dateFormat = 'yyyy-MM-dd'
        def deadline = new Date().plus(7)
        def assignment = new Date().plus(21)
        def start = new Date().plus(42)
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
        waitFor { angularReady }
        $("input", type:"date", name:"deadline").jquery.val(dDate)
    }

    void "Set Assignment Date"(String dDate){
        waitFor { angularReady }
        $("input", type:"date", name:"assignment").jquery.val(dDate)
    }

    void "Set Start Date"(String dDate){
        waitFor { angularReady }
        $("input", type:"date", name:"start").jquery.val(dDate)
        }

}
