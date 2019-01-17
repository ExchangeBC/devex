import geb.spock.GebReportingSpec
import geb.Page

import java.text.SimpleDateFormat

import pages.app.HomePage

import pages.app.OpportunitiesPage
import pages.app.OpportunitiesAdminCreatePage
import pages.app.OpportunitiesAdminCreateLandingPage
import pages.app.OpportunityDetailPage
import pages.app.OpportunitiesAdminEditPage

import pages.app.ProgramsPage
import pages.app.ProgramCreatePage
//import pages.app.ProgramViewPage 
import pages.app.ProjectsPage
import pages.app.ProjectCreatePage

import pages.app.SignedIn

import geb.module.RadioButtons
import org.openqa.selenium.By
import org.openqa.selenium.Keys
//import extensions.AngularJSAware

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title

class ProgramViewPage2 extends Page  {    
    static at = { title.startsWith("BCDevExchange - The BC Developer") }
	static url = "programs/pro-program-automation-test-1"
 
	static content = {
        PublishButton2{ $('a[data-automation-id ~= "button-program-publish"]') }  
        EditButton { $('button[data-automation-id ~= "button-program-edit"]') }
        UnpublishButton { $('a[data-automation-id ~= "button-program-unpublish"]') }
        RequestMembershipButton { $('button[data-automation-id ~= "button-program-request-membership"]') }
    }
}


 class ProjectViewPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer") } 
    static url = "programs/prj-project-automation-test-project-1"  

	static content = {
        EditButton { $('button[data-automation-id ~= "button-project-edit"]') }
        PublishButton { $('a[data-automation-id ~= "button-project-publish"]') }  
        UnpublishButton { $('a[data-automation-id ~= "button-project-unpublish"]') }
        RequestMembershipButton { $('button[data-automation-id ~= "button-project-request-membership"]') }
    }
}




@Title("Create and publish projects, programs, and opportunities")
class OpportunityCreateSpecs extends GebReportingSpec {

    static def RandomID = UUID.randomUUID().toString()
    

        def setup() {
            to HomePage

            // Need to login as an admin
            def  loginOK= login."Login As An Administrator"("admin","adminadmin","Admin Local")
            assert loginOK
        }
/*
        @Unroll
        def "Create Program: '#ProgramTitleValue'" () {
            given: "After login as Administrator, I go to the Programs Page"
                waitFor { to ProgramsPage }

            when: "I click on the Programs button"
                ListProgramButton.click()

            then: "And open the Create Program page"
                at ProgramCreatePage

            when: "I enter the details for the new program"
                ProgramTitle.value(ProgramTitleValue)
                ShortDescription.value(ShortDescriptionValue)
                "Set Description" DescriptionValue
                Website.value(WebsiteValue)

            and: "I click the 'save changes' button for the program: '#ProgramTitleValue'"
                SaveButton.click()

            then: "After Saving, the Programs View Page should be displayed and the Publish button show be there"
                waitFor { at ProgramViewPage2 }
                to ProgramViewPage2 //Not sure if to keep this line
                assert PublishButton2
    
            when: "I click the publish button"
                PublishButton2.click()

            then: "The Program View Page reloadas with am 'Unpublish' button"
                waitFor { at ProgramViewPage2 }
                assert UnpublishButton
                assert UnpublishButton.isDisplayed()

            where: "The following values are used to populate the Program"
                ProgramTitleValue | ShortDescriptionValue | DescriptionValue | WebsiteValue
                "Program: Automation Test 1" | "Short Descriptive Program: Automation Test 1" | "Long description Program: Automation Test 1" | "https://www.google.com"
        }

        @Unroll
        def "Create Project: '#ProjectNameValue'" () {
            given: "Already logged as Administrator, go to Projects page"

                waitFor { to ProjectsPage }

            when: "I click on 'List a Project' button to create a new project- Program alredy exista"
                ListProjectButton.click()

            then: "I load the Create Project page"
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
                sleep(1000)
                SaveButton.click()
                reportInfo("URL inmediately after save is ${driver.currentUrl}"  )
                sleep(1000)

            then: "I arrive to the Projects View Page, and verify the Publish button exists"
                waitFor {at ProjectViewPage}
                reportInfo("URL after loading ProjectViewPage  is ${driver.currentUrl}"  )
                //to ProjectViewPage

            reportInfo("URL after insisting loading ProjectViewPage is ${driver.currentUrl}"  )
                assert PublishButton

            when: "I click the publish button"
                PublishButton.click()

            then:"The Unpublish button exists and it is displayed"
                at ProjectViewPage
                assert UnpublishButton
                assert UnpublishButton.isDisplayed()

            where: "The values used to create the Project are:"
                ProjectNameValue | ShortDescriptionValue | DescriptionValue | GithubValue | TagsValue | ActivityLevelValue | ProgramValue
                "Project: Automation Test Project 1" | "Short Descriptive for Automation Test Project 1" | "Longer descriptive for Automation Test Project 1" | "https://github.com/BCDevExchange" | "javascript,html,mongo" | "" | "Program: Automation Test 1"
        }

*/

