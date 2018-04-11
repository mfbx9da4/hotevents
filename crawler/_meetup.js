'use strict'

// refactored into meetup_crawler and event_crawler

const fs = require('fs')
const fetch = require('isomorphic-fetch')
const moment = require('moment')
const getUrls = require('get-urls')
const config = require('config')
const redis = require('./redis')
const { fetchCachedUrl } = require('./fetchCacheService')
const cache = require('./cacheService')

// A list of events which change the event
// date each time look like they have a big event
// and aggregate memers
const blackList = new Set([
  'qpqvxjyskbdb',
  'qrkqwjytcbcc',
  'qrwlqhytcbcc',
  '132309232',
  '55260062'
])

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const APIKEY = config.get('meetup.api_key')
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
    fields: 'group_topics,series,group_membership_dues,group_category',
    start_date_range
  }
  const params = Object.keys(paramsObject)
    .map(key => `${key}=${paramsObject[key]}`)
    .join('&')
  console.info('params', params);
  // Documentation: https://www.meetup.com/meetup_api/docs/find/upcoming_events/
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

const today_local_date = moment().format('YYYY-MM-DD')

async function search () {
  // let start_date_range = moment().format('YYYY-MM-DDTHH:mm:ss')
  let start_date_range = moment().format('YYYY-MM-DDT00:00:00')
  let total = 0
  let events = {}
  let prev_start_date_range = ''
  while (total < 10000 && prev_start_date_range !== start_date_range) {
    let res = await getEvents({start_date_range})
    if (!res.events) { break }
    total += res.events.length
    let id, time, local_date, local_time, venue
    for (var event of res.events) {
      id = event.id; time = event.time; venue = event.venue
      local_date = event.local_date || local_date;
      local_time = event.local_time || local_time;
      events[id] = event
      // await cache.set(`event:${id}`, JSON.stringify(event), 'EX', 10)
    }
    // TODO: optimize so that we hit cache
    // maybe use the ids to get the last one
    prev_start_date_range = start_date_range
    start_date_range = `${local_date}T${local_time}`
  }
  const hot = []
  for (let id in events) {
    let event = events[id]

    if (event.series || blackList.has(id)) {
      /**
       * ignore repeat events
       * as the rsvp counts are innacurate
       */
      delete events[id]
      continue
    }

    event.objectID = id

    let percent = event.yes_rsvp_count / event.rsvp_limit
    let isGettingFull = percent < 1 && percent > 0.75
    event.is_getting_full = isGettingFull
    event.is_popular = event.yes_rsvp_count > 70
    event.is_full = event.rsvp_limit && percent > 1
    event.percent = percent

    if (percent) {
      event.percent_full = (percent * 100).toFixed(0)
    }

    if (event.description) {
      const urls = getUrls(event.description)
      event.urls = urls
      event.is_paid = event.description.indexOf('a paid event') > -1
      for (let url of urls) {
        if (url.indexOf('eventbrite.com/') > -1) {
          if (!event.eventbrite_link || url < event.eventbrite_link) {
            event.eventbrite_link = url
          }
        } else if (url.indexOf('/forms') > -1) {
          if (!event.form_link || url < event.form_link) {
            event.form_link = url
          }
        }
      }
    }

    let isHot = isGettingFull || event.is_full || event.is_popular
    // let isHot = isGettingFull
    if (isHot) {
      event.is_hot = true
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
