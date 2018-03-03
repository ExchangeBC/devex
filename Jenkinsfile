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
	    openshiftVerifyBuild bldCfg: 'devxp'
            echo ">>> Get Image Hash"
            IMAGE_HASH = sh (
               script: 'oc get istag devxp:latest -o template --template="{{.image.dockerImageReference}}"|awk -F "/" \'{print $3}\'',
	       returnStdout: true).trim()
	    echo "IMAGE_HASH: ${IMAGE_HASH}"
	    //sh 'export IMAGE_SHA=$(oc get istag devxp:latest -o template --template="{{.image.dockerImageReference}}"|awk -F "/" \'{print $3}\')'	    
	    //echo ">>> ImageSha: ${IMAGE_SHA} ImageHash: ${IMAGE_HASH}"
	    //sh 'env'
	    echo ">>>> Build Complete"
	    openshiftTag destStream: 'devxp', verbose: 'true', destTag: '$BUILD_ID', srcStream: 'devxp', srcTag: 'latest'
 	    openshiftTag destStream: 'devxp', verbose: 'true', destTag: 'dev', srcStream: 'devxp', srcTag: '$BUILD_ID'
	    openshiftVerifyDeployment depCfg: 'platform-dev', namespace: 'devex-platform-dev', replicaCount: 1, verbose: 'false', verifyReplicaCount: 'false'
	    echo ">>>> Deployment Complete"
	    //openshiftVerifyService svcName: 'platform-dev', namespace: 'devex-platform-dev'
	    //echo ">>>> Service Verification Complete"
    }
}

//See https://github.com/jenkinsci/kubernetes-plugin
podTemplate(label: 'owasp-zap', name: 'owasp-zap', serviceAccount: 'jenkins', cloud: 'openshift', containers: [
  containerTemplate(
    name: 'jnlp',
    image: '172.50.0.2:5000/openshift/jenkins-slave-zap',
    resourceRequestCpu: '500m',
    resourceLimitCpu: '1000m',
    resourceRequestMemory: '3Gi',
    resourceLimitMemory: '4Gi',
    workingDir: '/tmp',
    command: '',
    args: '${computer.jnlpmac} ${computer.name}'
  )
]) {
     node('owasp-zap') {
       stage('Scan Web Application') {
	 sleep 30
         dir('/zap') {
                def retVal = sh returnStatus: true, script: '/zap/zap-baseline.py -r baseline.html -t http://platform-dev.pathfinder.gov.bc.ca/'
                publishHTML([allowMissing: false, alwaysLinkToLastBuild: false, keepAll: true, reportDir: '/zap/wrk', reportFiles: 'baseline.html', reportName: 'ZAP Baseline Scan', reportTitles: 'ZAP Baseline Scan'])
                echo "Return value is: ${retVal}"
         }
       }
     }
   }

node('bddstack') {
	stage('Functional Test') {
	//the checkout is mandatory, otherwise functional test would fail
        echo "checking out source"
        checkout scm
        dir('functional-tests') {
            try {
                sh './gradlew --debug --stacktrace chromeHeadlessTest'
            } finally { 
                archiveArtifacts allowEmptyArchive: true, artifacts: 'build/reports/**/*'
                            archiveArtifacts allowEmptyArchive: true, artifacts: 'build/test-results/**/*'
                            junit 'build/test-results/**/*.xml'
                            publishHTML (target: [
                                allowMissing: false,
                                alwaysLinkToLastBuild: false,
                                keepAll: true,
                                reportDir: 'build/reports/spock',
                                reportFiles: 'index.html',
                                reportName: "BDD Spock Report"
                            ])
                            publishHTML (target: [
                                allowMissing: false,
                                alwaysLinkToLastBuild: false,
                                keepAll: true,
                                reportDir: 'build/reports/tests/chromeHeadlessTest',
                                reportFiles: 'index.html',
                                reportName: "Full Test Report"
                            ])  
		        }
        }
    }
}
	
stage('deploy-test') {	
  timeout(time: 1, unit: 'DAYS') {
	  input message: "Deploy to test?", submitter: 'mark-a-wilson-view,paulroberts68-view,agehlers-admin,scchapma-admin,ccoldwell-admin'
  }
  node('master') {
	  openshiftTag destStream: 'devxp', verbose: 'true', destTag: 'test', srcStream: 'devxp', srcTag: '$BUILD_ID'
	  openshiftVerifyDeployment depCfg: 'platform-test', namespace: 'devex-platform-test', replicaCount: 1, verbose: 'false', verifyReplicaCount: 'false'
	  echo ">>>> Deployment Complete"
	  //openshiftVerifyService svcName: 'platform-test', namespace: 'devex-platform-test'
	  //echo ">>>> Service Verification Complete"
	  mail (to: 'paul.a.roberts@gov.bc.ca,mark.wilson@gov.bc.ca,chris.coldwell@gmail.com,angelika.ehlers@gov.bc.ca,steve.chapman@gov.bc.ca',
           subject: "FYI: Job '${env.JOB_NAME}' (${env.BUILD_NUMBER}) deployed to test", 
           body: "Changes:\n" + getChangeString() + "\n\nSee ${env.BUILD_URL} for details. ");
  }
}
