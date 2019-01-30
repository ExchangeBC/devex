package extensions

trait AngularJSAware {
 
    boolean isAngularReady() {
/*         if ($("script", src:"https://s3.ca-central-1.amazonaws.com/stens-angular-test/angular-test-support.js").size() == 0) {
            browser.driver.executeScript("document.body.appendChild(document.createElement(\'script\')).src=\'https://s3.ca-central-1.amazonaws.com/stens-angular-test/angular-test-support.js'")
        }  */
        js.exec('window.MYAPP.waitForAngular();');
        waitFor {
            js.MYAPP.APP_READY == true
        }

    }
}

