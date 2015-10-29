// Licensed under the Apache License. See footer for details.
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

  self.search = function (query, size, from, callback) {
    request.get(
      url + "/api/v1/messages/search?size=" + size +
      "&from=" + encodeURIComponent(from) +
      "&q=" + encodeURIComponent(query), {
        json: true
      },
      function (error, response, body) {
        callback(error, body);
      });
  }

  self.getTracks = function (callback) {
    request.get(
      url + "/api/v1/tracks", {
        json: true
      },
      function (error, response, body) {
        callback(error, body);
      });
  }

  self.countTrack = function (trackId, query, callback) {
    request.get(
      url + "/api/v1/tracks/" + trackId + "/messages/count?q=" + encodeURIComponent(query), {
        json: true
      },
      function (error, response, body) {
        callback(error, body);
      });
  };

  self.searchTrack = function (trackId, query, size, from, callback) {
    request.get(
      url + "/api/v1/tracks/" + trackId + "/messages/search?size=" + size +
      "&from=" + encodeURIComponent(from) +
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
};
//------------------------------------------------------------------------------
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------
