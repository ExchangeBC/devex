package pages.app
import geb.Page

class OpportunitiesPage extends Page {
	static at = { title == "BCDevExchange - Opportunities List" }
	static url = "opportunities"
	static content = {
				postAnOpportunity(wait: true) { $("button", title:"New").click() }
	}
}
