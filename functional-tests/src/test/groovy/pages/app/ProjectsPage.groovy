package pages.app
import geb.Page

class ProjectsPage extends Page {	
	static at = {  title.startsWith("BCDevExchange - The BC Developer") }
	static url = "projects"
	static content = {
      ListProjectButton(wait: true) { $('button[data-automation-id ~= "button-list-a-project"]') }
	  ListedProjects(required: false, wait: true) { $('data-automation-id':"listedProject") }
  }
}
