package pages.app
import geb.Page
import extensions.AngularJSAware

//class SprintwithusPage extends Page implements AngularJSAware {
//	static at = { angularReady && title.startsWith("BCDevExchange - Sprint With Us") }
class SprintwithusPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "sprintwithus"
	static content = {
		HowToApply{$("a",id:"sprintwithus-howtoapply")}


	}
}
