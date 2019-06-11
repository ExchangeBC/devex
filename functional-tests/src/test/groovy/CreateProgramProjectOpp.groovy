import geb.spock.GebReportingSpec
import geb.Page

import java.text.SimpleDateFormat
import static java.util.Calendar.*

import pages.app.HomePage
import pages.app.OpportunitiesPage
import pages.app.OpportunitiesAdminCreatePage
import pages.app.OpportunitiesAdminCreateLandingPage
import pages.app.OpportunityDetailPage
import pages.app.ProgramsPage
import pages.app.ProgramCreatePage
import pages.app.ProgramViewPage 
import pages.app.ProjectsPage
import pages.app.ProjectCreatePage
import pages.app.ProjectViewPage

import geb.module.RadioButtons
import org.openqa.selenium.By
import org.openqa.selenium.Keys

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title
import spock.lang.Ignore
import spock.lang.Stepwise


@Narrative('''The test will simulate an Administrator creating, in this order, a Program, a Project and one Opportunity.
They are required as preconditions for other tests.
 ''')
@Stepwise //Order is important, as the second element of the list must be deleted first

@Title("Create and publish projects, programs, and opportunities")
class CreateProgramProjectOpp extends GebReportingSpec {

    static def RandomID = UUID.randomUUID().toString()
    
    def setup() {
        to HomePage
        // Need to log as an admin
        def  loginOK= login."Login As An Administrator"("admin","adminadmin","Admin Local")
        assert loginOK
    }

    @Unroll // Not actually necessary if we are using only single set of data (ie, creating only one program)
    def "Create Program: '#ProgramTitleValue'" () {
        given: "After login as Administrator, I go to the Programs Page"
            waitFor { to ProgramsPage }

        when: "Click on the Programs button"
            waitFor{ListProgramButton}
            ListProgramButton.click()

        then: "And open the Create Program page"
            waitFor { at ProgramCreatePage }

        when: "Enter the details for the new program"
            ProgramTitle.value(ProgramTitleValue)
            ShortDescription.value(ShortDescriptionValue)
            waitFor{ ProgramDescriptionBox }
            // Note: the 'body' is inside an iframe. To identify the iframe I use the title because the id changes depending on the browser we are using.
            withFrame(ProgramDescriptionBox) { $("body", id:"tinymce") << DescriptionValue }
            Website.value(WebsiteValue)

        and: "Click the 'Save Changes' button for the program: '#ProgramTitleValue'"
            SaveButton.click()

        then: "After Saving, the Programs View Page should be displayed and the Publish button show be there"
            waitFor { at ProgramViewPage }
            assert waitFor{PublishButton}

        when: "Click the publish button"
            PublishButton.click()

        then: "The Program View Page reloadas with am 'Unpublish' button"
            assert UnpublishButton.isDisplayed()

        where: "The following values are used to populate the Program"
            ProgramTitleValue | ShortDescriptionValue | DescriptionValue | WebsiteValue
            "Program: Automation Test 1" | "Short Descriptive Program: Automation Test 1" | "Long description Program: Automation Test 1" | "https://www.google.com"
    }

    @Unroll  // Not actually necessary if we are using only single set of data (ie, creating only one project)
    def "Create Project: '#ProjectNameValue'" () {
        given: "Already logged as Administrator, go to Projects page"
            waitFor { to ProjectsPage }

        when: "Click on 'List a Project' button to create a new project- Program alredy exists"
            waitFor{ListProjectButton.click()}

        then: "Load the Create Project page"
            waitFor{at ProjectCreatePage}

        when: "Enter the details for the new project"
            Program = ProgramValue
            ProjectName.value(ProjectNameValue)
            ShortDescription.value(ShortDescriptionValue)
            
            waitFor { ProjectDescriptionBox }
            // Note: the 'body' is inside an iframe. To identify the iframe I use the title because the id changes depending on the browser we are using.
            withFrame(ProjectDescriptionBox){ $("body", id:"tinymce") << DescriptionValue }

            // sleep(3000) //Makes no sense, but without this sleep it does not work
            waitFor { Github }
            Github.value(GithubValue)
            Tags.value(TagsValue)
            waitFor { ActivityLevel }
            ActivityLevel.value(ActivityLevelValue)

        and: "Click the 'Save Changes' button for the project: '#ProjectNameValue'"
            waitFor{ SaveButton }
            SaveButton.click()

        then: "I arrive to the Projects View Page, and verify the Publish button exists"
            waitFor { at ProjectViewPage }
            assert waitFor { PublishButton }

        when: "I click the publish button"
            waitFor { PublishButton.click() }

        then:"The Unpublish button exists and it is displayed"
            at ProjectViewPage
            assert waitFor { UnpublishButton }
            assert UnpublishButton.isDisplayed()

        where: "The values used to create the Project are:"
            ProjectNameValue | ShortDescriptionValue | DescriptionValue | GithubValue | TagsValue | ActivityLevelValue | ProgramValue
            "Project: Automation Test Project 1" | "Short Descriptive for Automation Test Project 1" | "Longer descriptive for Automation Test Project 1" | "https://github.com/BCDevExchange" | "javascript,html,mongo" | "3" | "Program: Automation Test 1"
    }

