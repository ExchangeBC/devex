// define constants
def BUILDCFG_NAME ='devxp-dev'
def IMAGE_NAME = 'devxp-dev'
def DEV_DEPLOYMENT_NAME = 'platform-dev'
def DEV_TAG_NAME = 'dev'
def DEV_NS = 'devex-platform-dev'
def TST_DEPLOYMENT_NAME = 'platform-test'
def TST_TAG_NAME = 'test'
def TST_BCK_TAG_NAME = 'test-previous'
def TST_NS = 'devex-platform-test'


import groovy.json.JsonOutput
def notifySlack(text, channel, url, attachments) {
    def slackURL = url
    def jenkinsIcon = 'https://wiki.jenkins-ci.org/download/attachments/2916393/logo.png'
    def payload = JsonOutput.toJson([text: text,
        channel: channel,
        username: "Jenkins",
        icon_url: jenkinsIcon,
        attachments: attachments
    ])
    def encodedReq = URLEncoder.encode(payload, "UTF-8")
    sh("curl -s -S -X POST " +
            "--data \'payload=${encodedReq}\' ${slackURL}")    
}

@NonCPS
def getChangeString() {
  MAX_MSG_LEN = 512
  def changeString = ""
  def changeLogSets = currentBuild.changeSets
  for (int i = 0; i < changeLogSets.size(); i++) {
     def entries = changeLogSets[i].items
     for (int j = 0; j < entries.length; j++) {
         def entry = entries[j]
         truncated_msg = entry.msg.take(MAX_MSG_LEN)
         changeString += " - ${truncated_msg} [${entry.author}]\n"
     }
  }
  if (!changeString) {
     changeString = "No changes"
  }
  return changeString
}

// pipeline

// Note: openshiftVerifyDeploy requires policy to be added:
// oc policy add-role-to-user view system:serviceaccount:devex-platform-tools:jenkins -n devex-platform-dev
// oc policy add-role-to-user view system:serviceaccount:devex-platform-tools:jenkins -n devex-platform-test
// oc policy add-role-to-user view system:serviceaccount:devex-platform-tools:jenkins -n devex-platform-prod

properties([[$class: 'BuildDiscarderProperty', strategy: [$class: 'LogRotator', artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '10']]])

