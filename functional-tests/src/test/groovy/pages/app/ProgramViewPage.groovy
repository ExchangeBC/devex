package pages.app
import geb.Page
import org.openqa.selenium.By
//import extensions.AngularJSAware

//class ProgramViewPage extends Page implements AngularJSAware {
class ProgramViewPage extends Page {    
	//static at = { angularReady && title.startsWith("BCDevExchange - The BC Developer") }
    static at = { title.startsWith("BCDevExchange - The BC Developer") }
	static content = {
        PublishButton{ $('a[data-automation-id ~= "button-program-publish"]') }  
        EditButton { $('button[data-automation-id ~= "button-program-edit"]') }
        UnpublishButton { $('a[data-automation-id ~= "button-program-unpublish"]') }
        RequestMembershipButton { $('button[data-automation-id ~= "button-program-request-membership"]') }
    }
}





