package pages.app
import geb.Page
import extensions.AngularJSAware

class ProgramCreatePage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - New Program") }
	static url = "programadmin/create"
	static content = {
    ProgramTitle { $('input[data-automation-id ~= "text-program-title"]') }
    Description { $('textarea[data-automation-id ~= "text-program-description"]') }
    ShortDescription { $('textarea[data-automation-id ~= "text-program-short-description"]') }
    Website { $('input[data-automation-id ~= "text-program-website"]') }
    SaveButton { $('a[data-automation-id ~= "button-program-save"]') }
    DeleteButton { $('a[data-automation-id ~= "button-program-delete"]') }
  }
}
