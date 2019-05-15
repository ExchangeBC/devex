package pages.app
import geb.Page

class CapabilitiesPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "/capabilities"
	static content = {
		AddACapability{$("button",title:"New")}
		CapabilityCookingEntries(required: false, wait: 2) { $('data-automation-id':"lstCapabilityEntry-Cooking") }
	}
}
