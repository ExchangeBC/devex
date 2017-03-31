'use strict';

module.exports = {
  "adminIps": [
    '127.0.0.1',
    process.env.DEVEX_HOST
  ],
  "port": 3000,
  "smtp": {
    "direct": false,
    "service": process.env.MAILER_SERVICE_PROVIDER,
    "logger": true,
    "auth": {
      "user": process.env.MAILER_EMAIL_ID,
      "pass": process.env.MAILER_PASSWORD
    }
  }
}