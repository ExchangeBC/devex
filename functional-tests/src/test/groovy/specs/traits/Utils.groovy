/*
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

package specs.traits

import geb.navigator.Navigator
import geb.driver.CachingDriverFactory
import geb.waiting.WaitTimeoutException

import java.lang.AssertionError

/**
 * Generic re-usable utility methods.
 */
trait Utils {
  /**
   * Clears the browser and closes it.
   * The next spec to run will open a fresh browser instance.
   */
  void clearAndResetBrowser() {
    resetBrowser()
    CachingDriverFactory.clearCacheAndQuitDriver()
  }

  /**
   * Throw an AssertionError with the given message.
   *
   * @param String the exception message to throw. (optional, default: '')
   * @throws AssertionError
   */
  void fail(String message='') {
    throw new AssertionError(message)
  }

  /**
   * Appends a random 2-3 digit integer to the beginning of the provided string.
   * @param nonUniqueString a string to make unique.
   * @return the given string with random digits appended to the beginning.
   */
  String makeUnique(String nonUniqueString) {
    String random = Math.abs(new Random().nextInt() % 600) + 1
    return random + nonUniqueString
  }

  Boolean CheckIfReauthIsNeeded(){
      if (driver.currentUrl.contains("oauth/authorize?")) { //This is part of the reauthorization page URL
              println("Had to reauthorize Devex to access the GibHub account")
              $("button",name:"authorize").click()  //Click on the reauthorize button to proceed
              sleep(2000)
      }
      else {
              println("No need to reauthorize Devex to access the GibHub account")
      }
      return true
  } 

  // TODO: Do we need this?  If so, abstract it into a utilty method
  Boolean CompareFileContents() {

        File FilePath1=new File(System.getProperty('user.home')+"/Downloads/rfq-sprint-with-us-company.pdf")
        File FilePath2=new File(System.getProperty('user.dir')+"/src/test/resources/rfq-sprint-with-us-company.pdf")
        
        FileInputStream fis1 = new FileInputStream(FilePath1)
        FileInputStream fis2 = new FileInputStream(FilePath2)
        try {
            int byte1
            while((byte1 = fis1.read())!=-1) {
                int byte2 = fis2.read()
                if(byte1!=byte2)return false
                }
            } 
        finally {
            fis1.close()
            fis2.close()
            //After comparing, delete the just downloaded file. Useful when running lots of test one after the other
            //The FileInputStream class does not have a delete method, so I need to use another class
            def ftd=new File(System.getProperty('user.home')+"/Downloads/rfq-sprint-with-us-company.pdf")
            ftd.delete()
        }

            return true
      }
}
