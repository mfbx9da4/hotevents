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
  keys: redis.keysAsync,
  ttl: redis.ttlAsync,
  get: redis.getAsync,
  set: redis.setAsync,
  hgetall: async (key) => redis.hgetallAsync(key),
  del: async (key) => redis.del(key)
}
