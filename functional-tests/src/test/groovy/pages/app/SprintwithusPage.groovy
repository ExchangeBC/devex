package pages.app
import geb.Page

class SprintwithusPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "sprintwithus"
	static content = {
		HowToApply(wait: true) { $("a", id:"sprintwithus-howtoapply") }
	}
}