        @Unroll
            def "Publish Opportunity: '#TitleData'" () {
                //Assignements in the beginning
                // This section set and format the dates 
                Calendar calendar= Calendar.getInstance()
                SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd")

                calendar.add(Calendar.DATE,3)
                def deadline=calendar.getTime()  //Define the deadline for applications (set to 3 days from today)
                def Formatted_deadline=format.format( deadline )

                calendar.add(Calendar.DATE,21)
                def assignment=calendar.getTime() //Define the date the oppoortunity is assigned (set to 21 + 3 days from today)
                def Formatted_assignment=format.format(assignment)

                calendar.add(Calendar.DATE,21)
                def start=calendar.getTime()   //Define the start date for the work (set to 21+21+3 days from today)
                def Formatted_start=format.format(start)


                def  MyTitleData = TitleData + ": " + RandomID
                reportInfo("Variable a is :"  + TitleData  )
                reportInfo("Variable a is ${MyTitleData}"  )
                reportInfo("Description is :" + Description )


            given: "Already logged as Administrator, go to Opportunities Page. Program and Project already exists"
        
            waitFor { to OpportunitiesPage }

            when: "I click on 'Post and opportunity' button to create a new opportunity- Program and Project alredy exists"
                    PostAnOpportunity.click()


            then: "I load the Landing Page that allows to create a CWU or SWU opportunity"
                at OpportunitiesAdminCreateLandingPage
                reportInfo("URL line 197 is ${driver.currentUrl}"  )
            and: "Click on the Get Started button under CWU"  

                createCWUOpportunityButton.click()
                sleep(100)
                at OpportunitiesAdminCreatePage

            // Fill in initial details
            // We are assuming there is only one project
            
            // and it already selected by default
            // We are in the Header tab
            //selectProject.project = Project //Project
            reportInfo("URL line 210 is ${driver.currentUrl}"  )
            oppTitle.value(MyTitleData) //Title
            oppTeaser.value(Teaser) //teaser
            oppGithub.value(Github) //Github location

            //Now we move to the Background tab  
            BackgroundTabClick
            sleep(1000)
            reportInfo("URL line 218 is ${driver.currentUrl}"  )
            reportInfo("Description is (2nd time):" + Description  )

    //next line need to be executed, but I amn having problems right now
             "Add Description" Description
            

            //Now we move to the Details tab   
            DetailsTabClick
                //next line need to be executed, but I amn having problems right now
                //selectOnsite(Onsite) //On site Requirements
    
                selectLocation.value(Location)
                selectEarn.value(Earn)

                //No Email field in the current incarnation of the application
                // oppEmail.value(Email)
                // oppEmail << Keys.chord(Keys.TAB)
                assert proposalDeadLine.attr("name")== "deadline"

                reportInfo("Deadline name:" + proposalDeadLine.attr("name") )
                reportInfo("Deadline value:" + proposalDeadLine.value() )
                reportInfo("Formatted_deadline value:" + Formatted_start )


/*
I have the suspicion the ng-not-empty directive is interfeering with geb capabily of writting the date

<input type="text" id="title" name="title"       class="form-control  ng-pristine ng-valid ng-empty ng-touched" ng-model="ngModel" placeholder="Opportunity Title" style="">      
<input type="date" id="deadline" name="deadline" class="form-control  ng-pristine ng-valid ng-not-empty ng-touched" ng-model="ngModel" style="">
*/

            proposalDeadLine.value('2019-02-27')

            reportInfo("Deadline value -after-:" + proposalDeadLine.value() )

            proposalAssignment.value(Formatted_assignment)
            proposalStartDate.value(Formatted_start)
  
             sleep(5000)
            // Dates are automatically generated based on current date
            // "Set All Dates"()



            //Now we move to the Acceptance and Evaluatio tab  
          AcceptanceTabClick
            //next two lines need to work
            //  "Add Acceptance Criteria"(AcceptanceCriteria)
            //  "Add Proposal Criteria"(ProposalCriteria)
            
         
            oppSkills.value(Skills) //Skills

            //@todo there's a race and nothing sensible to wait on
            Thread.sleep(3000)





          and: "I click the 'save changes' button for the opportunity: '#TitleData'"
          SaveButton.click()


/*
          when: "I enter the details for the new project"
            Program = ProgramValue
            ProjectName.value(ProjectNameValue)
            ShortDescription.value(ShortDescriptionValue)
            "Set Description" DescriptionValue
            Github.value(GithubValue)
            Tags.value(TagsValue)
            ActivityLevel.value(ActivityLevelValue)

          and: "I click the 'save changes' button for the project: '#ProjectNameValue'"
            reportInfo("URL Before save is ${driver.currentUrl}"  )
            sleep(1000)
            SaveButton.click()
            reportInfo("URL inmediately after save is ${driver.currentUrl}"  )
            sleep(1000)
 

          then: "I arrive to the Projects View Page, and verify the Publish button exists"
            waitFor {at ProjectViewPage}
            reportInfo("URL after loading ProjectViewPage  is ${driver.currentUrl}"  )
            //to ProjectViewPage




            reportInfo("URL after insisting loading ProjectViewPage is ${driver.currentUrl}"  )
            assert PublishButton



          when: "I click the publish button"
            PublishButton.click()

          then:"The Unpublish button exists and it is displayed"
            at ProjectViewPage
            assert UnpublishButton
            assert UnpublishButton.isDisplayed()







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

          // oppEmail.value(Email)
          // oppEmail << Keys.chord(Keys.TAB)
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
 
 
 








*/


     where: "The values used to create the Opportunity are:"
      Project | TitleData | Teaser | Description | Github | Location | Onsite | Skills | AcceptanceCriteria | Earn | ProposalCriteria | Email
      "Project: Automation Test Project 1" | "Opportunity: Automation Test Opportunity 1" | "Short Description Automation Test Opportunity 1" | "Long Description Automation Test Opportunity 1" | "https://github.com/crochcunill/devex.git" | "Burnaby" | "onsite" | "Java, JS, css, html, django, python, postgressql" | "Acceptance Criteria Automation Test Opportunity 1" | "\$20,000.00" | "Proposal Evaluation Criteria Automation Test Opportunity 1" | "crochcunill@gmail.com"

  
  }


}
