var fetch = require('node-fetch');

exports.notifier = function (notifyBChost, port, serviceName, type) {
  var host = notifyBChost.match(/http/) ? notifyBChost : "http://" + notifyBChost,
    port = port,
    serviceName = serviceName,
    type = type,
    url = host + ":" + port;

  return {
    subscribe : function (channelId) {
      return fetch(url + "/api/subscriptions/", {
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
    unsubscribe : function (subscriptionId) {
      return fetch(url + "/api/subscriptions/" + subscriptionId, {
        method: 'delete',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json'}
        })
        .then(function(res) {
          return res.json();
        });
    },
    // unsubscribeByEmail : function (userId) {
    //   console.log('unsubscribe');

    //   var whereFilter = JSON.stringify({
    //       "where":
    //         {
    //           "userId": userId.toString(),
    //           "serviceName": serviceName,
    //           "channel": type
    //         }
    //     });

    //   console.log(whereFilter);
    //   // we fetch all subscriptions that match the userId, serviceName, and type
    //   // then delete each of these (there should be one, but just in case)
    //   return fetch(url + "/api/subscriptions?filter=" + whereFilter, {
    //     method: 'get',
    //     headers: { 'Accept': 'application/json'}
    //     })
    //     .then(function(res) {
    //       console.log("RESULTS")
    //       return res.json();
    //     })
    //     .then(function(json) {
    //       json.forEach(function(subscription) {
    //         fetch("http:://10.0.0.188:8888/api/subscriptions", {
    //           method: 'delete'
    //         })
    //       })
    //     })
    //     .catch(function(err) {
    //       console.log('err:' + err);
    //     });
    // },
    notify : function (messageObj) {
      return fetch(url + "/api/notifications/", {
        method: 'post',
        body: JSON.stringify({
          "serviceName": serviceName,
          "message": messageObj,
          "channel": type,
          "isBroadcast": true
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