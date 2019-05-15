import geb.spock.GebReportingSpec
import geb.*

import pages.app.HomePage
import pages.app.ProjectsPage
import pages.app.ProgramsPage

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title
import spock.lang.Stepwise

//import org.openqa.selenium.WebElement
//import org.openqa.selenium.By
import org.openqa.selenium.UnhandledAlertException



@Narrative('''In this test, the ADMIN will delete the existing Program and Project''')

@Stepwise //Order is important, as the Project needs to be deleted before the Program

@Title("Admin Deletes Project")
class AdminDeletesProjectProgram extends GebReportingSpec {         
    def setup() {
        to HomePage
        // Need to login as an admin
        def  loginOK= login."Login As An Administrator"("admin","adminadmin","Admin Local")
        assert loginOK
    } 

    def "Admin Deletes  Project" () {
        given: "Starting at the Projects Page"
            waitFor {to ProjectsPage}

        when: "Click on the first listed project"
            def projectCount = ListedProjects.size()
            ListedProjects[0].click()
            sleep(2000)
            
        and: "In the new page, click the 'pencil' button to edit the project"
            waitFor{$("button",'data-automation-id':"button-project-edit")}
            $("button",'data-automation-id':"button-project-edit").click()
            sleep(2000)

        then: "We arrive at the edit Project page and click the 'Delete this Project'"
            waitFor{$("a",'data-automation-id':"button-project-delete" )}
            $("a",'data-automation-id':"button-project-delete" ).click()
            sleep(1000)

        and: "click Yes in the modal box"
            def alt = driver.switchTo().alert()
            alt.accept()
            sleep(2000) //Modal box to dissappear after the Ok

        then:"The projects page is loaded again"  
            assert waitFor {at ProjectsPage}  

        expect: "Confirm the project does not exist anymore"
            assert ListedProjects.empty || ListedProjects.size() == projectCount - 1

    }


    def "Admin Deletes a Program" () {
        //Already logged as admin
        given: "Starting from the Programs Page"
            waitFor {to ProgramsPage}

        when: "Click on the first listed Program"
            def programCount = ListedPrograms.size()
            ListedPrograms[0].click()
            sleep(2000) 
            
        and: "In the new page, click the 'pencil' button to edit the program"
            waitFor{$("button",'data-automation-id':"button-program-edit")}
            $("button",'data-automation-id':"button-program-edit").click()
            sleep(2000)

        then: "We arrive at the edit Program page and click the 'Delete this Program'"
            waitFor{$("a",'data-automation-id':"button-program-delete" )}
            $("a",'data-automation-id':"button-program-delete" ).click()
            sleep(1000)

        and: "click Yes in the modal box"
            def alt = driver.switchTo().alert()
            alt.accept()
            sleep(2000) //Modal box to dissappear after the Ok

        then:"The Program page is loaded again"  
            assert waitFor {at ProgramsPage}  

        expect: "Confirm the Program does not exist anymore"
            assert ListedPrograms.empty || ListedPrograms.size() == programCount - 1
    
    }

  }

