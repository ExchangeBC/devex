package pages.app

import geb.Page

class Disclaimer extends Page {
    static at = { $("h1", text:"Disclaimer") }
    static url = "/disclaimer"
}
