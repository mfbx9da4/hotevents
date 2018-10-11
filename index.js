'use strict';

const EventCrawler = require('./crawler/EventCrawler')
const updateAlgolia = require('./crawler/updateAlgolia')
const removeUnchangedItems = require('./crawler/removeUnchangedItems')
const config = require('config')
const is_production = process.env.NODE_ENV === 'production'

console.log('Reloaded lambda function');
console.info('is_production', is_production);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
})

exports.handler = async (event, context, callback) => {
  console.log('From /tmp/ event:', JSON.stringify(event, null, 2));
  let ebRes, meetupRes
  // [ebRes, meetupRes] = await EventCrawler()
  // console.info('finished event_crawler');
  // [ebRes, meetupRes] = removeUnchangedItems(ebRes, meetupRes)
  await updateAlgolia(ebRes, meetupRes)
  callback(null, event.key1)
};

const shouldRunOnce = process.argv[2]
if (shouldRunOnce === '--run') {
  exports.handler({}, {}, () => {})
}
