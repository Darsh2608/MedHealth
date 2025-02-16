/////////////////////////////////////////////////
// Singleton for Redis cache database client.
//
// @file: redisClient.js
// @author: Anurag Bhandari
/////////////////////////////////////////////////

var redis = require('redis');

var redisClient = (function () {

    var ready = false;

    // Attempt to create a new instance of an actual redis client
    var connectionString = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    var client = redis.createClient(connectionString, {
        retry_strategy: function (options) {
            if (options.error.code === 'ECONNREFUSED') {
                // This will suppress the ECONNREFUSED unhandled exception
                // that results in app crash
                console.log(options.error);
                return;
            } else {
                console.log(options.error);
            }
        }
    });

    client.on('error', function (err) {
        console.log(err);
    });

    // Set the "client" variable to the actual redis client instance
    // once a connection is established with the Redis server
    client.on('ready', function () {
        ready = true;
    });

    var sleep = function (ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    };

    /**
     * Get a redis client
     * @return {Object} client - eventually a proper redis client object (if redis is up) or a fake client object (if redis is down)
     */
    var createClient = async function () {
        let counter = 1;
        while (!ready) {
            await sleep(500);
            counter++;
            if (counter > 10) return false;
        }
        return client;
    };

    return {
        createClient: createClient,
        esists: (key) => {
            return new Promise((resolve, reject) => {
                client.exists(key, async (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
        },

        getAll: (key) => {
            return new Promise((resolve, reject) => {
                client.hgetall(key, async (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
        },

        get: (key) => {
            return new Promise((resolve, reject) => {
                client.get(key, async (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
        },

        set: (key, value) => {
            return new Promise((resolve) => {
                client.set(key, value);
                resolve();
            });
        },

        hmset: (key, value) => {
            return new Promise((resolve, reject) => {
                client.hmset(key, value).then(function (err) {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            });
        },

        expire: (key, timeout) => {
            return new Promise((resolve) => {
                client.expire(key, timeout);
                resolve();
            });
        },
        getKeys: (key) => {
            return new Promise((resolve,reject) => {
                client.keys(key, async (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
        }
    };
})();

module.exports = redisClient;