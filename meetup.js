'use strict'

const fs = require('fs')
const fetch = require('isomorphic-fetch')
const moment = require('moment')
const redis = require('./redis')
const { fetchCachedUrl } = require('./fetchCacheService')
const cache = require('./cacheService')

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const APIKEY = 'f3960226c366e3e4d4dd3f1749716b'
const FILENAME = 'hot-sf.json'

async function getEvents ({start_date_range}) {
  const paramsObject = {
    lat: 37.771707,
    lon: -122.405377,
    radius: 5,
    order: 'time',
    page: 500,
    key: APIKEY,
    sign: true,
    fields: 'group_topics',
    start_date_range
  }
  const params = Object.keys(paramsObject)
    .map(key => `${key}=${paramsObject[key]}`)
    .join('&')
  console.info('params', params);
  const url = `https://api.meetup.com/find/upcoming_events?${params}`
  try {
    const text = await fetchCachedUrl(url)
    const res = JSON.parse(text)
    return res
  } catch (err) {
    console.info('err', err);
    return err
  }
}

async function search () {
  // let start_date_range = moment().format('YYYY-MM-DDTHH:mm:ss')
  let start_date_range = moment().format('YYYY-MM-DDT00:00:00')
  let total = 0
  let events = {}
  while (total < 1000) {
    let res = await getEvents({start_date_range})
    if (!res.events) { break }
    total += res.events.length
    let id, time, local_date, local_time, venue
    for (var event of res.events) {
      id = event.id; time = event.time; venue = event.venue
      local_date = event.local_date || local_date;
      local_time = event.local_time || local_time;
      events[id] = event
      // console.info('event', local_date, local_time);
      // console.info('event', event);
      // await cache.set(`event:${id}`, JSON.stringify(event), 'EX', 10)
    }
    // TODO: optimize so that we hit cache
    //       maybe use the ids to get the last one
    start_date_range = `${local_date}T${local_time}`
  }
  const hot = []
  for (let id in events) {
    let event = events[id]
    let percent = event.yes_rsvp_count / event.rsvp_limit
    let isGettingFull = percent > 0.75 && event.rsvp_limit > 50
    event.is_getting_full = isGettingFull
    if (isGettingFull || event.yes_rsvp_count > 70) {
      console.info(event.name, percent, event.yes_rsvp_count, event.link);
      if (percent) {
        event.percent_full = (percent * 100).toFixed(0)
      }
      event.hot = true
      event.objectID = id
      delete event.description
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
