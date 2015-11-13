var
  cfenv = require('cfenv'),
  moment = require('moment'),
  async = require('async');

var argv = require('yargs')
  .option('start', {
    alias: 's',
    demand: true,
    describe: 'Start date, YYYYMMDD',
    type: 'string',
    default: '20130101'
  })
  .option('end', {
    alias: 'e',
    describe: 'End date, YYYYMMDD',
    type: 'string',
    default: function today() {
      return moment().endOf('day');
    }
  })
  .option('unit', {
    alias: 'u',
    describe: 'Unit of increment',
    choices: ['y', 'Q', 'M', 'w', 'd', 'h', 'm', 's'],
    type: 'string',
    default: 'M'
  })
  .option('size', {
    alias: 'i',
    describe: 'Size of the increment',
    type: 'string',
    default: 1
  })
  .option('output', {
    alias: 'o',
    describe: 'Redirect result to file',
    type: 'string',
    default: "statistics-" + moment().format("YYYYMMDD-HHmm") + ".csv"
  })
  .option('verbose', {
    alias: 'v',
    describe: 'Show verbose output',
    count: true,
    default: false
  })
  .option('extract', {
    alias: 'x',
    describe: 'Extract actual tweets instead of summary',
    type: 'boolean',
    default: false
  })
  .option('track', {
    alias: 't',
    describe: 'Use the specified track instead of the Decahose',
    type: 'string'
  })
  .help('h')
  .alias('h', 'help')
  .argv;

VERBOSE_LEVEL = argv.verbose;

function ERROR() {
  console.log.apply(console, arguments);
}

function WARN() {
  VERBOSE_LEVEL >= 0 && console.log.apply(console, arguments);
}

function INFO() {
  VERBOSE_LEVEL >= 1 && console.log.apply(console, arguments);
}

function DEBUG() {
  VERBOSE_LEVEL >= 2 && console.log.apply(console, arguments);
}

DEBUG("Command line args", argv);

// load local VCAP configuration
var vcapLocal = null
try {
  vcapLocal = require("./vcap-local.json");
  INFO("Loaded local VCAP", vcapLocal);
} catch (e) {
  console.error(e);
}

// get the app environment from Cloud Foundry, defaulting to local VCAP
var appEnvOpts = vcapLocal ? {
  vcap: vcapLocal
} : {}
var appEnv = cfenv.getAppEnv(appEnvOpts);

var twitterCreds = appEnv.getServiceCreds("insights-search-twitter");
var twitter = require('./lib/twitter.js')(twitterCreds.url);

var current = moment(argv.start, "YYYYMMDD");
var end = moment(argv.end, "YYYYMMDD");
INFO("Querying from", current.format("YYYYMMDD"), "to", end.format("YYYYMMDD"));

var baseQuery = "(" + argv._[0] + ")"
INFO("Going to search for", baseQuery);

if (argv.extract) {
  extractTweets(argv.track, baseQuery, argv.output);
} else {
  extractSummary(current, end, argv.track, baseQuery, argv.unit, argv.size, argv.output);
}

