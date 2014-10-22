"use strict";
var releaseIt = require("release-it");
var Promise = require("bluebird");
var changelog = require("./changelog");
var path = require("path");
var util = require("./util");
var PACKAGE_FILE = path.resolve(process.cwd(), 'package.json');

function getCurrentVersion() {
    return require(PACKAGE_FILE).version;
}

function getIncrement(options, increment) {
    if (!increment) {
        return changelog.getChangeLogBumpPromise(options);
    }
    else {
        return Promise.resolve(increment);
    }
}

function execute(option) {
    var changeLogOption = {
        "debug": option["debug"],
        "dry-run": option['dry-run'],
    };

    return getIncrement(changeLogOption, option.increment)
      .then(function (increment) {
          changeLogOption.releaseVersion = util.increment(getCurrentVersion(), increment);
          option.increment = changeLogOption.releaseVersion;

          return Promise.all([
              changelog.getCurrentChangeLogPromise(changeLogOption),
              changelog.writeChangeLogPromise(changeLogOption),
          ]);
      })
      .then(function (results) {
          return changelog.stageChangeLogPromise(changeLogOption)
              .then(function () {
                  return results[0];
              });
      })
      .then(function (changelog) {
          option.tagAnnotation = "Release %s\n" + changelog;
          return releaseIt.execute(option);
      });
}
module.exports.execute = execute;
