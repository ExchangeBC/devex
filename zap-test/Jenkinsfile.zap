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
         dir('/zap') {
                def retVal = sh returnStatus: true, script: '/zap/zap-baseline.py -r baseline.html -t http://platform-dev.pathfinder.gov.bc.ca/'
                publishHTML([allowMissing: false, alwaysLinkToLastBuild: false, keepAll: true, reportDir: '/zap/wrk', reportFiles: 'baseline.html', reportName: 'ZAP Baseline Scan', reportTitles: 'ZAP Baseline Scan'])
                echo "Return value is: ${retVal}"

                def json = '''\
                            {"channel": "#ci-cd-release-info", "username": "webhookbot", "text": "devex-dev ZAP Baseline Scan.", "icon_emoji": ":ghost:"}
                           '''
                sh "curl -X POST --data-urlencode "payload=${json}" https://hooks.slack.com/services/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
         }
       }
     }
   }
