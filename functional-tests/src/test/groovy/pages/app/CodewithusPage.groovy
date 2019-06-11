package pages.app
import geb.Page

class CodewithusPage extends Page {	

	static at = {title.startsWith("BCDevExchange - The BC Developer") } 
	static url = "codewithus"
    static content = {
        DevelopersButton(wait: true) { $('a[id ~= "codewithus"]', 0) }
		DevelopersButtonClass(wait: true) { $('a[id ~= "codewithus"]',0).@class }
		PublicSectorProductManagers(wait: true) { $('a[id ~= "codewithusps"]',0).@class }
		BrowseOpportunitiesLink(wait: true) { $('a[class~="btn-primary"]') }
		ReadtheGuideLink(wait: true) { $('a[class="btn btn-lg btn-text-only"]') }
	}
}
