const config = require('config')
const bluebird = require('bluebird')
const Redis = require('redis')
bluebird.promisifyAll(Redis.RedisClient.prototype)
bluebird.promisifyAll(Redis.Multi.prototype);

let client = null

client = Redis.createClient(
  config.get('redis')
)

client.on('error', err => {
  console.log(`Redis error ${err}`)
})

module.exports = client
