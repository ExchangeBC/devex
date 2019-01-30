package pages.app
import geb.Page

class APIPage extends Page  {
	static at = { title.startsWith("API List") }
	static url = "http://apilist.pathfinder.gov.bc.ca"
	static content = {}
}
