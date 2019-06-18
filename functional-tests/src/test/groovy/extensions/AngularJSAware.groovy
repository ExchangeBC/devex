package extensions

trait AngularJSAware {
 
    boolean isAngularReady() {
        js.exec('window.MYAPP.waitForAngular();');
        waitFor {
            js.MYAPP.APP_READY == true
        }
    }
}

