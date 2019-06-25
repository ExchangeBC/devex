package pages.app
import geb.Page
//import extensions.AngularJSAware

//class ProgramsPage extends Page implements AngularJSAware {
class ProgramsPage extends Page  {
	//static at = { angularReady && title.startsWith("BCDevExchange - Programs List") }
	//static at = { title.startsWith("BCDevExchange - Programs List") }
 static at = { title.startsWith("BCDevExchange - The BC Developer") }


	static url = "programs"
	static content = {
    ListProgramButton(wait: true) { $('button[data-automation-id ~= "button-list-a-program"]') }
		ListedPrograms(required: false, wait: true) { $('data-automation-id':"listedProgram") }

  }
}
