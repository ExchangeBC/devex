#!/bin/bash

docker run -p 3030:3000 -p 5858:5858 -p 35729:35729 \
-v `pwd`/config:/opt/mean.js/config \
-v `pwd`/modules:/opt/mean.js/modules \
-v `pwd`/public:/opt/mean.js/public \
-v `pwd`/uploads:/opt/mean.js/uploads \
-ti --rm --link db_devex mean/devex bash

# -v `pwd`:/opt/mean.js \
# -ti --rm --link db_devex mean/devex bash

# user FT9uq4nbk8mxJdBEx67rGqAHSC9RYBd
# admin dwJ2y1VFHhFUZdwCknys9C2BF4vD2tJgEQRe7p9

