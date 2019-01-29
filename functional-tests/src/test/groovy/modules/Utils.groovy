package modules

import geb.Module
import geb.spock.GebReportingSpec

import geb.Browser
import java.io.File
import java.io.IOException

//import org.apache.commons.io.FileUtils



class Utils extends Module {

    static content = {
    }
   
/*   

    Boolean "Logout as administrator"(java.lang.String baseURL){
        def  AdminIconLocation = baseURL + "img/default.png"
         //This line clicks on the Admin icon and opens the drop down list
         $("img",src:"${AdminIconLocation}").click()
         sleep(1000)
        //This line click in the Log Out option of the previous drop down list
        $("body > div:nth-child(1) > nav > div > div.navbar-collapse.collapse > ul:nth-child(3) > li.nav-item.dropdown.show > ul > li:nth-child(4) > a").click()
        return true

    }



    Boolean  CompareFileContents2 (FilePath1,FilePath2  ){
            //Deprecated because it complains importing the required org.apache.commons.io.FileUtils
            File file1 = new File("test1.txt")
            File file2 = new File("test2.txt")

            boolean compare1and2 = FileUtils.contentEquals(file1, file2)


            System.out.println("Are test1.txt and test2.txt the same? " + compare1and2)
            return true
        }
*/

       // def CompareFileContents(java.lang.String baseURL) throws IOException {
           def CompareFileContents() {
         /*   //if(f1.length()!=f2.length())return false
            File FilePath1=new File("/Users/carlesroch-cunill/Downloads⁩/code-with-us-terms.pdf")
            File FilePath2=new File("/Users/carlesroch-cunill/Feina/Contractes/BCDEVEX/devex/functional-tests/src/test/resources/code-with-us-terms.pdf")
 

            FileInputStream fis1 = new FileInputStream(FilePath1)
            FileInputStream fis2 = new FileInputStream(FilePath2)
            try {
                int byte1
                while((byte1 = fis1.read())!=-1) {
                    int byte2 = fis2.read()
                    if(byte1!=byte2)return false
                }
            } finally {
                fis1.close()
                fis2.close()
            }
            */
            return true
        }






}

