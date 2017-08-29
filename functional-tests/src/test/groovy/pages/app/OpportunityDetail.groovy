package pages.app

import geb.Page

class OpportunityDetail extends Page {
    static at = { $("h1", text:"Show that BDD testing works!!!") }
    static url = "/opportunities/opp-show-that-bdd-testing-works-"
}
