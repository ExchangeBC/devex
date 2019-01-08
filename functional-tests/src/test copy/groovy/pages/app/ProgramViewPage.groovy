package pages.app
import geb.Page
import extensions.AngularJSAware

class ProgramViewPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Program") }
	static url = "programs"
	static content = {
    EditButton { $('button[data-automation-id ~= "button-program-edit"]') }
    PublishButton { $('a[data-automation-id ~= "button-program-publish"]') }  
    UnpublishButton { $('a[data-automation-id ~= "button-program-unpublish"]') }
    RequestMembershipButton { $('button[data-automation-id ~= "button-program-request-membership"]') }
    }
}