node('maven') {

    stage('checkout') {
       echo "checking out source"
       echo "Build: ${BUILD_ID}"
       checkout scm
    }
    stage('dependency check') {
          dir('owasp') {
            // sh 'wget http://dl.bintray.com/jeremy-long/owasp/dependency-check-3.1.2-release.zip'
            sh './dependency-check/bin/dependency-check.sh --project "Developers Exchange" --scan ../package.json --enableExperimental --enableRetired'
            sh 'rm -rf ./dependency-check/data/'
            publishHTML (target: [
                                allowMissing: false,
                                alwaysLinkToLastBuild: false,
                                keepAll: true,
                                reportDir: './',
                                reportFiles: 'dependency-check-report.html',
                                reportName: "OWASP Dependency Check Report"
                          ])
          }
    }
    stage('code quality check') {

          //  SONARQUBE_URL = sh (
          //      script: 'oc get routes -o wide --no-headers | awk \'/sonarqube/{ print match($0,/edge/) ?  "https://"$2 : "http://"$2 }\'',
          //      returnStdout: true
          //         ).trim()
          //  echo "SONARQUBE_URL: ${SONARQUBE_URL}"
          //  dir('sonar-runner') {
          //   sh returnStdout: true, script: "./gradlew sonarqube -Dsonar.host.url=${SONARQUBE_URL} \
          //   -Dsonar.verbose=true --stacktrace --info -Dsonar.projectName=Devex.Dev -Dsonar.branch=develop \
          //   -Dsonar.projectKey=org.sonarqube:bcgov-devex-dev" 
          //  }

      // ================================================================================================
      // SonarQube Scanner Settings
      // ------------------------------------------------------------------------------------------------

      // The name of the SonarQube route.  Used to dynamically get the URL for SonarQube.
      def SONAR_ROUTE_NAME = 'sonarqube'

      // The namespace in which the SonarQube route resides.  Used to dynamically get the URL for SonarQube.
      // Leave blank if the pipeline is running in same namespace as the route.
      def SONAR_ROUTE_NAMESPACE = 'devex-platform-tools'

      // The name of your SonarQube project
      def SONAR_PROJECT_NAME = 'Devex.Dev'

      // The project key of your SonarQube project
      def SONAR_PROJECT_KEY = 'org.sonarqube:bcgov-devex-dev'

      // The base directory of your project.
      // This is relative to the location of the `sonar-runner` directory within your project.
      // More accurately this is relative to the Gradle build script(s) that manage the SonarQube Scanning
      def SONAR_PROJECT_BASE_DIR = '../'

      // The source code directory you want to scan.
      // This is relative to the project base directory.
      def SONAR_SOURCES = './'
      // ================================================================================================

      // Gets the URL associated to a named route.
      // If you are attempting to access a route outside the local namespace (the namespace in which this script is running)
      // The Jenkins service account from the local namespace will need 'view' access to the remote namespace.
      // For example:
      // Using the oc cli directly:
      //   oc policy add-role-to-user view system:serviceaccount:devex-von-bc-registries-agent-tools:jenkins -n view devex-von-tools
      // Or using the openshift-developer-tools (https://github.com/BCDevOps/openshift-developer-tools) sripts:
      //   assignRole.sh -u system:serviceaccount:devex-von-bc-registries-agent-tools:jenkins -r view devex-von-tools
      @NonCPS
      String getUrlForRoute(String routeName, String projectNameSpace = '') {

        def nameSpaceFlag = ''
        if(projectNameSpace?.trim()) {
          nameSpaceFlag = "-n ${projectNameSpace}"
        }
        
        def url = sh (
          script: "oc get routes ${nameSpaceFlag} -o wide --no-headers | awk \'/${routeName}/{ print match(\$0,/edge/) ?  \"https://\"\$2 : \"http://\"\$2 }\'",
          returnStdout: true
        ).trim()

        return url
      }

      @NonCPS
      String getSonarQubePwd() {

        sonarQubePwd = sh (
          script: 'oc env dc/sonarqube --list | awk  -F  "=" \'/SONARQUBE_ADMINPW/{print $2}\'',
          returnStdout: true
        ).trim()

        return sonarQubePwd
      }

      // The jenkins-python3nodejs template has been purpose built for supporting SonarQube scanning.
      podTemplate(
        label: 'jenkins-python3nodejs',
        name: 'jenkins-python3nodejs',
        serviceAccount: 'jenkins',
        cloud: 'openshift',
        containers: [
          containerTemplate(
            name: 'jnlp',
            image: '172.50.0.2:5000/openshift/jenkins-slave-python3nodejs',
            resourceRequestCpu: '1000m',
            resourceLimitCpu: '2000m',
            resourceRequestMemory: '2Gi',
            resourceLimitMemory: '4Gi',
            workingDir: '/tmp',
            command: '',
            args: '${computer.jnlpmac} ${computer.name}'
          )
        ]
      ){
        node('jenkins-python3nodejs') {

          stage('Checkout Source') {
            echo "Checking out source code ..."
            checkout scm
          }

          stage('SonarQube Analysis') {
            echo "Performing static SonarQube code analysis ..."

            SONARQUBE_URL = getUrlForRoute(SONAR_ROUTE_NAME, SONAR_ROUTE_NAMESPACE).trim()
            SONARQUBE_PWD = getSonarQubePwd().trim()
            echo "URL: ${SONARQUBE_URL}"
            echo "PWD: ${SONARQUBE_PWD}"

            // The `sonar-runner` MUST exist in your project and contain a Gradle environment consisting of:
            // - Gradle wrapper script(s)
            // - A simple `build.gradle` file that includes the SonarQube plug-in.
            //
            // An example can be found here:
            // - https://github.com/BCDevOps/sonarqube
            dir('sonar-runner') {
              // ======================================================================================================
              // Set your SonarQube scanner properties at this level, not at the Gradle Build level.
              // The only thing that should be defined at the Gradle Build level is a minimal set of generic defaults.
              //
              // For more information on available properties visit:
              // - https://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner+for+Gradle
              // ======================================================================================================
              sh (
                returnStdout: true,
                script: "./gradlew sonarqube --stacktrace --info \
                  -Dsonar.verbose=true \
                  -Dsonar.host.url=${SONARQUBE_URL} \
                  -Dsonar.projectName='${SONAR_PROJECT_NAME}' \
                  -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                  -Dsonar.projectBaseDir=${SONAR_PROJECT_BASE_DIR} \
                  -Dsonar.sources=${SONAR_SOURCES}"
              )
            }
          }
        }
      }
    }

    stage('build') {
	    echo "Building..."
	    openshiftBuild bldCfg: BUILDCFG_NAME, verbose: 'false', showBuildLogs: 'true'
            sleep 5
	    // openshiftVerifyBuild bldCfg: BUILDCFG_NAME
            echo ">>> Get Image Hash"
            IMAGE_HASH = sh (
              script: """oc get istag ${IMAGE_NAME}:latest -o template --template=\"{{.image.dockerImageReference}}\"|awk -F \":\" \'{print \$3}\'""",
                returnStdout: true).trim()
            echo ">> IMAGE_HASH: ${IMAGE_HASH}"
	    echo ">>>> Build Complete"
    }
    stage('Dev deploy') {
	    echo ">>> Tag ${IMAGE_HASH} with ${DEV_TAG_NAME}"
 	    openshiftTag destStream: IMAGE_NAME, verbose: 'false', destTag: DEV_TAG_NAME, srcStream: IMAGE_NAME, srcTag: "${IMAGE_HASH}"
            sleep 5
	    openshiftVerifyDeployment depCfg: DEV_DEPLOYMENT_NAME, namespace: DEV_NS, replicaCount: 1, verbose: 'false', verifyReplicaCount: 'false'
	    echo ">>>> Deployment Complete"
	    notifySlack("Dev Deploy, changes:\n" + getChangeString(), "#builds", "https://hooks.slack.com/services/${SLACK_TOKEN}", [])
    }
}

