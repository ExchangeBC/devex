package pages.app
import geb.Page
//import extensions.AngularJSAware

//class ProjectViewPage extends Page implements AngularJSAware {
//	static at = { angularReady && title.startsWith("BCDevExchange - Project") }

 class ProjectViewPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer") }  

	static content = {
        EditButton { $('button[data-automation-id ~= "button-project-edit"]') }
        PublishButton { $('a[data-automation-id ~= "button-project-publish"]') }  
        UnpublishButton { $('a[data-automation-id ~= "button-project-unpublish"]') }
        RequestMembershipButton { $('button[data-automation-id ~= "button-project-request-membership"]') }
    }
}
