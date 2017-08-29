node('maven') {

    stage('checkout') {
       echo "checking out source"
       echo "Build: ${BUILD_ID}"
       checkout scm
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

            sh "./gradlew --debug --stacktrace phantomJsTest -DTEST_USERNAME=${TEST_USERNAME} -DTEST_PASSWORD=${TEST_PASSWORD}"
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

