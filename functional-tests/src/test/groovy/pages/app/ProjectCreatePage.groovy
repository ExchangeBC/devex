package pages.app
import geb.Page
//import extensions.AngularJSAware
import org.openqa.selenium.By

//import modules.AngularValidated

//class ProjectCreatePage extends Page implements AngularJSAware {
class ProjectCreatePage extends Page {
	//static at = { angularReady && title.startsWith("BCDevExchange - New Project") }
    static at = {  title.startsWith("BCDevExchange - The BC Developer") }
    static url = "projectadmin/create"
	static content = {
            //ProjectName { $('input[data-automation-id ~= "text-project-name"]').module(AngularValidated) }
            ProjectName { $('input[data-automation-id ~= "text-project-name"]')}
            ShortDescription { $('textarea[data-automation-id ~= "text-project-short-description"]') }
            Program { $('select[data-automation-id ~= "select-project-program"]') }
            //Github { $('input[data-automation-id ~= "text-project-github"]').module(AngularValidated) }
            Github { $('input[data-automation-id ~= "text-project-github"]')}
            //Tags { $('input[data-automation-id ~= "text-project-tags"]').module(AngularValidated) }
            //ActivityLevel { $('input[data-automation-id ~= "text-project-activity-level"]').module(AngularValidated) }
            Tags { $('input[data-automation-id ~= "text-project-tags"]')}
            ActivityLevel { $('input[data-automation-id ~= "text-project-activity-level"]') }
            DeleteButton { $('a[data-automation-id ~= "button-project-delete"]') }
            SaveButton (wait: true) { $('button[data-automation-id ~= "button-project-save"]') }

            
        
            descriptionFrame(page: MCEFrame) { $(By.xpath('//iframe[@id=concat(//textarea[@data-automation-id="text-project-description"]//@id,"_ifr")]'), 0) }
        //*[@id="ui-tinymce-1"]

    }


      void "Set Description"(String desc){
            //waitFor { angularReady }
            withFrame( waitFor { descriptionFrame } ) {
                mceBody << desc
                }
    }

}
