package pages.app
import geb.Page
//import extensions.AngularJSAware

//class ProjectsPage extends Page implements AngularJSAware {
//	static at = { angularReady && title.startsWith("BCDevExchange - Projects List") }
class ProjectsPage extends Page {	
	static at = {  title.startsWith("BCDevExchange - The BC Developer") }
	static url = "projects"
	static content = {
      ListProjectButton { $('button[data-automation-id ~= "button-list-a-project"]') }
  }
}
