package pages.app
import geb.Page
import modules.LoginModule

class SingleProfilePage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "settings/profile"
	static content = {
        login { module LoginModule  }
        FirstName(wait: true) { $("input", id: "firstName") }
        LastName(wait: true) { $("input", id: "lastName") }
        emailprofile(wait: true) { $("input", id: "email") }
        city(wait: true) { $("input", id: "city") }
        SaveChangesButton(wait: true) { $("button", 'data-automation-id': "btnSaveChangesProfile") }
        MyCapabilitiesLink(wait: true) { $("a",id:"settings.skills") }
        MyMessages(wait: true) { $("a",id:"setttings.messages") }
        MyAffiliations(wait: true) { $("a",id:"setttings.affiliations") }
    }
}
