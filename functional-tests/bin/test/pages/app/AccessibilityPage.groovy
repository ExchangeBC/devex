package pages.app
import geb.Page
//import extensions.AngularJSAware

//class AccessibilityPage extends Page implements AngularJSAware {
//	static at = { angularReady && title.startsWith("BCDevExchange - Accessibility") }
class AccessibilityPage extends Page  {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	//static at = { title == "BCDevExchange - Accessibility" }
	static url = "accessibility"
	static content = {}
}
