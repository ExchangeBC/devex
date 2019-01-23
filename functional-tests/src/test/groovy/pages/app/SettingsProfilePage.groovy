package pages.app
import geb.Page

class SettingsProfilePage extends Page {
	static at = { title == "BCDevExchange - The BC Developer" }
	static url = "settings/profile"


 	static content = {
		EmailAddress{ $("input", id:"email" ) }
		Location{ $("input", id:"city" ) }
		SaveChangesButton{ $("button", class:"btn btn-primary" ) }					 					
 	}

}

