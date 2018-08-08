import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.OpportunitiesPage
import pages.app.OpportunitiesAdminCreatePage
import pages.app.OpportunitiesAdminCreateLandingPage
import pages.app.OpportunityDetailPage
import pages.app.OpportunitiesAdminEditPage
import pages.app.ProgramsPage
import pages.app.ProgramCreatePage
import pages.app.ProgramViewPage
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


@Title("Create and publish projects, programs, and opportunities")
class OpportunityCreateSpecs extends GebReportingSpec {

      static def RandomID = UUID.randomUUID().toString()


      def setup() {
        withNoAlert{to HomePage}

        // Need to login as an admin
        def loginOK = login."Login as an adminstrator"("admin","adminadmin","Admin Local")
        assert loginOK
      }

      @Unroll
      def "Create Program: '#ProgramTitleValue'" () {
          given:
              waitFor { to ProgramsPage }

              when: "I choose to create a new program"
              ListProgramButton.click()

              then:
              at ProgramCreatePage

              when: "I enter the details for the new program"
              ProgramTitle.value(ProgramTitleValue)
              ShortDescription.value(ShortDescriptionValue)
              "Set Description" DescriptionValue
              Website.value(WebsiteValue)

              and: "I click the 'save changes' button for the program: '#ProgramTitleValue'"
              SaveButton.click()


              then:
              waitFor { at ProgramViewPage }
              assert PublishButton

              when: "I click the publish button"
              PublishButton.click()

              then:
              waitFor { at ProgramViewPage }
              assert UnpublishButton
              assert UnpublishButton.isDisplayed()

         where:
          ProgramTitleValue | ShortDescriptionValue | DescriptionValue | WebsiteValue
          "Automation Test Program" | "Short Descriptive Text" | "Longer descriptive text" | "https://www.google.com"
      }

  @Unroll
  def "Create Project: '#ProjectNameValue'" () {
      given:
          to HomePage

          waitFor { to ProjectsPage }

          when: "I choose to create a new project"
          ListProjectButton.click()

          then:
          at ProjectCreatePage

          when: "I enter the details for the new project"
          Program = ProgramValue
          ProjectName.value(ProjectNameValue)
          ShortDescription.value(ShortDescriptionValue)
          "Set Description" DescriptionValue
          Github.value(GithubValue)
          Tags.value(TagsValue)
          ActivityLevel.value(ActivityLevelValue)

          and: "I click the 'save changes' button for the project: '#ProjectNameValue'"
          SaveButton.click()


          then:
          waitFor {at ProjectViewPage}
          assert PublishButton

          when: "I click the publish button"
          PublishButton.click()

          then:
          at ProjectViewPage
          assert UnpublishButton
          assert UnpublishButton.isDisplayed()

     where:
      ProjectNameValue | ShortDescriptionValue | DescriptionValue | GithubValue | TagsValue | ActivityLevelValue | ProgramValue
      "Automation Test Project" | "Short Descriptive Text" | "Longer descriptive text" | "https://github.com/BCDevExchange" | "javascript,html,mongo" | "" | "Automation Test Program"
  }


  def "Publish Opportunity: '#TitleData'" () {
      given: "I have created an opportunity"
          to HomePage

          waitFor { to OpportunitiesPage }

          when: "I choose to post an opportunity"

          postAnOpportunity
          at OpportunitiesAdminCreateLandingPage

          and: "I choose a 'code with us' opportunity"
          // Choose to post a "Code With Us" Opportunity
          createCWUOpportunityClick
          at OpportunitiesAdminCreatePage

          // Fill in initial details
          //@todo if there is only one project in the DB, there will not be a dropdown.
          selectProject.project = Project //Project
          TitleData = TitleData + ": " + RandomID
          oppTitle.value(TitleData) //Title
          oppTeaser.value(Teaser) //teaser
          oppGithub.value(Github) //Github location

          BackgroundTabClick

          "Add Description" Description

          DetailsTabClick

          selectLocation.location = Location //Location
          selectOnsite.onsite = Onsite //On site Requirements

          oppEmail.value(Email)
          oppEmail << Keys.chord(Keys.TAB)
          // Dates are automatically generated based on current date

          // "Set All Dates"()

          selectEarn.earn = Earn //Fixed Price-Reward

          AcceptanceTabClick

          "Add Acceptance Criteria"(AcceptanceCriteria)
          "Add Proposal Criteria"(ProposalCriteria)
          oppSkills.value(Skills) //Skills

          //@todo there's a race and nothing sensible to wait on
          Thread.sleep(3000)

          and: "I click the 'save changes' button for the opportunity: '#TitleData'"
          SaveButton.click()

          then: "all information on the proposal page has been saved to the relevant database locations"
          waitFor { at OpportunityDetailPage }

          then: "the proposal is in the unpublished state and has the title #TitleData"
          assert { unPublished }

          assert { oppDetailTitle.contains(TitleData) }

          and: "when published, a confirmation window is displayed"
          oppPublishClick
        //   waitFor { page.angularReady && oppubYesClick }
        //   assert { published }
     where:
      Project | TitleData | Teaser | Description | Github | Location | Onsite | Skills | AcceptanceCriteria | Earn | ProposalCriteria | Email
      "Automation Test Project" | "Opportunity Creation/Publish/Deletion Test" | "Short Description" | "Some Description" | "https://github.com/rstens/devex.git" | "Victoria" | "onsite" | "Java, JS, css, html, django, python, postgressql" | "Acceptance Criteria" | "\$20,000.00" | "Proposal Evaluation Criteria" | "roland.stens@gmail.com"
  }
}
