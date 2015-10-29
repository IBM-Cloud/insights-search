// Licensed under the Apache License. See footer for details.
var
  express = require('express'),
  app = express(),
  cfenv = require('cfenv');

//---Deployment Tracker---------------------------------------------------------
require("cf-deployment-tracker-client").track();

// load local VCAP configuration
var vcapLocal = null
try {
  vcapLocal = require("./vcap-local.json");
  console.log("Loaded local VCAP", vcapLocal);
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

app.get("/api/1/messages/count", function (req, res) {
  console.log("Counting with", req.query.q);
  twitter.count(req.query.q, function (error, body) {
    if (error) {
      res.sendStatus(500);
    }
    res.send(body);
  });
});

app.get("/api/1/messages/search", function (req, res) {
  console.log("Searching with", req.query.q);
  // limit to the first 20 tweets
  twitter.search(req.query.q, 20, 0, function (error, body) {
    if (error) {
      res.sendStatus(500);
    }
    res.send(body);
  });
});

app.get("/api/1/tracks", function (req, res) {
  console.log("Retrieving tracks");
  twitter.getTracks(function (error, body) {
    if (error) {
      res.sendStatus(500);
    }
    res.send(body);
  });
});

app.get("/api/1/tracks/:id/messages/count", function (req, res) {
  console.log("Counting track", req.params.id, "with", req.query.q);
  twitter.countTrack(req.params.id, req.query.q, function (error, body) {
    if (error) {
      res.sendStatus(500);
    }
    res.send(body);
  });
});

app.get("/api/1/tracks/:id/messages/search", function (req, res) {
  console.log("Searching track", req.params.id, "with", req.query.q);
  twitter.searchTrack(req.params.id, req.query.q, 20, 0, function (error, body) {
    if (error) {
      res.sendStatus(500);
    }
    res.send(body);
  });
});

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// start server on the specified port and binding host
app.listen(appEnv.port, "0.0.0.0", function () {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

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
