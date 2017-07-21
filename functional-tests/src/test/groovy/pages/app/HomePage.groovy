package pages.app

import geb.Page

class HomePage extends Page {

    static at = { $("h3", text:"Work directly in GitHub and get paid a fixed fee for code that meets the acceptance criteria.") }
    static url = "/"
}