def owaspPodLabel = "owasp-zap-${UUID.randomUUID().toString()}"
podTemplate(label: owaspPodLabel, name: owaspPodLabel, serviceAccount: 'jenkins', cloud: 'openshift', containers: [
  containerTemplate(
    name: 'jnlp',
    image: '172.50.0.2:5000/openshift/jenkins-slave-zap',
    resourceRequestCpu: '500m',
    resourceLimitCpu: '1000m',
    resourceRequestMemory: '3Gi',
    resourceLimitMemory: '4Gi',
    workingDir: '/home/jenkins',
    command: '',
    args: '${computer.jnlpmac} ${computer.name}'
  )
]) {
     stage('ZAP Security Scan') {
        node(owaspPodLabel) {
          sleep 60
          def retVal = sh returnStatus: true, script: '/zap/zap-baseline.py -r baseline.html -t http://platform-dev.pathfinder.gov.bc.ca/'
          publishHTML([allowMissing: false, alwaysLinkToLastBuild: false, keepAll: true, reportDir: '/zap/wrk', reportFiles: 'baseline.html', reportName: 'ZAP Baseline Scan', reportTitles: 'ZAP Baseline Scan'])
          echo "Return value is: ${retVal}"
        }
     }
  }

// stage('Functional Test Dev') {
//   // def userInput = 'y'
//   def podlabel = "devxp-bddstack-${UUID.randomUUID().toString()}"
//   // try {
//   //   timeout(time: 1, unit: 'DAYS') {
//   //     userInput = input(
//   //                   id: 'userInput', message: 'Run Functional Tests (y/n - Default: y) ?', 
// 	//             parameters: [[$class: 'TextParameterDefinition', defaultValue: 'y', description: 'BDDTest', name: 'BDDTest']
//   //                 ])
//   //   }
//   // } catch(err) {}
//   // echo ("BDD Test Run: "+userInput)
//   // if ( userInput == 'y' ) {
//     podTemplate(label: podlabel, name: podlabel, serviceAccount: 'jenkins', cloud: 'openshift', 
//     volumes: [
// 	    emptyDirVolume(mountPath:'/dev/shm', memory: true)
//     ],
//     containers: [
//       containerTemplate(
//         name: 'jnlp',
//         image: '172.50.0.2:5000/openshift/jenkins-slave-bddstack',
//         resourceRequestCpu: '500m',
//         resourceLimitCpu: '2000m',
//         resourceRequestMemory: '2Gi',
//         resourceLimitMemory: '8Gi',
//         workingDir: '/home/jenkins',
//         command: '',
//         args: '${computer.jnlpmac} ${computer.name}',
//         envVars: [
//             envVar(key:'BASEURL', value: 'http://platform-dev.pathfinder.gov.bc.ca/')
//         ]
//       )
//     ]) {
//       node(podlabel) {
// 	      //the checkout is mandatory, otherwise functional test would fail
//         echo "checking out source"
//         checkout scm
// 	      //sleep 1000
//         dir('functional-tests') {
//             try {
//               sh './gradlew chromeHeadlessTest'
//             } finally { 
//               archiveArtifacts allowEmptyArchive: true, artifacts: 'build/reports/**/*'
//               archiveArtifacts allowEmptyArchive: true, artifacts: 'build/test-results/**/*'
//               junit 'build/test-results/**/*.xml'
//               publishHTML (target: [
//                                 allowMissing: false,
//                                 alwaysLinkToLastBuild: false,
//                                 keepAll: true,
//                                 reportDir: 'build/reports/spock',
//                                 reportFiles: 'index.html',
//                                 reportName: "BDD Spock Report"
//                           ])
//               publishHTML (target: [
//                                 allowMissing: false,
//                                 alwaysLinkToLastBuild: false,
//                                 keepAll: true,
//                                 reportDir: 'build/reports/tests/chromeHeadlessTest',
//                                 reportFiles: 'index.html',
//                                 reportName: "Full Test Report"
//                           ])  
// 	    }
//         }
//      }}
//    // }
// }
	
