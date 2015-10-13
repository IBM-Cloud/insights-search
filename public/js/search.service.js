// Licensed under the Apache License. See footer for details.
(function () {
  angular.module('app')
    .service('searchService', ['$http', '$q', searchService]);

  function searchService($http, $q) {
    var data = {
      selectedTweet: {}
    };

    return {
      setSelectedTweet: function (tweet) {
        date.selectedTweet = tweet;
      },
      getData: function () {
        return data;
      },
      search: function (queryString, countOnly, trackToQueryFrom) {
        console.log("Query string:", queryString);
        var deferred = $q.defer();
        
        var prefix;
        if (trackToQueryFrom == "Decahose" || trackToQueryFrom == null) {
          prefix = "/api/1"
        } else {
          prefix = "/api/1/tracks/" + trackToQueryFrom
        }
        var method = countOnly ? "count" : "search";
        $http.get(prefix + "/messages/" + method + "?q=" + encodeURIComponent(queryString)).success(function (data) {
          deferred.resolve(data);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      getTracks: function () {
        var deferred = $q.defer();
        $http.get("/api/1/tracks").success(function (data) {
          deferred.resolve(data);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      }
    };
  }

})();
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
