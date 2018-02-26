'use strict'

const redis = require('./redis')

module.exports = {
  flush: () => {
    return redis.flushallAsync()
      .then(res => {
        debug(`Flushed cache: ${res}`)
      })
      .catch(err => {
        throw new ApiError('Error deleting cache: ' + err)
      })
  },
  keys: async (pattern) => redis.keysAsync(pattern),
  ttl: async (key) => redis.ttlAsync(key),
  get: async (key) => redis.getAsync(key),
  set: async (key, value, CMD, CMD_VAL) => {
    return redis.setAsync(key, value, CMD, CMD_VAL)
  },
  hgetall: async (key) => redis.hgetallAsync(key),
  del: async (key) => redis.del(key)
}
