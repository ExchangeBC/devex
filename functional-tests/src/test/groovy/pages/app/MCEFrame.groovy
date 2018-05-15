package pages.app
import geb.Page

class MCEFrame extends Page {
    static content = {
        mceBody { $("body", id:"tinymce") }
    }
}

