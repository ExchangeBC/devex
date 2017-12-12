package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.Keys
import geb.Browser
import extensions.AngularJSAware

class FrameDescribingPage extends Page {
    static content = {
        mceBody { $("body", id:"tinymce") }
    }
}

class OpportunitiesAdminCreatePage extends Page implements AngularJSAware {
    
	static at = { angularReady && title == "BCDevExchange - New Opportunity" }
    //static at = { title == "BCDevExchange - New Opportunity" }
	static url = "opportunityadmin/create"
	static content = {
            opportunityTypeCd { $("input", name:"opportunityTypeCd").module(RadioButtons) }
            desciFrame(page: FrameDescribingPage) { $("iframe", id: startsWith("ui-tinymce-"), 0) }
            desciText { $("textarea", 1).module(Textarea) }
            aciFrame(page: FrameDescribingPage) { $("iframe", id: startsWith("ui-tinymce-"), 1) }
            actiText { $("textarea", 2).module(Textarea) }
            propiFrame(page: FrameDescribingPage) { $("iframe", id: startsWith("ui-tinymce-"), 2) }
            propiText { $("textarea", 3).module(Textarea) }
            oppTeaser { $(name: "short").module(Textarea) }
            oppTitle { $("input",id:"title") }
            selectProject { $("#opportunityForm") }
            lowerSaveButton { $("#opportunityForm > div.row.form-foot > div > div > button") }
            oppEmail { $("input", id:"proposalEmail") }
            oppGithub { $("input",id:"github") }
            oppSkills { $("input", id:"skilllist") }
            oppRole { waitFor { angularReady } 
                    $("input", "ng-model":"vm.opportunity.c01_flag").module(Checkbox) 
                    }
            selectEarn { $("#opportunityForm") }
            selectLocation { $("#opportunityForm") }
            selectOnsite { $("#opportunityForm") }
            textArea { $("#ui-tinymce-7") }
            upperSaveButton { $("button", type:"submit", 0) }
        }

    void "Add Description"(String desc){
            waitFor { angularReady }
            withFrame( waitFor { desciFrame } ) {
              mceBody << desc
          }
         //desciText.text = desc
    }
    
    void "Add Acceptance Criteria"(String desc){
            waitFor { angularReady }
            withFrame( waitFor { aciFrame } ) {
              mceBody << desc
          }
          //aciText.text = desc
    }

    void "Add Proposal Criteria"(String desc){
            waitFor { angularReady }
            withFrame( waitFor { propiFrame } ) {
              mceBody << desc
          }
          //propiText.text = desc
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

	 //Hard wait function, sometimes useful to sync up the application when you cannot use waitFor.
    Boolean sleepForNSeconds(int n) {
    	def originalMilliseconds = System.currentTimeMillis()
    	waitFor(n + 1, 0.5) { (System.currentTimeMillis() - originalMilliseconds) > (n * 1000) }
        return true
    	}
}
