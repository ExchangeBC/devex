'use strict';

var defaultEnvConfig = require('./default');

module.exports = {
  db: {
    uri: process.env.MONGOHQ_URL || process.env.MONGODB_URI || 'mongodb://' + (process.env.MONGODB_SERVICE_HOST || process.env.DB_DEVEX_PORT_27017_TCP_ADDR || 'localhost') + ':27017' + '/' + (process.env.MONGODB_DATABASE || 'mean-dev'),
    options: {
      user: process.env.MONGODB_USER || '',
      pass: process.env.MONGODB_PASSWORD || '',
      autoReconnect: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000
    },
    // Enable mongoose debug mode
    debug: process.env.MONGODB_DEBUG || false
  },
  sessionCookie: {
    // session expiration is set by default to 1 year (TODO: this is a temporary fix, and needs to be set to a reasonable value, and we need to implement proper timeout handling)
    maxAge: 365 * 24 * (60 * 60 * 1000),
    // maxAge: 2000,
    // httpOnly flag makes sure the cookie is only accessed
    // through the HTTP protocol and not JS/browser
    httpOnly: true,
    // secure cookie should be turned to true to provide additional
    // layer of security so that the cookie is set only when working
    // in HTTPS mode.
    secure: false
  },
  sessionTimeout: process.env.SESSION_TIMEOUT || 300 * 24,
  sessionTimeoutWarning: process.env.SESSION_WARNING || 300 * 24,
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    //
    // cc:logging: modified apache format including internal user identification
    //
    format: 'tiny',
    fileLogger: {
      directoryPath: process.cwd(),
      fileName: 'app.log',
      maxsize: 10*1024*1024,
      maxFiles: 2,
      json: false
    }
  },
  app: {
    title: defaultEnvConfig.app.title + ' - Development Environment'
  },
  facebook: {
    clientID: process.env.FACEBOOK_ID || 'APP_ID',
    clientSecret: process.env.FACEBOOK_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/facebook/callback'
  },
  twitter: {
    clientID: process.env.TWITTER_KEY || 'CONSUMER_KEY',
    clientSecret: process.env.TWITTER_SECRET || 'CONSUMER_SECRET',
    callbackURL: '/api/auth/twitter/callback'
  },
  google: {
    clientID: process.env.GOOGLE_ID || 'APP_ID',
    clientSecret: process.env.GOOGLE_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/google/callback'
  },
  linkedin: {
    clientID: process.env.LINKEDIN_ID || 'APP_ID',
    clientSecret: process.env.LINKEDIN_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/linkedin/callback'
  },
  github: {
    clientID: process.env.GITHUB_ID || 'APP_ID',
    clientSecret: process.env.GITHUB_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/github/callback',
    personalAccessToken: process.env.GITHUB_ACCESS_TOKEN || 'GITHUB_ACCESS_TOKEN'
  },
  // github: {
  //   clientID: process.env.GITHUB_ID || 'fbcf57c13acde5c036c6',
  //   clientSecret: process.env.GITHUB_SECRET || 'c8f0654b5ce9e8af026116b10afa6dfba419f558',
  //   callbackURL: '/api/auth/github/callback'
  // },
  paypal: {
    clientID: process.env.PAYPAL_ID || 'CLIENT_ID',
    clientSecret: process.env.PAYPAL_SECRET || 'CLIENT_SECRET',
    callbackURL: '/api/auth/paypal/callback',
    sandbox: true
  },
  mailer: {
    from: process.env.MAILER_FROM || '"BC Developers Exchange" <noreply@bcdevexchange.org>',
    options: {
      service: process.env.MAILER_SERVICE_PROVIDER || 'MAILER_SERVICE_PROVIDER',
      host: 'apps.smtp.gov.bc.ca',
      ignoreTLS: true,
      secure: false
    }
  },
  shared: {
    owasp: {
      allowPassphrases: true,
      maxLength: 128,
      minLength: 4,
      minPhraseLength: 4,
      minOptionalTestsToPass: 1
    }
  },
  livereload: true,
  seedDB: {
    seed: process.env.MONGO_SEED === 'true',
    options: {
      logResults: process.env.MONGO_SEED_LOG_RESULTS !== 'false',
      seedUser: {
        username: process.env.MONGO_SEED_USER_USERNAME || 'user',
        provider: 'local',
        email: process.env.MONGO_SEED_USER_EMAIL || 'user@localhost.com',
        firstName: 'User',
        lastName: 'Local',
        displayName: 'User Local',
        roles: ['user']
      },
      seedAdmin: {
        username: process.env.MONGO_SEED_ADMIN_USERNAME || 'admin',
        provider: 'local',
        email: process.env.MONGO_SEED_ADMIN_EMAIL || 'admin@localhost.com',
        firstName: 'Admin',
        lastName: 'Local',
        displayName: 'Admin Local',
        roles: ['user', 'admin']
      }
    }
  }
};
