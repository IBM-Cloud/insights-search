// Licensed under the Apache License. See footer for details.
(function () {
  angular.module('app').controller('SearchController', ['$location', 'searchService', 'Notification', SearchController]);

  function SearchController($location, searchService, Notification) {
    var controller = this;
    controller.data = {
      tracks: [],
      results: {
        search: {
          results: 0
        },
        tweets: []
      },
      selected: {},
      query: "",
      trackToQueryFrom: "Decahose",
      link_to_share: ""
    };

    var queryBuilder = $('#query-builder');
    queryBuilder.queryBuilder({
      plugins: [
        'filter-description',
        'bt-tooltip-errors'
        ],
      lang: {
        "add_rule": "Add criteria"
      },
      filters: queryFilters
    });

    // Call Insights for Twitter service and retrieve results
    controller.search = function (countOnly) {
      var queryRules = queryBuilder.queryBuilder('getRules');
      console.info("Rules are", queryRules);

      // set the query as the URL so that it can be bookmarked
      $location.search('query', JSURL.stringify(queryRules));

      controller.data.link_to_share = $location.absUrl();

      // build the Insights for Twitter query string
      var queryString = buildQueryString(queryRules);
      controller.data.query = queryString;
      controller.data.results = {
        search: {
          results: 0
        },
        tweets: []
      };
      controller.data.selected = {};

      // call the service
      searchService.search(queryString, countOnly, controller.data.trackToQueryFrom).then(
        function (data) {
          console.log("Found ", data);

          controller.data.results = data;

          // fill source code
          $("#results-raw").removeClass("prettyprinted").text(angular.toJson(data, 2));
          prettyPrint();
        });
    };

    // select an element from the results and display details
    controller.select = function (tweet) {
      console.info("Selecting", tweet);
      controller.data.selected = tweet;

      $("#selected-tweet").text("");
      $("#selected-tweet-raw").removeClass("prettyprinted").text(angular.toJson(tweet, 2));
      prettyPrint();

      //"id": "tag:search.twitter.com,2005:597277951177003009",
      var tweetId = tweet.message.id.substring(tweet.message.id.lastIndexOf(':') + 1);
      console.info("Displaying tweet with id", tweetId);

      twttr.widgets.createTweet(
          tweetId,
          document.getElementById('selected-tweet'), {
            align: 'center'
          })
        .then(function (el) {});
    };

    // initialize fields from the query parameter or with default
    var queryParam = $location.search().query;
    if (queryParam) {
      try {
        queryBuilder.queryBuilder('setRules', JSURL.parse(queryParam));
      } catch (err) {
        console.error("Can't restore query from URL:", err);
        // default to defaultQuery
        queryBuilder.queryBuilder('setRules', defaultQuery);
        // notify of a problem
        Notification.error("Oups! I could not restore the query from the link. The default query has been used instead.");
      }
    } else {
      queryBuilder.queryBuilder('setRules', defaultQuery);
    }

    // retrieve existing tracks
    searchService.getTracks().then(
      function (data) {
        console.log("Found tracks ", data);
        controller.data.tracks = data.tracks;
      });
  }
})();

// Default query when none specified
var defaultQuery = {
  "condition": "AND",
  "rules": [{
    "id": "keyword",
    "field": "keyword",
    "type": "string",
    "input": "text",
    "operator": "equal",
    "value": "ibm",
    "data": {}
  }, {
    "id": "keyword",
    "field": "keyword",
    "type": "string",
    "input": "text",
    "operator": "equal",
    "value": "insights",
    "data": {}
  }, {
    "id": "keyword",
    "field": "keyword",
    "type": "string",
    "input": "text",
    "operator": "equal",
    "value": "twitter",
    "data": {}
  }, {
    "id": "posted",
    "field": "posted",
    "type": "date",
    "input": "text",
    "operator": "greater_or_equal",
    "value": "2015-07-01",
    "data": {}
  }]
};