var languages = {
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

function extractTweets(track, baseQuery, output) {
  var fs = require('fs');
  INFO("Writing", output);
  var stream = fs.createWriteStream(output);
  stream.once('open', function (fd) {

    // from message
    stream.write("Posted Time\t");
    stream.write("Generator\t");
    stream.write("Body\t");
    stream.write("Favorites Count\t");
    stream.write("Actor Summary\t");
    stream.write("Actor Statuses Count\t");
    stream.write("Actor Username\t");
    stream.write("Actor Display Name\t");
    stream.write("Actor Verified\t");
    stream.write("Actor Friends Count\t");
    stream.write("Actor Favorites Count\t");
    stream.write("Actor Listed Count\t");
    stream.write("Actor Type\t");
    stream.write("Actor Followers Count\t");
    stream.write("Retweet Count\t");
    stream.write("Tweet Language\t");
    stream.write("Tweet Language Code\t");

    // from CDE
    stream.write("Author Gender\t");
    stream.write("Author Is Parent\t");
    stream.write("Author Is Parent Evidence\t");
    stream.write("Author Country\t");
    stream.write("Author City\t");
    stream.write("Author State\t");
    stream.write("Author Is Married\t");
    stream.write("Author Is Married Evidence\t");
    stream.write("Tweet Sentiment\t");

    stream.write("\n");

    _extractTweets(stream, track, baseQuery, 500, 0);
  });
}

function _extractTweets(stream, track, query, size, from) {
  var twitterSearch = function (error, body) {
    if (error) {
      ERROR(error);
    } else {
      // write tweets

      // get more results
      DEBUG("Got", body);

      INFO(from, "/", body.search.results);

      if (!body.tweets || body.tweets.length == 0) {
        return;
      }

      body.tweets.forEach(function (tweet, index) {        
        // from message
        stream.write(tweet.message.postedTime.replace("T", " ").replace("Z", " "));
        stream.write("\t");
        stream.write(sanitize(tweet.message.generator.displayName));
        stream.write("\t");
        stream.write(sanitize(tweet.message.body));
        stream.write("\t");
        stream.write(sanitize(tweet.message.favoritesCount));
        stream.write("\t");
        stream.write(sanitize(tweet.message.actor.summary));
        stream.write("\t");
        stream.write(sanitize(tweet.message.actor.statusesCount));
        stream.write("\t");
        stream.write(sanitize(tweet.message.actor.preferredUsername));
        stream.write("\t");
        stream.write(sanitize(tweet.message.actor.displayName));
        stream.write("\t");
        stream.write(sanitize(tweet.message.actor.verified));
        stream.write("\t");
        stream.write(sanitize(tweet.message.actor.friendsCount));
        stream.write("\t");
        stream.write(sanitize(tweet.message.actor.favoritesCount));
        stream.write("\t");
        stream.write(sanitize(tweet.message.actor.listedCount));
        stream.write("\t");
        stream.write(sanitize(tweet.message.actor.objectType));
        stream.write("\t");
        stream.write(sanitize(tweet.message.actor.followersCount));
        stream.write("\t");
        stream.write(sanitize(tweet.message.retweetCount));
        stream.write("\t");
        stream.write(sanitize(languages[tweet.message.twitter_lang]));
        stream.write("\t");
        stream.write(sanitize(tweet.message.twitter_lang));
        stream.write("\t");

        // from CDE
        stream.write(sanitize(tweet.cde.author.gender));
        stream.write("\t");
        stream.write(tweet.cde.author.parenthood ? sanitize(tweet.cde.author.parenthood.isParent) : "unknown");
        stream.write("\t");
        stream.write(tweet.cde.author.parenthood ? sanitize(tweet.cde.author.parenthood.evidence) : "");
        stream.write("\t");
        stream.write(sanitize(tweet.cde.author.location.country).toLowerCase());
        stream.write("\t");
        stream.write(sanitize(tweet.cde.author.location.city).toLowerCase());
        stream.write("\t");
        stream.write(sanitize(tweet.cde.author.location.state).toLowerCase());
        stream.write("\t");
        stream.write(tweet.cde.author.maritalStatus ? sanitize(tweet.cde.author.maritalStatus.isMarried) : "unknown");
        stream.write("\t");
        stream.write(tweet.cde.author.maritalStatus ? sanitize(tweet.cde.author.maritalStatus.evidence) : "");
        stream.write("\t");
        stream.write(tweet.cde.content ? sanitize(tweet.cde.content.sentiment.polarity) : "");
        stream.write("\t");
        stream.write("\n");
      });

      _extractTweets(stream, track, query, size, from + body.tweets.length);
    }
  }

  if (track) {
    twitter.searchTrack(track, baseQuery, size, from, twitterSearch);
  } else {
    twitter.search(baseQuery, size, from, twitterSearch);
  }
}

function sanitize(value) {
  try {
    if (value == null) {
      return "";
    } else if (typeof value != "string") {
      return value.toString();
    } else {
      return value.replace(/(?:\r\n|\r|\n|\t)/g, ' ');
    }
  } catch (err) {
    ERROR(typeof value);
    throw err;
  }
}

function extractSummary(start, end, track, baseQuery, increment, incrementSize, output) {
  var tasks = [];
  var statistics = [];
  var current = start.clone();

  DEBUG("Increment:", increment);
  DEBUG("Increment Size:", incrementSize);

  //yyyy-mm-ddTHH:MM:SSZ
  // Timezone is based on UTC (Coordinated Universal Time).
  var format = "YYYY-MM-DD[T]HH:mm:SS[Z]";
  do {
    var dateStart = current.format(format);
    current.add(incrementSize, increment)
    var dateEnd = current.format(format);

    var statEntry = statistics[dateStart] = {
      date: dateStart.replace("T", " ").replace("Z", " ")
    };

    DEBUG("Building tasks for", dateStart, "to", dateEnd);

    tasks.push(makeCriteriaTask(statEntry, track, baseQuery, dateStart, dateEnd, "tweets"));
    tasks.push(getSentiment(statEntry, track, baseQuery, "positive", dateStart, dateEnd));
    tasks.push(getSentiment(statEntry, track, baseQuery, "negative", dateStart, dateEnd));
    tasks.push(getSentiment(statEntry, track, baseQuery, "neutral", dateStart, dateEnd));
    tasks.push(getSentiment(statEntry, track, baseQuery, "ambivalent", dateStart, dateEnd));

    tasks.push(withModifier(statEntry, track, baseQuery, "is:married", dateStart, dateEnd))
    tasks.push(withModifier(statEntry, track, baseQuery, "has:children", dateStart, dateEnd))
    tasks.push(withModifier(statEntry, track, baseQuery, "is:verified", dateStart, dateEnd))
  } while (current.isBefore(end) || current.isSame(end))

  INFO("Launching", tasks.length, "queries...");

  // increase concurrency
  require('http').globalAgent.maxSockets = 5;
  async.parallelLimit(tasks, 5, function (err, results) {
    INFO("Completed");

    statistics.sort(function (entry1, entry2) {
      return entry1.date.localeCompare(entry2.date);
    });

    var fs = require('fs');
    INFO("Writing", output);
    var stream = fs.createWriteStream(output);
    stream.once('open', function (fd) {
      var headerPrinted;
      var properties = [];

      for (var key in statistics) {
        if (statistics.hasOwnProperty(key)) {
          var entry = statistics[key]

          if (!headerPrinted) {
            for (var property in entry) {
              if (entry.hasOwnProperty(property)) {
                stream.write(property + ",");
                properties.push(property)
              }
            }
            stream.write("\n");
            headerPrinted = true;
          }

          properties.forEach(function (property, index) {
            stream.write(entry[property] + ",");
          })
          stream.write("\n");
        }
      }
      stream.end();
    });

    //fs.writeFile('statistics.json', JSON.stringify(statistics));
  });
}

function getSentiment(statEntry, track, baseQuery, sentiment, start, end) {
  return makeCriteriaTask(statEntry, track, "sentiment:" + sentiment + " AND " + baseQuery, start, end, "sentiment:" + sentiment);
}

function withModifier(statEntry, track, baseQuery, modifier, start, end) {
  return makeCriteriaTask(statEntry, track, modifier + " AND " + baseQuery, start, end, modifier);
}

function makeCriteriaTask(statEntry, track, baseQuery, start, end, key) {
  var query = baseQuery + " posted:" + start + "," + end;
  return function (callback) {
    DEBUG("Querying for", query);
    
    var twitterCount = function (err, body) {
      DEBUG("Got results for", start, err, body);
      try {
        statEntry[key] = body.search.results
        callback(null, start);
      } catch (anError) {
        console.error(anError);
      }
    };
    if (track) {
      twitter.countTrack(track, query, twitterCount);
    } else {
      twitter.count(query, twitterCount);
    }
  }
}