stage('deploy-test') {	
  timeout(time: 1, unit: 'DAYS') {
	  input message: "Deploy to test?", submitter: 'mark-a-wilson-view,paulroberts68-view,agehlers-admin,SteveChapmanBCDX-admin,sutherlanda-admin'
  }
  node('master') {
	  echo ">>> Tag ${TST_TAG_NAME} with ${TST_BCK_TAG_NAME}"
	  openshiftTag destStream: IMAGE_NAME, verbose: 'false', destTag: TST_BCK_TAG_NAME, srcStream: IMAGE_NAME, srcTag: TST_TAG_NAME
          echo ">>> Tag ${IMAGE_HASH} with ${TST_TAG_NAME}"
	  openshiftTag destStream: IMAGE_NAME, verbose: 'false', destTag: TST_TAG_NAME, srcStream: IMAGE_NAME, srcTag: "${IMAGE_HASH}"
          sleep 5
	  openshiftVerifyDeployment depCfg: TST_DEPLOYMENT_NAME, namespace: TST_NS, replicaCount: 1, verbose: 'false', verifyReplicaCount: 'false'
	  echo ">>>> Deployment Complete"
	  notifySlack("Test Deploy, changes:\n" + getChangeString(), "#builds", "https://hooks.slack.com/services/${SLACK_TOKEN}", [])
  }
}
