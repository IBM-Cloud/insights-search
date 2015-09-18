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
      search: function (queryString, countOnly) {
        console.log("Query string:", queryString);

        var deferred = $q.defer();
        var method = countOnly ? "count" : "search";
        $http.get("/api/1/messages/" + method + "?q=" + encodeURIComponent(queryString)).success(function (data) {
          deferred.resolve(data);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      }
    };
  }

})();
