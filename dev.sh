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
-p 3030:3000 \
-p 5858:5858 \
-p 35729:35729 \
-p 9229:9229 \
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
-e "GITHUB_ID=3d819dee8be7237af9ee" \
-e "GITHUB_SECRET=e3f26152b2d04e7877e1a57a07ea1d6bab63da18" \
-e "MONGO_SEED_LOG_RESULTS=${MONGO_SEED_LOG_RESULTS-true}" \
-e "DEVEX_PROD=${DEVEX_PROD-false}" \
-e "DOMAIN=http://localhost:3030" \
-ti --rm --link db_devex --name mean_devex mean/devex ${@:-bash}

# after run sh dev.sh
# and run MAILER_SERVICE_PROVIDER="gmail" MAILER_FROM="<email>" MAILER_EMAIL_ID="<email>" MAILER_PASSWORD="<password>" NODE_ENV=development  nodejs

# -v `pwd`:/opt/mean.js \
# -ti --rm --link db_devex mean/devex bash


# user FT9uq4nbk8mxJdBEx67rGqAHSC9RYBd
# admin dwJ2y1VFHhFUZdwCknys9C2BF4vD2tJgEQRe7p9

