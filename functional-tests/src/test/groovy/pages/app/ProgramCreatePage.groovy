package pages.app
import geb.Page
import extensions.AngularJSAware
import modules.AngularValidated
import org.openqa.selenium.By


class ProgramCreatePage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - New Program") }
	static url = "programadmin/create"
	static content = {
    ProgramTitle { $('input[data-automation-id ~= "text-program-title"]').module(AngularValidated) }
    ShortDescription { $('textarea[data-automation-id ~= "text-program-short-description"]') }
    Website { $('input[data-automation-id ~= "text-program-website"]').module(AngularValidated) }
    SaveButton { $('a[data-automation-id ~= "button-program-save"]') }
    DeleteButton { $('a[data-automation-id ~= "button-program-delete"]') }
		descriptionFrame(page: MCEFrame) { $(By.xpath('//iframe[@id=concat(//textarea[@data-automation-id="text-program-description"]//@id,"_ifr")]'), 0) }
  }


    void "Set Description"(String desc){
          waitFor { angularReady }
          withFrame( waitFor { descriptionFrame } ) {
            mceBody << desc
        }
  }
}
