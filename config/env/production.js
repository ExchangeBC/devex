'use strict';

var databaseServiceName = (process.env.DATABASE_SERVICE_NAME || 'mongodb').toUpperCase();

module.exports = {
  sessionSecret: process.env.SESSION_SECRET || 'super amazing secret',
  secure: {
    ssl: true,
    privateKey: './config/sslcerts/key.pem',
    certificate: './config/sslcerts/cert.pem',
    caBundle: './config/sslcerts/cabundle.crt'
  },
  port: process.env.PORT || 3000,
  // Binding to 127.0.0.1 is safer in production.
  host: process.env.HOST || '0.0.0.0',
  db: {
    uri: process.env.MONGOHQ_URL || process.env.MONGODB_URI || 'mongodb://' + (process.env[`${databaseServiceName}_SERVICE_HOST`] || 'localhost') + ':27017' + '/' + (process.env.MONGODB_DATABASE || 'mean'),
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
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    //
    // cc:logging: modified apache format including internal user identification
    //
    format: ':remote-addr - :userid - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :referrer',
    fileLogger: {
      directoryPath: process.env.LOG_DIR_PATH || process.cwd(),
      fileName: process.env.LOG_FILE || 'app.log',
      maxsize: 10485760,
      maxFiles: 2,
      json: false
    }
  },
  github: {
    clientID: process.env.GITHUB_ID || 'APP_ID',
    clientSecret: process.env.GITHUB_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/github/callback',
    personalAccessToken: process.env.GITHUB_ACCESS_TOKEN || 'GITHUB_ACCESS_TOKEN'
  },
  mailer: {
    from: process.env.MAILER_FROM || '"BC Developer\'s Exchange" <noreply@bcdevexchange.org>',
    options: {
      host: process.env.MAILER_HOST || 'apps.smtp.gov.bc.ca',
      port: process.env.MAILER_PORT || 25,
      secure: false,
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      ignoreTLS: false,
      tls: {
        rejectUnauthorized: false
      }
    }
  }
};
