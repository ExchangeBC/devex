package pages.app
import geb.Page
import extensions.AngularJSAware
import org.openqa.selenium.By

import modules.AngularValidated

class ProjectCreatePage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - New Project") }
	static url = "projectadmin/create"
	static content = {
    ProjectName { $('input[data-automation-id ~= "text-project-name"]').module(AngularValidated) }
    ShortDescription { $('textarea[data-automation-id ~= "text-project-short-description"]') }
    Program { $('select[data-automation-id ~= "select-project-program"]') }
    Github { $('input[data-automation-id ~= "text-project-github"]').module(AngularValidated) }
    Tags { $('input[data-automation-id ~= "text-project-tags"]').module(AngularValidated) }
    ActivityLevel { $('input[data-automation-id ~= "text-project-activity-level"]').module(AngularValidated) }
    SaveButton { $('button[data-automation-id ~= "button-project-save"]') }
    DeleteButton { $('a[data-automation-id ~= "button-project-delete"]') }
    descriptionFrame(page: MCEFrame) { $(By.xpath('//iframe[@id=concat(//textarea[@data-automation-id="text-project-description"]//@id,"_ifr")]'), 0) }
}

      void "Set Description"(String desc){
            waitFor { angularReady }
            withFrame( waitFor { descriptionFrame } ) {
              mceBody << desc
          }
    }

}
