#!/bin/bash
if [[ "$OSTYPE" == 'msys' ]]; then
    pwdPath="/${PWD}"
else
    pwdPath=`pwd`
fi
echo "Current working directory is " $pwdPath
docker stop db_devex
docker start db_devex
# check for a running container before stopping it
MEAN_PID=$(docker ps -a -q -f "name=mean_devex")
if [[ -n $MEAN_PID ]]; then
    docker stop mean_devex
fi
docker run \
-p 3000:3000 \
-p 9229:9229 \
-p 5858:5858 \
-p 35729:35729 \
-v $pwdPath/config:/opt/mean.js/config \
-v $pwdPath/modules:/opt/mean.js/modules \
-v $pwdPath/public:/opt/mean.js/public \
-v $pwdPath/uploads:/opt/mean.js/uploads \
-e "MAILER_SERVICE_PROVIDER=gggmail" \
-e "MAILER_FROM=<Email>" \
-e "MAILER_EMAIL_ID=<Email>" \
-e "MAILER_PASSWORD=<Password>" \
-e "NODE_ENV=${NODE_ENV-development}" \
-e "MONGO_SEED=${MONGO_SEED-true}" \
-e "DISABLE_WATCH=${DISABLE_WATCH-}" \
-e "GITHUB_ID=your_oauth_github_id" \
-e "GITHUB_SECRET=your_oauth_github_secret" \
-e "MONGO_SEED_LOG_RESULTS=${MONGO_SEED_LOG_RESULTS-true}" \
-e "DEVEX_PROD=${DEVEX_PROD-false}" \
-e "DOMAIN=http://localhost:3000" \
-e "DEV_ADMIN_PWD=adminadmin" \
-e "DEV_USER_PWD=useruser" \
-e "DEV_DEV_PWD=devdev" \
-e "DEV_DEV2_PWD=devdev" \
-e "DEV_GOV_PWD=govgov" \
-ti --rm --link db_devex --name mean_devex mean/devex ${@:-bash}
