'use strict'

const moment = require('moment')
const getUrls = require('get-urls')

const LOOKAHEAD = 1000
const BASE_URL = `https://www.eventbriteapi.com/v3`

function objectToParams(object) {
  const params = Object.keys(object)
    .map(key => `${key}=${object[key]}`)
    .join('&')
  return params
}

async function getPage (fetch, {start_date_range, token}) {
  const paramsObject = {
    'location.latitude': 37.771707,
    'location.longitude': -122.405377,
    'location.within': '5mi',
    token,
    'start_date.range_start': start_date_range
  }
  const params = objectToParams(paramsObject)
  console.info('params', params);
  const url = `${BASE_URL}/events/search?${params}`
  const text = await fetch(url)
  const res = JSON.parse(text)
  if (res.error) {
    console.info(res);
  }
  return res
}

async function getEvent (fetch, id, token) {
  console.info('getEvent', id);
  let url = `${BASE_URL}/events/${id}?token=${token}`
  const obj = JSON.parse(await fetch(url))
  return obj
}

async function getEventTicketClasses (fetch, id, token) {
  console.info('getEventTicketClasses', id);
  let url = `${BASE_URL}/events/${id}/ticket_classes?token=${token}`
  const obj = JSON.parse(await fetch(url))
  return obj
}

/**
 * Aim to do all requests in here as it is the bottleneck.
 */
async function getPages (fetch, token) {
  // let start_date_range = moment().format('YYYY-MM-DDTHH:mm:ss')
  let start_date_range = moment().format('YYYY-MM-DDT00:00:00')
  let total = 0
  let events = {}
  while (total < LOOKAHEAD) {
    let res = await getPage(fetch, {start_date_range, token})
    if (!res.events) { break }
    total += res.events.length
    let id, time, local_date, local_time, venue
    for (let event of res.events) {
      id = event.id; time = event.time; venue = event.venue
      start_date_range = event.start.local
      event = Object.assign(event, await getEvent(fetch, id, token))
      event.ticket_classes = await getEventTicketClasses(fetch, id, token)
      events[id] = event
    }
  }
  return parsePages(events)
}

function parsePages(events) {
  const hot = []
  for (let id in events) {
    let event = events[id]
    // console.info('Object.keys(event)', Object.keys(event));
    // console.info('ticket_classes', event.ticket_classes);
    // console.info('quantity_sold', event.quantity_sold);
    event._tags = []
    event._tags.push('is_from_eventbrite')
    event.is_from_eventbrite = true
    hot.push(normalizeEvent(event))
  }
  return hot
}

function normalizeEvent (event) {
  event.name = event.name.text
  delete event.description
  event.local_date = event.start.local.split('T')[0]
  event.local_time = event.start.local.split('T')[1].substring(0, 5)
  event.link = event.url
  event.time = moment(event.start.utc).unix() * 1000
  const ticket = event.ticket_classes.ticket_classes[0]
  event.fee = {}
  if (!ticket.free) {
    ticket.is_paid = true
    event.fee.amount = ticket.cost.major_value
    event.fee.currency = ticket.cost.currency
  }
  event.objectID = `ebrite:${event.id}`
  for (let i = 0; i < event.ticket_classes.ticket_classes.length; i++) {
    delete event.ticket_classes.ticket_classes[i].description
  }
  return event
}

module.exports = {
  getPage,
  getPages
}
