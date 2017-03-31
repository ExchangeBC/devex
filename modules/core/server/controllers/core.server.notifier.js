var fetch = require('node-fetch');

exports.notifier = function (notifyBChost, port, serviceName, type) {
  var host = notifyBChost.match(/http/) ? notifyBChost : 'http://' + notifyBChost,
    port = port,
    serviceName = serviceName,
    type = type,
    url = port ? host + ':' + port : host;

  return {
    subscribe : function (channelId) {
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
      return fetch(url + '/api/subscriptions/' + subscriptionId, {
        method: 'delete',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json'}
        })
        .then(function(res) {
          return res.json();
        });
    },
    notify : function (messageObj) {
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
}