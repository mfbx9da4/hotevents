'use strict'

/*========================
This has been copied from meetup.js
should reuse code and be DRY
https://www.eventbrite.co.uk/developer/v3/endpoints/events/?internal_ref=login
========================*/



const fs = require('fs')
const fetch = require('isomorphic-fetch')
const moment = require('moment')
const redis = require('./redis')
const { fetchCachedUrl } = require('./fetchCacheService')
const cache = require('./cacheService')

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const TOKEN = 'XDBAFCOI7YV7PQKYML5A'
const FILENAME = 'hot-sf-eventbrite.json'
const LOOKAHEAD = 1000

async function getEvents ({start_date_range}) {
  const paramsObject = {
    'location.latitude': 37.771707,
    'location.longitude': -122.405377,
    'location.within': '5mi',
    token: TOKEN,
    'start_date.range_start': start_date_range
  }
  const params = Object.keys(paramsObject)
    .map(key => `${key}=${paramsObject[key]}`)
    .join('&')
  console.info('params', params);
  const url = `https://www.eventbriteapi.com/v3/events/search?${params}`
  const text = await fetchCachedUrl(url)
  const res = JSON.parse(text)
  if (res.error) {
    console.info(res);
  }
  return res
}

async function search () {
  // let start_date_range = moment().format('YYYY-MM-DDTHH:mm:ss')
  let start_date_range = moment().format('YYYY-MM-DDT00:00:00')
  let total = 0
  let events = {}
  while (total < LOOKAHEAD) {
    let res = await getEvents({start_date_range})
    if (!res.events) { break }
    total += res.events.length
    let id, time, local_date, local_time, venue
    for (var event of res.events) {
      id = event.id; time = event.time; venue = event.venue
      start_date_range = event.start.local
      events[id] = event
    }
  }
  const hot = []
  for (let id in events) {
    let event = events[id]

    if (event.capacity) {
      hot.push(event)
    }
  }
  console.info('hot', hot.length);
  const hotString = JSON.stringify(hot, null, 4)
  await cache.set(`hot`, hotString, 'EX', 60 * 60 * 24 * 7)
  writeFile(FILENAME, hotString)
}

function writeFile (filename, contents) {
  fs.writeFile(filename, contents, function (err) {
      if (err)
        return console.log(err);
      console.log('wrote ' + filename);
  });
}

async function main () {
  await search()
  redis.quit()
}

main()
