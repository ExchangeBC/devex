#!/bin/bash
docker stop db_devex
docker start db_devex
docker run -p 3030:3000 -p 5858:5858 -p 35729:35729 \
-v `pwd`/config:/opt/mean.js/config \
-v `pwd`/modules:/opt/mean.js/modules \
-v `pwd`/public:/opt/mean.js/public \
-v `pwd`/uploads:/opt/mean.js/uploads \
-e "MAILER_SERVICE_PROVIDER=gmail" \
-e "MAILER_FROM=<Email>" \
-e "MAILER_EMAIL_ID=<Email>" \
-e "MAILER_PASSWORD=<Password>" \
-e "NODE_ENV=development" \
-e "MONGO_SEED=true" \
-ti --rm --link db_devex mean/devex bash

# after run sh dev.sh
# and run MAILER_SERVICE_PROVIDER="gmail" MAILER_FROM="<email>" MAILER_EMAIL_ID="<email>" MAILER_PASSWORD="<password>" NODE_ENV=development  nodejs

# -v `pwd`:/opt/mean.js \
# -ti --rm --link db_devex mean/devex bash

# user FT9uq4nbk8mxJdBEx67rGqAHSC9RYBd
# admin dwJ2y1VFHhFUZdwCknys9C2BF4vD2tJgEQRe7p9

