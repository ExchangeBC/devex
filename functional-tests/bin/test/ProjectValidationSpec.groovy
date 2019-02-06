import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.ProjectsPage
import pages.app.ProjectCreatePage
import pages.app.ProjectViewPage
import pages.app.SignedIn

import geb.module.RadioButtons
import org.openqa.selenium.By
import org.openqa.selenium.Keys
import extensions.AngularJSAware


import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title

import geb.spock.GebReportingSpec


@Title("Check the user can not create projects with Invalid names-Precondition: At least a Program need to alredy exists")
class ProjectValidationSpec extends GebReportingSpec {


        def setup() {
            to HomePage
            // Need to login as an admin
            def  loginOK= login."Login As An Administrator"("admin","adminadmin","Admin Local")
            assert loginOK
        }

  @Unroll
  def "Testing project creation validation" () {
      given:
          to HomePage

          waitFor { to ProjectsPage }

          when: "I choose to create a new project"
          ListProjectButton.click()

          then:
          at ProjectCreatePage

          when: "I enter the details for the new project and click the save button"
          ProjectName.value(ProjectNameValue)
          ShortDescription.value(ShortDescriptionValue)

          SaveButton.click()

          then: "Field validity should match expectation"
          assert { ProjectName.isInvalid() == ProjectNameShouldBeInvalid }
          assert { ProjectName.isInvalid() == ShortDescriptionShouldBeInvalid }

     where:
      ProjectNameValue | ProjectNameShouldBeInvalid |  ShortDescriptionValue | ShortDescriptionShouldBeInvalid
      "" | true | "Short Descriptive Text" | false
      "\u200B" | true | "Evil zero-width space" | false
      "Possibly\u200BOkay?" | false | "" | true
  }

}
