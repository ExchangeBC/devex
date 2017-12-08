package pages.app
import geb.Page
import extensions.AngularJSAware

class AccessibilityPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Accessibility") }
	//static at = { title == "BCDevExchange - Accessibility" }
	static url = "accessibility"
	static content = {}
}
