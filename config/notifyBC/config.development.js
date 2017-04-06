'use strict';

module.exports = {
  'adminIps': [
    '172.18.0.0/24'
  ],
  'port': 3000,
  'smtp': {
    'direct': false,
    'service': process.env.MAILER_SERVICE_PROVIDER,
    'logger': true,
    'auth': {
      'user': process.env.MAILER_EMAIL_ID,
      'pass': process.env.MAILER_PASSWORD
    }
  }
}
