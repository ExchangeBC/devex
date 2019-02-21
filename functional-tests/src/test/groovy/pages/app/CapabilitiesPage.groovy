package pages.app
import geb.Page

class CapabilitiesPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "/capabilities"
	static content = {

        AddACapability{$("button",title:"New")}
		CapabilityFirstEntry{$('data-automation-id':"lstCapabilityEntry",0)}

    }
}
