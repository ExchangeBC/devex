FROM ubuntu:18.04
LABEL maintainer=MEAN.JS

# 80 = HTTP, 443 = HTTPS, 3000 = MEAN.JS server, 9229 = node debugger, 35729 = livereload
EXPOSE 80 443 3000 9229 35729

# Set development environment as default
ENV NODE_ENV development

# Install Utilities
RUN apt-get update -q  \
    && apt-get install -yqq \
    apt-utils \
    curl \
    wget \
    aptitude \
    htop \
    vim \
    git \
    traceroute \
    dnsutils \
    ssh \
    tree \
    tcpdump \
    nano \
    psmisc \
    gcc \
    make \
    build-essential \
    libfreetype6 \
    libfontconfig \
    libkrb5-dev \
    ruby \
    sudo \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install dumb-init
RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64.deb
RUN dpkg -i dumb-init_*.deb

# Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
RUN sudo DEBIAN_FRONTEND=noninteractive apt-get install -yq nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install yarn (replaces npm)
RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update -q \
    && sudo DEBIAN_FRONTEND=noninteractive apt-get install -yq yarn \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install MEAN.JS Prerequisites
RUN yarn global add gulp yo mocha karma-cli gulp-if --silent \
    && yarn cache clean

RUN mkdir -p /opt/mean.js/public/lib
WORKDIR /opt/mean.js

# Copies the local package.json file to the container
# and utilities docker container cache to not needing to rebuild
# and install node_modules/ everytime we build the docker, but only
# when the local package.json file changes.
# Install npm packages
COPY package.json yarn.lock /opt/mean.js/

# Install node_modules with yarn
RUN yarn install --non-interactive --pure-lockfile \
    && yarn cache clean

COPY . /opt/mean.js

# Do not fail when there is no build script
RUN npm run build --if-present

# Run MEAN.JS server
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npm", "start"]
