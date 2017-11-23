//define functions

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
// oc policy add-role-to-user view -z system:serviceaccount:devex-platform-tools:jenkins -n devex-platform-dev
// oc policy add-role-to-user view -z system:serviceaccount:devex-platform-tools:jenkins -n devex-platform-test
// oc policy add-role-to-user view -z system:serviceaccount:devex-platform-tools:jenkins -n devex-platform-prod


node('maven') {

    stage('checkout') {
       echo "checking out source"
       echo "Build: ${BUILD_ID}"
       checkout scm
    }

    stage('code quality check') {
           SONARQUBE_PWD = sh (
             script: 'oc env dc/sonarqube --list | awk  -F  "=" \'/SONARQUBE_ADMINPW/{print $2}\'',
             returnStdout: true
              ).trim()
           //echo "SONARQUBE_PWD: ${SONARQUBE_PWD}"

           SONARQUBE_URL = sh (
               script: 'oc get routes -o wide --no-headers | awk \'/sonarqube/{ print match($0,/edge/) ?  "https://"$2 : "http://"$2 }\'',
               returnStdout: true
                  ).trim()
           echo "SONARQUBE_URL: ${SONARQUBE_URL}"

           dir('sonar-runner') {
            sh returnStdout: true, script: "./gradlew sonarqube -Dsonar.host.url=${SONARQUBE_URL} -Dsonar.verbose=true --stacktrace --info  -Dsonar.sources=.."
           }
    }
	
    stage('build') {
	    echo "Building..."
	    openshiftBuild bldCfg: 'devxp', showBuildLogs: 'true'
	    openshiftVerifyBuild bldCfg: 'devxp', checkForTriggeredDeployments: 'false', namespace: 'devex-platform-tools', verbose: 'false'
	    echo ">>>> Build Complete"
	    openshiftTag destStream: 'devxp', verbose: 'true', destTag: '$BUILD_ID', srcStream: 'devxp', srcTag: 'latest'
	    openshiftTag destStream: 'devxp', verbose: 'true', destTag: 'dev', srcStream: 'devxp', srcTag: 'latest'
	    openshiftVerifyDeployment depCfg: 'platform-dev', namespace: 'devex-platform-dev', replicaCount: 1, verbose: 'false', verifyReplicaCount: 'false'
	    echo ">>>> Deployment Complete"
	    //openshiftVerifyService svcName: 'platform-dev', namespace: 'devex-platform-dev'
	    //echo ">>>> Service Verification Complete"
    }
 
    try {
	stage('validation') {
          dir('functional-tests'){
		TEST_USERNAME = sh (
             script: 'oc env bc/devxp --list | awk  -F  "=" \'/TEST_USERNAME/{print $2}\'',
             returnStdout: true
              ).trim()
			  
		TEST_PASSWORD = sh (
             script: 'oc env bc/devxp --list | awk  -F  "=" \'/TEST_PASSWORD/{print $2}\'',
             returnStdout: true
              ).trim()
			  
	//		echo "TEST_USERNAME: ${TEST_USERNAME}"
	//		echo "TEST_PASSWORD: ${TEST_PASSWORD}"

            sh "export TEST_USERNAME=${TEST_USERNAME}\nexport TEST_PASSWORD=${TEST_PASSWORD}\n./gradlew --debug --stacktrace phantomJsTest"
          }
	}
    } finally {
	    archiveArtifacts allowEmptyArchive: true, artifacts: 'functional-tests/build/reports/**/*'
    }
}

stage('deploy-test') {	
  timeout(time: 1, unit: 'DAYS') {
	  input message: "Deploy to test?", submitter: 'mark-a-wilson-view,paulroberts68-view'
  }
  node('master') {
	  openshiftTag destStream: 'devxp', verbose: 'true', destTag: 'test', srcStream: 'devxp', srcTag: '$BUILD_ID'
	  openshiftVerifyDeployment depCfg: 'platform-test', namespace: 'devex-platform-test', replicaCount: 1, verbose: 'false', verifyReplicaCount: 'false'
	  echo ">>>> Deployment Complete"
	  //openshiftVerifyService svcName: 'platform-test', namespace: 'devex-platform-test'
	  //echo ">>>> Service Verification Complete"
	  mail (to: 'paul.a.roberts@gov.bc.ca,mark.wilson@gov.bc.ca,chris.coldwell@gmail.com,angelika.ehlers@gov.bc.ca',
           subject: "FYI: Job '${env.JOB_NAME}' (${env.BUILD_NUMBER}) deployed to test", 
           body: "Changes:\n" + getChangeString() + "\n\nSee ${env.BUILD_URL} for details. ");
  }
}

//stage('deploy-prod') {
//  timeout(time: 1, units: 'DAYS') {
//	  input message: "Deploy to prod?", submitter: 'mark-a-wilson-view,paulroberts68-view'
//  }
//  node('master'){
//     openshiftTag destStream: 'devxp', verbose: 'true', destTag: 'prod', srcStream: 'devxp', srcTag: '$BUILD_ID'
//     mail (to: 'paul.a.roberts@gov.bc.ca,mark.wilson@gov.bc.ca,chris.coldwell@gmail.com,angelika.ehlers@gov.bc.ca',
//           subject: "FYI: Job '${env.JOB_NAME}' (${env.BUILD_NUMBER}) deployed to production",
//           body: "Changes:\n" + getChangeString() + "\n\nSee ${env.BUILD_URL} for details. ");
//  }
