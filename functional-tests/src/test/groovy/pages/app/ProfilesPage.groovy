package pages.app
import geb.Page

class ProfilesPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "settings/profile"
	static content = {
		DeleteProfileButton{$("button",'data-automation-id':"btnDeleteProfile" )}

	}
}
