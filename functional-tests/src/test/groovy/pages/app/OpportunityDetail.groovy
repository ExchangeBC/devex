package pages.app

import geb.Page

class OpportunityDetail extends Page {
    static at = { title.startsWith("BCDevExchange - Opportunity: ") }
    //static url.startsWith("opportunities/opp-")
    static content = {
    	unPublished { $("#page-top > main > ui-view > section > div:nth-child(3) > div:nth-child(1) > div > label").contains(" UNPUBLISHED") }
    	oppDetailTitle { $("h1").text() }
    }
}