    @Unroll   // Not actually necessary if we are using only single set of data (ie, creating only one opportunity)
    def "Publish Opportunity: '#TitleData'" () {
        // This section set and format the dates 
        Calendar calendar = Calendar.getInstance()
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd")

        calendar.add(Calendar.DATE,3)
        def deadline = calendar.getTime()  // Define the deadline for applications (set to 3 days from today)
        def Formatted_deadline = format.format( deadline )
        def Formatted_deadline_Year = deadline.year +1900 // Year start counting from 1900
        def Formatted_deadline_Month = deadline.month +1 // Month start counting from 0
        def Formatted_deadline_Day = deadline.date

        calendar.add(Calendar.DATE,21)
        def assignment = calendar.getTime() // Define the date the oppoortunity is assigned (set to 21 + 3 days from today)
        def Formatted_assignment = format.format(assignment)
        def Formatted_assignment_Year = assignment.year +1900 // Year start counting from 1900
        def Formatted_assignment_Month = assignment.month +1 // Month start counting from 0
        def Formatted_assignment_Day = assignment.date

        calendar.add(Calendar.DATE,21)
        def start = calendar.getTime()   // Define the start date for the work (set to 21+21+3 days from today)
        def Formatted_start = format.format(start)
        def Formatted_start_Year = start.year +1900 // Year start counting from 1900
        def Formatted_start_Month = start.month +1 // Month start counting from 0
        def Formatted_start_Day = start.date

        def  MyTitleData = TitleData + ": " + RandomID

        given: "Already logged as Administrator, go to Opportunities Page. Program and Project already exists"
            waitFor { to OpportunitiesPage }

        when: "I click on 'Post and opportunity' button to create a new opportunity- Program and Project alredy exists"
            PostAnOpportunity.click()

        then: "I load the Landing Page that allows to create a CWU or SWU opportunity"
            waitFor { at OpportunitiesAdminCreateLandingPage }

        and: "Click on the Get Started button under CWU"  
            waitFor { createCWUOpportunityButton }
            createCWUOpportunityButton.click()
            waitFor { at OpportunitiesAdminCreatePage }

        and: "Set the title,teaser, description... and other details of the opportunity "
            ProjectSelector.value(Project)
            OppTitleTextInput.value(MyTitleData)
            OppTeaserInput.value(Teaser)
            OppGithubInput.value(Github)

            // Now we move to the Background tab  
            BackgroundTab.click()
            waitFor { OppBackgroundBox }
            // Note: the 'body' is inside an iframe. To identify the iframe I use the title because the id changes depending on the browser we are using.
            // There are three iframes in the OpportunitiesAdminCreatePage, this one is the 0, if order of the iframes change, then redo the element identifiers
            withFrame(OppBackgroundBox) { $("body", id:"tinymce") << Background }

            DetailsTab.click()
            waitFor{LocationRadioButton(Onsite).click()}
            LocationSelector.value(Location)
            selectEarn.value(Earn)

            // Setting the proposal Deadline
            ProposalDeadlineInput.firstElement().clear()  // clean the field from the preselected date
            ProposalDeadlineInput << Formatted_deadline_Year.toString() // write the year
            ProposalDeadlineInput << Keys.ARROW_RIGHT  // move right to the month
            ProposalDeadlineInput << Formatted_deadline_Month.toString()
            ProposalDeadlineInput << Keys.ARROW_RIGHT  // move right to the day
            ProposalDeadlineInput << Formatted_deadline_Day.toString() 
        
            // Setting the proposal Assignment
            ProposalAssignmentInput.firstElement().clear()  // clean the field from the preselected date
            ProposalAssignmentInput << Formatted_assignment_Year.toString() // write the year
            ProposalAssignmentInput << Keys.ARROW_RIGHT  // move right to the month
            ProposalAssignmentInput << Formatted_assignment_Month.toString()
            ProposalAssignmentInput << Keys.ARROW_RIGHT  // move right to the day
            ProposalAssignmentInput << Formatted_assignment_Day.toString() 

            // Setting the proposal StartDate
            proposalStartDate.firstElement().clear()  // clean the field from the preselected date
            proposalStartDate << Formatted_start_Year.toString() //write the year
            proposalStartDate << Keys.ARROW_RIGHT  // move right to the month
            proposalStartDate << Formatted_start_Month.toString()
            proposalStartDate << Keys.ARROW_RIGHT  // move right to the day
            proposalStartDate << Formatted_start_Day.toString() 

            AcceptanceTab.click() // Now we move to the Acceptance and Evaluation tab  
            waitFor { OppAcceptanceBox }
            // Note: the 'body' is inside an iframe. To identify the iframe I use the title because the id changes depending on the browser we are using.
            // There are three iframes in the OpportunitiesAdminCreatePage, this one is the 1, if order of the iframes change, then redo the element identifiers
            withFrame(OppAcceptanceBox){ $("body", id:"tinymce") << AcceptanceCriteria }
            sleep(1000)
            waitFor{ ProposalAcceptanceBox }
            // Note: the 'body' is inside an iframe. To identify the iframe I use the title because the id changes depending on the browser we are using.
            // There are three iframes in the OpportunitiesAdminCreatePage, this one is the 2, if order of the iframes change, then redo the element identifiers
            withFrame(ProposalAcceptanceBox){ $("body", id:"tinymce") << ProposalCriteria }
            sleep(1000)
            oppSkills.value(Skills) // Skills
            sleep(1000)

        and: "I click the 'save changes' button for the opportunity: '#TitleData'"
            SaveButton.click()  // This action saves the changes but does not change the page
            sleep(3000) // This makes no sense given the next waitFor, but without it, then fails

        then: "Go to the opportunities page to publish it"
            waitFor { to OpportunitiesPage }

        and: "Click on the newly created opportunity (still unpublished)"
            def MyCurrentURL = getCurrentUrl()
            TestCWUOpportunities[0].click()
            sleep(1000)
            // The following is to create from the opp title the URL
            def OppURL = MyCurrentURL + "/cwu/opp-" + MyTitleData.replaceAll(' ','-').replaceAll(':','-').toLowerCase()
            def NewURL = getCurrentUrl()
    
        then: "Open the newly created opportunity"      
            assert NewURL == OppURL
            assert waitFor { PublishButton }
        
        and: "Finally, we publish the opp by clicking the Publish button"
            PublishButton.click()
        
        and: "And then click Yes in the modal box to confirmn"
            ModalConfirmButton.click()
            
        where: "The values used to create the Opportunity are:"
            Project | TitleData | Teaser | Background | Github | Location | Onsite | Skills | AcceptanceCriteria | Earn | ProposalCriteria | Email
            "Project: Automation Test Project 1" | "CWU Opportunity" | "Teaser for Automation Test Opportunity 1" | "Background for Automation Test Opportunity 1" | "https://github.com" | "Burnaby" | "onsite" | "Java, JS, css, html, django, python, postgressql" | "Acceptance Criteria Automation Test Opportunity 1" | "\$20,000.00" | "Proposal Evaluation Criteria Automation Test Opportunity 1" | "crochcunill@gmail.com"
    }

    def teardown() {
        to HomePage
        def  logoffOK=login."Logout as user"()
        assert logoffOK
    }
}
