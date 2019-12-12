import geb.spock.GebReportingSpec
import geb.Page

import java.text.SimpleDateFormat
import static java.util.Calendar.*

import pages.app.HomePage
import pages.app.OpportunitiesPage
import pages.app.OpportunitiesAdminCreateLandingPage
import pages.app.OpportunitiesAdminCreateSWUPage

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

        @Unroll   //Not actually necessary if we are using only single set of data (ie, creating only one SWU opportunity)
            def "Create SWU Opportunity: '#TitleData'" () {
                //Assignements in the beginning
                // This section set and format the dates
                Calendar calendar= Calendar.getInstance()
                SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd")

                calendar.add(Calendar.DATE,3)//Define the deadline for applications (set to 3 days from today)
                def deadline=calendar.getTime()  
                def Formatted_deadline=format.format( deadline )
                def Formatted_deadline_Year=deadline.year +1900 //Year start counting from 1900
                def Formatted_deadline_Month=deadline.month +1 //Month start counting from 0
                def Formatted_deadline_Day=deadline.date

                calendar.add(Calendar.DATE,21)//Define the date the opportunity is assigned (set to 21 + 3 days from today)
                def assignment=calendar.getTime() 
                def Formatted_assignment=format.format(assignment)
                def Formatted_assignment_Year=assignment.year +1900 //Year start counting from 1900
                def Formatted_assignment_Month=assignment.month +1 //Month start counting from 0
                def Formatted_assignment_Day=assignment.date

                calendar.add(Calendar.DATE,21)//Define the date for the end of the Inception Phase (set to 21+ 21 + 3 days from today)
                def endInception=calendar.getTime() 
                def Formatted_InceptionEnd=format.format(endInception)
                def Formatted_InceptionEnd_Year=endInception.year +1900 //Year start counting from 1900
                def Formatted_InceptionEnd_Month=endInception.month +1 //Month start counting from 0
                def Formatted_InceptionEnd_Day=endInception.date

                calendar.add(Calendar.DATE,21)//Define the date the end of the POC Phase (set to 21+ 21 +21 + 3 days from today)
                def endPOC=calendar.getTime() 
                def Formatted_PrototypeEnd=format.format(endPOC)
                def Formatted_PrototypeEnd_Year=endPOC.year +1900 //Year start counting from 1900
                def Formatted_PrototypeEnd_Month=endPOC.month +1 //Month start counting from 0
                def Formatted_PrototypeEnd_Day= endPOC.date

                calendar.add(Calendar.DATE,21)//Define the date the end of the Implementation Phase(set to 21 +21+ 21 +21 + 3 days from today)
                def endImplementation=calendar.getTime() 
                def Formatted_ImplementationEnd=format.format(endImplementation)
                def Formatted_ImplementationEnd_Year=endImplementation.year +1900 //Year start counting from 1900
                def Formatted_ImplementationEnd_Month=endImplementation.month +1 //Month start counting from 0
                def Formatted_ImplementationEnd_Day=endImplementation.date

                def  MyTitleData = TitleData + ": " + RandomID

                given: "Already logged as Administrator, go to Opportunities Page. Program and Project already exists"
                    waitFor { to OpportunitiesPage }

                when: "I click on 'Post and opportunity' button to create a new opportunity- Program and Project alredy exists"
                    waitFor { PostAnOpportunity.click()}

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

                        //Setting the proposal Deadline
                        proposalDeadLine.firstElement().clear()  //clean the field from the preselected date
                        proposalDeadLine << Formatted_deadline_Year.toString() //write the year
                        proposalDeadLine << Keys.ARROW_RIGHT  // move right to the month
                        proposalDeadLine << Formatted_deadline_Month.toString()
                        proposalDeadLine << Keys.ARROW_RIGHT  //move right to the day
                        proposalDeadLine << Formatted_deadline_Day.toString() 
                
                        //Setting the proposal Assignment
                        proposalAssignment.firstElement().clear()  //clean the field from the preselected date
                        proposalAssignment << Formatted_assignment_Year.toString() //write the year
                        proposalAssignment<< Keys.ARROW_RIGHT  // move right to the month
                        proposalAssignment<< Formatted_assignment_Month.toString()
                        proposalAssignment << Keys.ARROW_RIGHT  //move right to the day
                        proposalAssignment << Formatted_assignment_Day.toString() 

                and: "Move to the Phases tab to enter the dates for the different phases"
                    PhasesTabClick
                        //sleep(1000)
                        CapabilityInceptionTgl.click() //Click on the Capability on the Inception Phase
                        //Setting dates for Inception phase. Use the Assigment date as the start of Inception phase                
                        InceptionStartDate.firstElement().clear()  //clean the field from the preselected date
                        InceptionStartDate << Formatted_assignment_Year.toString() //write the year
                        InceptionStartDate<< Keys.ARROW_RIGHT  // move right to the month
                        InceptionStartDate<< Formatted_assignment_Month.toString()
                        InceptionStartDate << Keys.ARROW_RIGHT  //move right to the day
                        InceptionStartDate << Formatted_assignment_Day.toString() 

                        InceptionCompleteDate.firstElement().clear()  //clean the field from the preselected date
                        InceptionCompleteDate << Formatted_InceptionEnd_Year.toString() //write the year
                        InceptionCompleteDate << Keys.ARROW_RIGHT  // move right to the month
                        InceptionCompleteDate << Formatted_InceptionEnd_Month.toString()
                        InceptionCompleteDate << Keys.ARROW_RIGHT  //move right to the day
                        InceptionCompleteDate << Formatted_InceptionEnd_Day.toString() 


                        CapabilityProofOfConceptTgl.click() //Click on the Capability on the Proof of concept Phase
                        //Setting dates for Proof of Concept phase. Use the Formatted_InceptionEnd date  the start of Proof of Concept phase                
                        PrototypeStartDate.firstElement().clear()  //clean the field from the preselected date
                        PrototypeStartDate << Formatted_InceptionEnd_Year.toString() //write the year
                        PrototypeStartDate << Keys.ARROW_RIGHT  // move right to the month
                        PrototypeStartDate << Formatted_InceptionEnd_Month.toString()
                        PrototypeStartDate << Keys.ARROW_RIGHT  //move right to the day
                        PrototypeStartDate << Formatted_InceptionEnd_Day.toString() 

                        PrototypeEndDate.firstElement().clear()  //clean the field from the preselected date
                        PrototypeEndDate << Formatted_PrototypeEnd_Year.toString() //write the year
                        PrototypeEndDate << Keys.ARROW_RIGHT  // move right to the month
                        PrototypeEndDate << Formatted_PrototypeEnd_Month.toString()
                        PrototypeEndDate << Keys.ARROW_RIGHT  //move right to the day
                        PrototypeEndDate << Formatted_PrototypeEnd_Day.toString() 
                   
                        CapabilityImplementationTgl.click() //Click on the Capability for Implementation Phase
                        //Setting dates for Implementation phase. Use the Formatted_PrototypeEnd date  the start of Proof of Concept phase                
                        ImplementationStartDate.firstElement().clear()  //clean the field from the preselected date
                        ImplementationStartDate << Formatted_PrototypeEnd_Year.toString() //write the year
                        ImplementationStartDate << Keys.ARROW_RIGHT  // move right to the month
                        ImplementationStartDate << Formatted_PrototypeEnd_Month.toString()
                        ImplementationStartDate << Keys.ARROW_RIGHT  //move right to the day
                        ImplementationStartDate << Formatted_PrototypeEnd_Day.toString() 

                        ImplementationEndDate.firstElement().clear()  //clean the field from the preselected date
                        ImplementationEndDate << Formatted_ImplementationEnd_Year.toString() //write the year
                        ImplementationEndDate << Keys.ARROW_RIGHT  // move right to the month
                        ImplementationEndDate << Formatted_ImplementationEnd_Month.toString()
                        ImplementationEndDate << Keys.ARROW_RIGHT  //move right to the day
                        ImplementationEndDate << Formatted_ImplementationEnd_Day.toString() 

                and: "Move to the Preferred Technical Skills tab to enter the dates for the different phases"
                    TechnicalSkillTabClick
                        waitFor{Skill0.click()}  //There are three skill, select the three of them
                        Skill1.click()
                        Skill2.click()

                and: "Move to the Budget tab to enter the budget numbers"
                    BudgetTabClick
                        waitFor{MaxBudgetTotal.value(BudgetTotal)}
                        MaxBudgetInception.value(BudgetInc)
                        MaxBudgetPOC.value(BudgetPOC)
                        MaxBudgetImplementation.value(BudgetImpl)

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
                    def MyCurrentURL=getCurrentUrl() //URL opportunity page
                    waitFor{TestSWUOpportunities[0].click()}  //it clicks on the first opportunity of the list
                    sleep(3000) //Giving some time so it can later grab the correct URL
                    //The following is to create from the opp title the URL
                    def OppURL= MyCurrentURL + "/swu/opp-" + MyTitleData.replaceAll(' ','-').replaceAll(':','-').toLowerCase()
                    def NewURL=getCurrentUrl() //This is the specific opportunity URL

                then: "Publish the newly created opportunity"
                    assert NewURL==OppURL  //matching the URL
                    sleep(1000)//ok, call it paranoid behaviour, but I do not fully trust waitFor
                    assert waitFor{$("a",'data-automation-id':"button-opportunity-publish")}
                    $("a",'data-automation-id':"button-opportunity-publish").click()  //Finally, we publish the opp
                    //And then click Yes in the modal box that appears after clicking the Publish button
                    $("button",'data-automation-id':"button-modal-yes").click()


     where: "The values used to create the Opportunity are:"
      Project | TitleData | Teaser | Background | Github | Location | Onsite | BudgetTotal | BudgetInc | BudgetPOC|BudgetImpl | AdditionalTerms | Question | Addenda
      "Project: Automation Test Project 1" | "SWU Opportunity" | "Teaser for Automation Test Opportunity 1" | "Background for Automation Test Opportunity 1" | "https://github.com" | "Burnaby" | "onsite" | 1000000 | 100000| 300000 | 600000 | "Additional Terms for this SWU proposal" | "Stat rosa pristina nomine, nomina nuda tenemus?" | "Addenda for SWU opportunity"
  }


    def teardown(){
        to HomePage
        //I get the base URL to build (in the LoginModule) the URL to the admin icon
        def baseURL = getBrowser().getConfig().getBaseUrl().toString()

        // Login off as an admin
        def  logoffOK=login."Logout as administrator"(baseURL)
        assert logoffOK
    }

}
