"use strict";

import cacheManager from "cache-manager";
import redisStore from "cache-manager-redis";
import redis from "redis";
import Q from "q";

export class RedisCache {

  constructor({redisdb, logger}) {
    if (!redisdb.host || !redisdb.port || !redisdb.ttl || !logger) {
      throw new Error("Failed to initialise config or dependencies were missing");
    }
    this.store_ = redisStore;
    this.host_ = redisdb.host || "localhost";
    this.port_ = redisdb.port || "6379";
    this.ttl_ = redisdb.ttl || 24 * 60 * 60;
    this.db_ = redisdb.db || 0;
    this.logger = logger;

    this.redisCache = cacheManager.caching({
      "store": this.store_,
      "host": this.host_,
      "port": this.port_,
      "db": this.db_,
      "ttl": this.ttl_
    });
  }

  checkRedis() {

    this.logger.debug("debug, checking redis status.");
    let client = redis.createClient(this.port_, this.host_);

    client.on("error", function (err) {
      console.log("debug, resdis is not running due to following error." + err);
    });

    client.on("ready", function () {
      console.log("debug, redis is running on host==> " + this.host_ + " and on port==> " + this.port_);
    }.bind(this));
  }

  setToken(param) {
    // console.log(JSON.stringify(param));
    // let regx = new RegExp("\{ key\: \'+[a-zA-Z0-9]+\'\, value\: .*"),
    // console.log(regx);
    // console.log(!regx.test(param));
    // if (!regx.test(param)) {
    //  deffered.reject("key or value passed are not in valid format.");
    // }

    if (!param.options || !param.options.ttl) {
      param.options = {"ttl": this.ttl_};
    }

    let {key, value, options} = param,
      deffered = Q.defer();

    // console.log(JSON.stringify(param));
    this.logger.debug("debug, storing key: " + key + "with value: " + value + "options: " + options);
    // console.log("debug, storing key: " + key + "with value: " + value + "options: " + options);
    this.redisCache.set(key, value, options, function (err) {
      if (err) {
        deffered.reject(err);
      } else {
        deffered.resolve(true);
      }
    });
    return deffered.promise;
  }

  getToken(param) {

    let {key} = param,
      deffered = Q.defer();

    this.redisCache.get(key, function (err, result) {
      if (err) {
        deffered.reject("value cannot be fetched due to following error: " + err);
      } else {
        deffered.resolve(result);
      }
    });
    return deffered.promise;
  }

  deleteKey(key) {

    let deffered = Q.defer();

    this.redisCache.del(key, function (err) {
      if (err) {
        deffered.reject("cannot deleted with err==>", err);
      }
      deffered.resolve(true);
    });
    return deffered.promise;
  }
}

// let redis1 = new RedisCache({"redisdb": {"host": "localhost", "port": "6379", "ttl": 60, "db": 0}});

// redis1.checkRedis();

/* redis1
 .setToken({"key": "user5", "value": "hello2"})
 .then(result => {
 if (result) {
 console.log("value added successfully to Redis");
 }
 }, err => {
 console.log(err);
 });

 redis1.getToken({"key": "user5"})
 .then(result => {
 console.log("result====>>>", result);
 });*/
