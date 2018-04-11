const moment = require('moment')
const getUrls = require('get-urls')

const FETCH_SIZE_LIMIT = 100000

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

async function getPage (fetch, {start_date_range, key}) {
  const paramsObject = {
    lat: 37.771707,
    lon: -122.405377,
    radius: 5,
    order: 'time',
    page: 500,
    key,
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
    const text = await fetch(url)
    const res = JSON.parse(text)
    return res
  } catch (err) {
    console.info('err', err);
    return err
  }
}

async function getPages (fetch, apikey) {
  // let start_date_range = moment().format('YYYY-MM-DDTHH:mm:ss')
  let start_date_range = moment().format('YYYY-MM-DDT00:00:00')
  let total = 0
  let events = {}
  let prev_start_date_range = ''
  while (total < FETCH_SIZE_LIMIT && prev_start_date_range !== start_date_range) {
    let res = await getPage(fetch, {start_date_range, key: apikey})
    if (!res.events) { break }
    total += res.events.length
    let id, time, local_date, local_time, venue
    for (var event of res.events) {
      id = event.id; time = event.time; venue = event.venue
      local_date = event.local_date || local_date;
      local_time = event.local_time || local_time;
      events[id] = event
    }
    // TODO: optimize so that we hit cache
    // maybe use the ids to get the last one
    prev_start_date_range = start_date_range
    start_date_range = `${local_date}T${local_time}`
  }
  return parsePages(events)
}

function parsePages(events) {
  const hot = []
    for (let id in events) {
      let event = events[id]

      if (event.series || blackList.has(id) || !event.local_date) {
        /**
         * ignore repeat events
         * as the rsvp counts are innacurate
         */
        delete events[id]
        continue
      }

      let tags = []
      event.objectID = id
      tags.is_from_meetup = true

      let percent = event.yes_rsvp_count / event.rsvp_limit
      let isGettingFull = percent < 1 && percent > 0.75
      tags.is_getting_full = isGettingFull
      // TODO: is_popular should be above average which
      // should be dynamically calculated for the region
      tags.is_popular = event.yes_rsvp_count > 30
      tags.is_full = !!(event.rsvp_limit && percent >= 1)
      event.percent = percent

      if (percent) {
        event.percent_full = (percent * 100).toFixed(0)
      }

      event.urls = []
      if (event.description) {
        const urls = getUrls(event.description)
        let desc = event.description.toLowerCase()
        tags.is_paid = desc.indexOf('a paid event') > -1
        tags.has_drinks = desc.indexOf(' drinks ') > -1
        tags.has_food = desc.indexOf(' food ') > -1 || desc.indexOf('refreshments') > -1
        tags.has_pizza = desc.indexOf(' pizza ') > -1

        addTagsToEvent(event, tags)

        // get urls
        for (let url of urls) {
          event.urls.push(url)
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

      // let isHot = isGettingFull || event.is_full || event.is_popular
      // let isHot = isGettingFull
      let isHot = true
      if (isHot) {
        event.is_hot = true
        delete event.description
        hot.push(event)
      }
    }
    console.info('hot', hot.length);
    return hot
}

function addTagsToEvent (event, tags) {
  event._tags = []
  for (let name in tags) {
    let value = tags[name]
    event[name] = value
    if (value) {
      event._tags.push(name)
    }
  }
}

module.exports = {
  getPage,
  getPages
}
