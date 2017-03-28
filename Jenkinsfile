node('master') {
  stage('build') {
         echo "Building..."

         openshiftBuild apiURL: '', authToken: '', bldCfg: 'devxp', buildName: '', checkForTriggeredDeployments: 'false', commitID: '', namespace: '', showBuildLogs: 'true', verbose: 'false', waitTime: '', waitUnit: 'sec'
  }
  stage('validate') {
      echo "Testing..."
  }
}
stage('approve') {
    input "Deploy to prod?"
}