//
// Definitions of the query filters
//

function sanitize(string) {
  return string.replace('"', '\'');
}

function enclose(string) {
  if (string.indexOf(' ') != -1) {
    return '"' + string + '"';
  } else {
    return string;
  }
}

var convertSimpleWord = {
  convert: function convertSimpleWord(rule) {
    return (rule.operator == "equal" ? "" : "-") + enclose(sanitize(rule.value));
  }
};

var convertSimpleSelect = {
  convert: function (rule) {
    return (rule.operator == "equal" ? "" : "-") + rule.id + ":" + rule.value;
  }
};

var convertWithQuotes = {
  convert: function (rule) {
    return (rule.operator == "equal" ? "" : "-") + rule.id + ":\"" + sanitize(rule.value) + "\"";
  }
};

var convertBoolean = {
  convert: function (rule) {
    return rule.value == "true" ? rule.id : "-" + rule.id;
  }
};

var convertRange = {
  convert: function (rule) {
    return (rule.operator == "not_between" ? "-" : "") + rule.id + ":" + rule.value;
  }
}

var passthrough = {
  convert: function (rule) {
    return rule.value;
  }
}

var queryLanguages = {
  'ar': "Arabic",
  'zh': "Chinese",
  'da': "Danish",
  'dl': "Dutch",
  'en': "English",
  'fi': "Finnish",
  'fr': "French",
  'de': "German",
  'el': "Greek",
  'he': "Hebrew",
  'id': "Indonesian",
  'it': "Italian",
  'ja': "Japanese",
  'ko': "Korean",
  'no': "Norwegian",
  'fa': "Persian",
  'pl': "Polish",
  'pt': "Portuguese",
  'ru': "Russian",
  'es': "Spanish",
  'sv': "Swedish",
  'th': "Thai",
  'tr': "Turkish",
  'uk': "Ukrainian"
};

