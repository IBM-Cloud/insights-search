var request = require('request');

function Twitter(url) {
  var self = this;
  
  self.count = function (query, callback) {
    request.get(
      url + "/api/v1/messages/count?q=" + encodeURIComponent(query), {
        json: true
      },
      function (error, response, body) {
        callback(error, body);
      });
  };

  self.search = function (query, size, callback) {
    request.get(
      url + "/api/v1/messages/search?size=" + size +
      "&q=" + encodeURIComponent(query), {
        json: true
      },
      function (error, response, body) {
        callback(error, body);
      });
  }
}

module.exports = function (url) {
  return new Twitter(url);
}
