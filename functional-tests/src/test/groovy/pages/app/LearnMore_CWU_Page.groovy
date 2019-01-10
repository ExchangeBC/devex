package pages.app
import geb.Page

import org.openqa.selenium.By
import org.openqa.selenium.Keys

//import extensions.AngularJSAware

class LearnMore_CWU_Page extends Page {
	static at = { 
		h1.startsWith("Code With Us") 
	   // $('a[id ~= "codewithus"]').class== "nav-link active" 

	}

	//static at = { title == "BCDevExchange - Code With Us" }
	static url = "codewithus"
    static content = {
        DevelopersButton { $('a[id ~= "codewithus"]')}

	}



}