// https://www.ng.bluemix.net/docs/services/Twitter/index.html#query_lang
var queryFilters = [
  {
    id: 'keyword',
    label: 'Keyword',
    type: 'string',
    description: 'Matches Tweets that have "keyword" in their body. The search is case-insensitive.',
    operators: ['equal', 'not_equal'],
    data: convertSimpleWord
  },
  {
    id: 'hashtag',
    label: 'Hashtag',
    type: 'string',
    description: 'Matches Tweets with the hashtag #hashtag.',
    operators: ['equal', 'not_equal'],
    data: convertSimpleWord
  },
  {
    id: 'bio_lang',
    label: 'Bio Language',
    type: 'string',
    input: 'select',
    description: 'Matches Tweets from users whose profile language settings match the specified language code.',
    values: queryLanguages,
    operators: ['equal', 'not_equal'],
    data: convertSimpleSelect
  },
  {
    id: 'bio_location',
    label: 'Location',
    type: 'string',
    description: 'Matches Tweets from users whose profile location setting contains the specified location reference.',
    operators: ['equal', 'not_equal'],
    data: convertWithQuotes
  },
  {
    id: 'country_code',
    label: 'Country Code',
    type: 'string',
    description: 'Matches Tweets whose tagged place or location matches the specified country code.',
    operators: ['equal', 'not_equal'],
    data: convertSimpleSelect
  },
  {
    id: 'followers_count',
    label: 'Followers Count',
    type: 'integer',
    description: 'Matches Tweets from users that have a number of followers that fall within the specified range. The upper bound is optional and both limits are inclusive.',
    operators: ['greater_or_equal', 'between', 'not_between'],
    data: convertRange
  },
  {
    id: 'friends_count',
    label: 'Friends Count',
    type: 'integer',
    description: 'Matches Tweets from users that follow a number of users that fall within the specified range. The upper bound is optional and both limits are inclusive.',
    operators: ['greater_or_equal', 'between', 'not_between'],
    data: convertRange
  },
  {
    id: 'from',
    label: 'From',
    type: 'string',
    description: 'Matches Tweets from users with the preferredUsername twitterHandle. Must not contain the @ symbol.',
    operators: ['equal', 'not_equal'],
    data: convertSimpleSelect
  },
  {
    id: 'has:children',
    label: 'Author has children',
    type: 'string',
    input: 'radio',
    description: 'Matches Tweets from users that have children.',
    operators: ['equal'],
    values: {
      "true": "Yes",
      "false": "No"
    },
    data: convertBoolean
  },
  {
    id: 'is:married',
    label: 'Author is married',
    type: 'string',
    input: 'radio',
    description: 'Matches Tweets from users that are married.',
    operators: ['equal'],
    values: {
      "true": "Yes",
      "false": "No"
    },
    data: convertBoolean
  },
  {
    id: 'is:verified',
    label: 'Author is verified',
    type: 'string',
    input: 'radio',
    description: 'Matches Tweets where the author has been verified by Twitter.',
    operators: ['equal'],
    values: {
      "true": "Yes",
      "false": "No"
    },
    data: convertBoolean
  },
  {
    id: 'lang',
    label: 'Language',
    type: 'string',
    input: 'select',
    description: 'Matches Tweets from a particular language.',
    values: queryLanguages,
    operators: ['equal', 'not_equal'],
    data: convertSimpleSelect
  },
  {
    id: 'listed_count',
    label: 'Listed Count',
    type: 'integer',
    description: 'Matches Tweets where Twitter\'s listing of the author falls within the specified range. The upper bound is optional and both limits are inclusive.',
    operators: ['greater_or_equal', 'between', 'not_between'],
    data: convertRange
  },
  //TODO point_radius:[longitude latitude radius]	
  {
    id: 'posted',
    label: 'Posted',
    type: 'date',
    description: 'Matches Tweets that have been posted at or after "startTime". The "endTime" is optional and both limits are inclusive.',
    operators: ['greater_or_equal', 'between', 'not_between'],
    validation: {
      format: 'YYYY-MM-DD'
    },
    plugin: 'datepicker',
    plugin_config: {
      format: 'yyyy-mm-dd',
      todayBtn: 'linked',
      todayHighlight: true,
      autoclose: true
    },
    data: convertRange
  },
  {
    id: 'sentiment',
    label: 'Sentiment',
    type: 'string',
    input: 'select',
    values: {
      'positive': 'Positive',
      'negative': 'Negative',
      'neutral': 'Neutral',
      'ambivalent': 'Ambivalent'
    },
    description: 'Matches Tweets with a particular sentiment.',
    operators: ['equal'],
    data: convertSimpleSelect
  },
  {
    id: 'statuses_count',
    label: 'Statuses Count',
    type: 'integer',
    description: 'Matches Tweets from users that have posted a number of statuses that falls within the specified range. The upper bound is optional and both limits are inclusive.',
    operators: ['greater_or_equal', 'between', 'not_between'],
    data: convertRange
  },
  {
    id: 'time_zone',
    label: 'Time zone or city',
    type: 'string',
    description: 'Matches Tweets from users whose profile settings match the specified time zone or city.',
    operators: ['equal', 'not_equal'],
    data: convertWithQuotes
  },
  {
    id: 'raw',
    label: 'Raw Query',
    type: 'string',
    description: '',
    operators: ['equal'],
    data: passthrough
  }

];

// convert query rules into the Insights for Twitter format
function buildQueryString(queryRules) {

  var query = "";
  queryRules.rules.forEach(function (rule) {

    var queryElement;
    if (rule.hasOwnProperty("rules")) {
      queryElement = "(" + buildQueryString(rule) + ")";
    } else {
      queryElement = rule.data.convert(rule);
    }

    if (query == "") {
      query = queryElement;
    } else {
      query = query + " " + queryRules.condition + " " + queryElement;
    }
  });

  return query;
}
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
