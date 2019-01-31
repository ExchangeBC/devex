import geb.spock.GebReportingSpec
import geb.Page

import java.text.SimpleDateFormat
import static java.util.Calendar.*

import pages.app.HomePage

import pages.app.OpportunitiesPage
import pages.app.OpportunitiesAdminCreateLandingPage
import pages.app.OpportunitiesAdminCreateSWUPage

//import geb.module.RadioButtons
import org.openqa.selenium.By
import org.openqa.selenium.Keys

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title


@Narrative('''The test will simulate an Administrator creating an Opportunity within the SWU context.
It assumes a Program and a Project already exists
They are required as preconditions for other tests.
 ''')


@Title("Create and publish one SWU opportunities")
class CreateOppSWU extends GebReportingSpec {

    static def RandomID = UUID.randomUUID().toString()

        def setup() {
            to HomePage
            // Need to login as an admin
            def  loginOK= login."Login As An Administrator"("admin","adminadmin","Admin Local")
            assert loginOK
        }

        //def  LocationRadioButton=$(name:"onsite").module(RadioButtons)

        @Unroll   //Not actually necessary if we are using only single set of data (ie, creating only one SWU opportunity)
            def "Create SWU Opportunity: '#TitleData'" () {
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

                given: "Already logged as Administrator, go to Opportunities Page. Program and Project already exists"
                    waitFor { to OpportunitiesPage }

                when: "I click on 'Post and opportunity' button to create a new opportunity- Program and Project alredy exists"
                    PostAnOpportunity.click()

                then: "I load the Landing Page that allows to create a CWU or SWU opportunity"
                    waitFor{at OpportunitiesAdminCreateLandingPage}

                and: "Click on the Get Started button under SWU"
                    waitFor{createSWUOpportunityButton}
                    createSWUOpportunityButton.click()
                    waitFor{at OpportunitiesAdminCreateSWUPage}
    
                and: "Confirm the Header tab is the initially selected one"
                    assert waitFor{HeaderTabClick }

                and: "Set the title,teaser, description.... and other details of the opportunity in the Header tab"
                    waitFor{selectProject.value(Project)}
                    oppTitle.value(MyTitleData) //Title
                    oppTeaser.value(Teaser) //teaser
                    oppGithub.value(Github) //Github location

                and: "Move to the Background tab to enter the Background information"
                    BackgroundTabClick
                    withFrame(OppBackgroundBox){$("body", id:"tinymce") << Background }

                and: "Move to the Details tab to enter the Details information"
                    DetailsTabClick  //Move to the Details tab
                    LocationRadioButton(Onsite).click()
                    selectLocation.value(Location)

                    //I an having problems with the dates, so I am doing nothing at this moment
                    //proposalDeadLine
                    //proposalAssignment

                and: "Move to the Phases tab to enter the dates for the different phases"
                    PhasesTabClick
                    waitFor{CapabilityInceptionTgl.click()} //Click on the Capability for Inception Phase


                    //CapabilityProofOfConceptBtn.click() //Click on the 'Start Here' proof of concept button
                    CapabilityProofOfConceptTgl.click() //Click on the Capability for proof of concept Phase

                    CapabilityImplementationBtn.click() //Click on the 'Start Here' Implementation button
                    CapabilityImplementationTgl.click() //Click on the Capability for Implementation Phase


                and: "Move to the Preferred Technical Skills tab to enter the dates for the different phases"
                    TechnicalSkillTabClick
                    waitFor{Skill0.click()}  //There are three skill, select the three of them
                    Skill1.click()
                    Skill2.click()

                and: "Move to the Budget tab to enter the budget numbers"
                    BudgetTabClick
                    //Because in the Phases tab we clicked on the CapabilityImplementationBtn button, only the Total and Implementation budget lines will appear
                    waitFor{MaxBudgetTotal.value(BudgetTotal)}
                    MaxBudgetImplementation.value(BudgetImpl)
                    //And these two will not appear

                expect: "The budget tab does NOT display the lines for inception and Proof of concept"
                    MaxBudgetInception.empty
                    MaxBudgetPOC.empty

                and: "Move to the Terms and Conditions tabs"
                    TermsTabClick
                    waitFor{ConflictOfInterestCkb.click()}
                    waitFor{DocNonDisclosureCkb.click()}
                    waitFor{RequestForReferencesCkb.click()}
                    withFrame(AdditionalTermsBox){$("body", id:"tinymce") << Background }

                and: "Move to the Questions tab "
                    QuestionsTabClick
                    waitFor{AddNewQuestionBtn.click()}  //It will create a question box
                    waitFor{QuestionBox}
                    withFrame(QuestionBox){$("body", id:"tinymce") << Question}

                and: "Move to the Addenda tab"
                    AddendaTabClick
                    waitFor{AddAddAddenda.click()}
                    withFrame(AddendaBox){$("body", id:"tinymce") << Addenda }

                and: "Move to the Scoring tab"
                    ScoringTabClick
                    waitFor{SkillScore.value(5)}
                    TeamQuestionScore.value(10)
                    CodeChallengeScore.value(20)
                    TeamScenarioScore.value(40)
                    PriceScore.value(25)

                when: "Finally we save the SWU opportunity"
                    waitFor{SaveButton.click()}
                    sleep(3000) //necessary... I assume due to the modal message that indicates successful saving

                then: "Go to the opportunities page to publish it"
                    waitFor{to OpportunitiesPage}

                and: "Click on the newly created opportunity (still unpublished)"
                    //def OppTitle =PublishedOpportunity.text()  //Opportunity title
                    def MyCurrentURL=getCurrentUrl() //URL opportunity page
                    waitFor{FirstListedOpportunity.click()}  //it clicks on the first opportunity of the list
                    sleep(3000) //Giving some time so it can later grab the correct URL
                    //The following is to create from the opp title the URL
                    def OppURL= MyCurrentURL + "/swu/opp-" + MyTitleData.replaceAll(' ','-').replaceFirst(':','').replaceAll(':','-').toLowerCase()
                    def NewURL=getCurrentUrl() //This is the specific opportunity URL

                then: "Publish the newly created opportunity"
                    assert NewURL==OppURL  //matching the URL
                    sleep(1000)
                    assert waitFor{$("a",'data-automation-id':"button-opportunity-publish")}
                    $("a",'data-automation-id':"button-opportunity-publish").click()  //Finally, we publish the opp
                    //And then click Yes in the modal box that appears after clicking the Publish button
                    $("button",'data-automation-id':"button-modal-yes").click()


     where: "The values used to create the Opportunity are:"
      Project | TitleData | Teaser | Background | Github | Location | Onsite | BudgetTotal | BudgetInc | BudgetPOC| BudgetImpl | AdditionalTerms | Question | Addenda
      "Project: Automation Test Project 1" | "Opportunity: Automation Test Opportunity 1" | "Teaser for Automation Test Opportunity 1" | "Background for Automation Test Opportunity 1" | "https://github.com" | "Burnaby" | "onsite" | 1000000 | 100000| 300000 | 600000 | "Additional Terms for this SWU proposal" | "Stat rosa pristina nomine, nomina nuda tenemus?" | "Addenda for SWU opportunity"
  }

/*
        def cleanup(){
            to HomePage
            //I get the base URL to build (in the LoginModule) the URL to the admin icon
            def baseURL = getBrowser().getConfig().getBaseUrl().toString()

            // Login off as an admin
            def  logoffOK=login."Logout as administrator"(baseURL)
            assert logoffOK
        }
*/


}
