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
           echo "SONARQUBE_PWD: ${SONARQUBE_PWD}"

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
	 openshiftTag destStream: 'devxp', verbose: 'true', destTag: '$BUILD_ID', srcStream: 'devxp', srcTag: 'latest'
	 openshiftTag destStream: 'devxp', verbose: 'true', destTag: 'dev', srcStream: 'devxp', srcTag: 'latest'
    }
	
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
			  
			echo "TEST_USERNAME: ${TEST_USERNAME}"
			echo "TEST_PASSWORD: ${TEST_PASSWORD}"

            sh './gradlew --debug --stacktrace phantomJsTest -DTEST_USERNAME = "${TEST_USERNAME}" -DTEST_PASSWORD = "${TEST_PASSWORD}"'
      }
   }
}


stage('deploy-test') {
  input "Deploy to test?"
  
  node('master'){
     openshiftTag destStream: 'devxp', verbose: 'true', destTag: 'test', srcStream: 'devxp', srcTag: '$BUILD_ID'
  }
}

stage('deploy-prod') {
  input "Deploy to prod?"
  node('master'){
     openshiftTag destStream: 'devxp', verbose: 'true', destTag: 'prod', srcStream: 'devxp', srcTag: '$BUILD_ID'
  }
  
}

