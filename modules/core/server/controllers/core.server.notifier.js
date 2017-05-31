  'use strict';

var fetch  = require('node-fetch');
var path   = require('path');
var config = require(path.resolve('./config/config'));

exports.notifier = function (serviceName, type) {
  var notifyBChost = config.notification.host;
  var port = config.notification.port || null;
  var host = notifyBChost.match(/http/) ? notifyBChost : 'http://' + notifyBChost,
    port = port,
    serviceName = serviceName,
    type = type,
    url = port ? host + ':' + port : host,
    mailfrom = process.env.MAILER_FROM || '"BC Developers Exchange" <noreply@bcdevexchange.org>'
    ;

  return {
    subscribe : function (channelId) {
      console.log ('subscribe ',channelId, url + '/api/subscriptions/');
      return fetch(url + '/api/subscriptions/', {
        method: 'post',
        body: JSON.stringify({
            serviceName: serviceName,
            channel: type,
            userChannelId: channelId,
            state: 'confirmed'
          }),
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json'}
        })
        .then(function(res) {
          return res.json();
        });
    },
    subscribeUpdate : function (subscriptionId, channelId) {
      console.log ('subscribeUpdate ',subscriptionId, channelId, url + '/api/subscriptions/' + subscriptionId);
      return fetch(url + '/api/subscriptions/' + subscriptionId, {
        method: 'patch',
        body: JSON.stringify({
            userChannelId: channelId
          }),
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json'}
        })
        .then(function(res) {
          return res.json();
        });
    },
    unsubscribe : function (subscriptionId) {
      console.log ('unsubscribe ',subscriptionId, url + '/api/subscriptions/' + subscriptionId);
      return fetch(url + '/api/subscriptions/' + subscriptionId, {
        method: 'delete',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json'}
        })
        .then(function(res) {
          return res.json();
        });
    },
    notify : function (messageObj) {
      messageObj.from = mailfrom;
      console.log ('notify ',messageObj, url + '/api/notifications/');
      return fetch(url + '/api/notifications/', {
        method: 'post',
        body: JSON.stringify({
          'serviceName': serviceName,
          'message': messageObj,
          'channel': type,
          'isBroadcast': true
        }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      .then(function(res) {
        return res.json();
      });
    }
  }
};
