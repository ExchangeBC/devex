package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.By
import org.openqa.selenium.Keys
import geb.Browser
import extensions.AngularJSAware
import modules.CheckboxModule

class FrameDescribingPage extends Page {
    static content = {
        mceBody { $("body", id:"tinymce") }
    }
}

class OpportunitiesAdminCreatePage extends Page implements AngularJSAware {
    
	static at = { angularReady && title == "BCDevExchange - New Opportunity" }
	static url = "opportunityadmin/createcwu"
	static content = {
            HeaderTabClick { $(By.xpath('//a[@class="nav-link" and contains(.,"Header")]'), 0).click() }
            BackgroundTabClick { $(By.xpath('//a[@class="nav-link" and contains(.,"Background")]'), 0).click() }
            DetailsTabClick { $(By.xpath('//a[@class="nav-link" and contains(.,"Details")]'), 0).click() }
            AcceptanceTabClick { $(By.xpath('//a[@class="nav-link" and contains(.,"Acceptance and Evaluation")]'), 0).click() }
  
            SaveChangesButton { $("Button", type:"submit", 0) }
            CloseButton { $(By.xpath('//a[i[@title="Close"]]'), 0) }

            propiFrame(page: FrameDescribingPage) { $(By.xpath('//div[@data-field="criteria"]//following-sibling::p//iframe'), 0) }
            desciFrame(page: FrameDescribingPage) { $(By.xpath('//div[@data-field="description"]//following-sibling::p//iframe'), 0) }
            aciFrame(page: FrameDescribingPage) { $(By.xpath('//div[@data-field="evaluation"]//following-sibling::p//iframe'), 0) }
            oppTeaser { $(name: "short").module(Textarea) }
            oppTitle { $("input",id:"title") }
            selectProject { $("#opportunityForm") }
            oppEmail { $("input", id:"proposalEmail") }
            oppGithub { $("input",id:"github") }
            oppSkills { $("input", id:"skilllist") }
            //oppRole { waitFor { angularReady } 
            //$("input", "ng-model":"vm.opportunity.c01_flag").module(Checkbox) 
            //}
            selectEarn { $("#opportunityForm") }
            selectLocation { $("#opportunityForm") }
            selectOnsite { $("#opportunityForm") }
            textArea { $("#ui-tinymce-7") }
        }

    void "Add Description"(String desc){
            waitFor { angularReady }
            withFrame( waitFor { desciFrame } ) {
              mceBody << desc
          }
    }
    
    void "Add Acceptance Criteria"(String desc){
            waitFor { angularReady }
            withFrame( waitFor { aciFrame } ) {
              mceBody << desc
          }
    }

    void "Add Proposal Criteria"(String desc){
            waitFor { angularReady }
            withFrame( waitFor { propiFrame } ) {
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

   //@todo deprecated?
	 //Hard wait function, sometimes useful to sync up the application when you cannot use waitFor.
   Boolean sleepForNSeconds(int n) {
    	def originalMilliseconds = System.currentTimeMillis()
    	waitFor(n + 1, 0.5) { (System.currentTimeMillis() - originalMilliseconds) > (n * 1000) }
        return true
    	}
}
