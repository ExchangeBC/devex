package pages.app
import geb.Page
//import extensions.AngularJSAware
//import modules.AngularValidated
import org.openqa.selenium.By


//class ProgramCreatePage extends Page implements AngularJSAware {
class ProgramCreatePage extends Page  {
	//static at = { angularReady && title.startsWith("BCDevExchange - New Program") }

  static at = { title.startsWith("BCDevExchange - The BC Developer")}
	static url = "programadmin/create"
	static content = {
    //ProgramTitle { $('input[data-automation-id ~= "text-program-title"]').module(AngularValidated) }
    ProgramTitle { $('input[data-automation-id ~= "text-program-title"]') }
    ShortDescription { $('textarea[data-automation-id ~= "text-program-short-description"]') }
    //Website { $('input[data-automation-id ~= "text-program-website"]').module(AngularValidated) }
    Website { $('input[data-automation-id ~= "text-program-website"]')}
    SaveButton { $('a[data-automation-id ~= "button-program-save"]') }
    DeleteButton { $('a[data-automation-id ~= "button-program-delete"]') }
    ProgramDescriptionBox{$(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'))}

  }

}
