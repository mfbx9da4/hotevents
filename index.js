'use strict';

const EventCrawler = require('./crawler/EventCrawler')
const updateAlgolia = require('./crawler/updateAlgolia')
const config = require('config')
const redis = require('./crawler/redis')
const is_production = process.env.NODE_ENV === 'production'

console.log('Reloaded lambda function');
console.info('is_production', is_production);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
})

exports.handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  await EventCrawler()
  console.info('Finished EventCrawler');
  await updateAlgolia()
  console.info('Finished updateAlgolia');
  callback(null, event.key1)
  redis.quit()
};

const shouldRunOnce = process.argv[2]
if (shouldRunOnce == '--run') {
  exports.handler({}, {}, () => {})
}
