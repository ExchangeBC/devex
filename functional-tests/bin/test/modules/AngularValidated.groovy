package modules

import geb.Module
import geb.Page

class AngularValidated extends Module {
    boolean isInvalid() {
        parent().hasClass("ng-invalid")
    }
}
