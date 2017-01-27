h1. How to configure a OpenShift for EPIC (and EPIC like critters)

h2. Project Set Initialization

- Request that your friendly neighbourhood DevOps Lead provision a set of OpenShift projects to house your applications CI/CD tooling as well as deployment environments.  Typically this set consists of 'tools', 'dev', 'test', and 'prod' projects.  Collectively, this is referred to as a "Project Set". Note that "Project Set" is a fabricated term (there is no such construct in OpenShift or Kubernetes) used to describe two or more OpenShift projects that relate to the same app/project.  For reference, the script that is typically used by the DevOps Lead is located [here](https://github.com/BCDevOps/openshift-tools/blob/master/provisioning/create-env.sh)
- The projects will follow a naming convention similar to <team_name>-<product_name>-<environment_name>. For example, 'devex-platform-tools' would be the 'tools' environment for the platform product, owned by a devex team.
- One or more of your team members will be assigned as 'admin' permission on your Project Set and will be responsible for managing team members' access to each project via OpenShift tools.
- The 'tools' project will house the OpenShift BuildConfiguration for your app, and also likely a Jenkins instance that will be responsible for promoting application images (via OpenShift ImageStreamTagS) across your deployment environments. 

h2. Build and CI/CD Promotion Pipeline Setup

- To create the BuildConfiguration within your 'tools' project, use the ```oc``` command and "esm-build-template.json" file in the templates directory as follows

```
oc process -f devex-build-template.json -v NAME=<product_name> -v SOURCE_REPOSITORY_URL=https://github.com/BCDevExchange/devex.git -v SOURCE_REPOSITORY_REF=<branch>| oc create -n <team_name>-<product_name>-tools -f - 
```

For example:

```
oc process -f devex-build-template.json -v NAME=devxp -v SOURCE_REPOSITORY_URL=https://github.com/BCDevExchange/devex.git -v SOURCE_REPOSITORY_REF=master | oc create -n devex-platform-tools -f -
```

- Configure the access controls to allow the deployment environment projects to pull images from the 'tools' project:

```
oc policy add-role-to-user system:image-puller system:serviceaccount:<team_name>-<product_name>-<environment_name>:default -n <team_name>-<product_name>-tools 
```

For example:

```
oc policy add-role-to-user system:image-puller system:serviceaccount:devex-platform-dev:default -n devex-platform-tools
oc policy add-role-to-user system:image-puller system:serviceaccount:devex-platform-test:default -n devex-platform-tools
oc policy add-role-to-user system:image-puller system:serviceaccount:devex-platform-prod:default -n devex-platform-tools

```

h2. Jenkins Setup

- Deploy a Jenkins instance (with persistent storage) into your 'tools' project using the OpenShift web gui; accept the defaults, or specific your own values when prompted.
- Log into Jenkins using the generated admin password, or one you provided in the step above.
- Install the Promoted Builds Jenkins plugin
- @todo describe the recommended job configuation
- In each promotion configuration, tag the target build's image to the appropriate promotion level; this was done using a shell command because the OpenShift plugins do not appear to handle parameter subsitution inside promotions properly.

- Configure the access controls to allow the OpenShift service account that the Jenkins instance runs as to manipulate its own project contents:
 
```
oc policy add-role-to-user edit system:serviceaccount:<team_name>-<product_name>-tools:default -n <team_name>-<product_name>-tools
```

h2. Deployment Environment Configuration
 
- Use the JSON files in this directory  and `oc` tool to create the necessary deployment resources (DeploymentConfig, PersistentVolumeClaims) within each deployment project:

```
oc process -f devex-environment-template.json -v NAME=<project_name>-<env>,APPLICATION_DOMAIN=<project_name>-<env>.<domain>,APP_IMAGE_NAMESPACE=<team_name>-<product_name>-tools,APP_IMAGE_NAME=<product_na,e>,APP_DEPLOYMENT_TAG=<environment_name>,DOCUMENT_VOLUME_CAPACITY=<doc_storage_space>,DATABASE_VOLUME_CAPACITY=<db_storage_space>| oc create -n -n <team_name>-<product_name>-<environment> -f -
```

For example:

```
oc process -f devex-environment-template.json -v NAME=platform-dev,APPLICATION_DOMAIN=platform-dev.pathfinder.gov.bc.ca,APP_IMAGE_NAMESPACE=devex-platform-tools,APP_IMAGE_NAME=devxp,APP_DEPLOYMENT_TAG=dev,DOCUMENT_VOLUME_CAPACITY=1Gi,DATABASE_VOLUME_CAPACITY=5Gi | oc create -n devex-platform-dev -f -
oc process -f devex-environment-template.json -v NAME=platform-test,APPLICATION_DOMAIN=platform-test.pathfinder.gov.bc.ca,APP_IMAGE_NAMESPACE=devex-platform-tools,APP_IMAGE_NAME=devxp,APP_DEPLOYMENT_TAG=test,DOCUMENT_VOLUME_CAPACITY=1Gi,DATABASE_VOLUME_CAPACITY=5Gi | oc create -n devex-platform-test -f -
oc process -f devex-environment-template.json -v NAME=platform-prod,APPLICATION_DOMAIN=platform-prod.pathfinder.gov.bc.ca,APP_IMAGE_NAMESPACE=devex-platform-tools,APP_IMAGE_NAME=devxp,APP_DEPLOYMENT_TAG=prod,DOCUMENT_VOLUME_CAPACITY=1Gi,DATABASE_VOLUME_CAPACITY=5Gi | oc create -n devex-platform-prod -f -
```

h1. platform Environments

There are several environments set up for different purposes within OpenShift. They are available at the URLs below.

|Environment| URL |Notes|
|-----------|-----|-----|
|DEV|esm-dev.pathfinder.gov.bc.ca||
|TEST|esm-test.pathfinder.gov.bc.ca||
|PROD|projects.eao.gov.bc.ca|SiteMinder is enabled for this environment|

h1. How to access Jenkins for ESM

- Login to https://esm-jenkins-esm.pathfinder.gov.bc.ca with the username/password that was provided to you.

h1. How to access OpenShift for ESM

h2. Web UI
- Login to https://console.pathfinder.gov.bc.ca:8443; you'll be prompted for GitHub authorization.

h2. Command-line (```oc```) tools
- Download OpenShift [command line tools](https://github.com/openshift/origin/releases/download/v1.2.1/openshift-origin-client-tools-v1.2.1-5e723f6-mac.zip), unzip, and add ```oc``` to your PATH.  
- Copy command line login string from https://console.pathfinder.gov.bc.ca:8443/console/command-line.  It will look like ```oc login https://console.pathfinder.gov.bc.ca:8443 --token=xtyz123xtyz123xtyz123xtyz123```
- Paste the login string into a terminal session.  You are no authenticated against OpenShift and will be able to execute ```oc``` commands. ```oc -h``` provides a summary of available commands.

h1. Project contents

- The "esm" project contains the Jenkins instance and the other esm-* projects contain different "environments".  The names are self-explanatory.

h1. Data management operations

Document load (from legacy EPIC -> *new EPIC*)

```oc rsh <app-pod> bash -c 'cd scripts && MONGO_CONNECTION=mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_PORT_27017_TCP_ADDR}/esm DOWNLOADS_DIR=/uploads ./run.sh'```

Count documents

```oc rsh <mongo-pod> bash -c 'mongo -u ${MONGODB_USER} -p ${MONGODB_PASSWORD} --eval "printjson(db.documents.count())" esm'```

Connect to database as admin

```oc rsh <mongo-pod> 
mongo -u admin -p ${MONGODB_ADMIN_PASSWORD} admin
```

Drop database

- Connect as admin (see above)

```
use esm
db.dropDatabase()
```

h1. Background reading/Resources

[Free OpenShift book](https://www.openshift.com/promotions/for-developers.html) from RedHat – good overview

[Red Hat Container Development Kit](http://developers.redhat.com/products/cdk/overview/)
 
OpenShift CI/CD pieline Demos:

- https://www.youtube.com/watch?v=65BnTLcDAJI
- https://www.youtube.com/watch?v=wSFyg6Etwx8
 

  

   
