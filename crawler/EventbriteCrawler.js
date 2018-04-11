'use strict'

const moment = require('moment')
const { addTagsToEvent, addDescriptionTags, addTimeOfDayTags } = require('./utils')

const LOOKAHEAD = 100
const PAGE_SIZE = 100
const BASE_URL = `https://www.eventbriteapi.com/v3`

function objectToParams(object) {
  const params = Object.keys(object)
    .map(key => `${key}=${object[key]}`)
    .join('&')
  return params
}

async function getPage (fetch, {start_date_range, continuation, token}) {
  const paramsObject = {
    'location.latitude': 37.771707,
    'location.longitude': -122.405377,
    'location.within': '10mi',
    sort_by: 'date',
    token,
    'start_date.range_start': start_date_range
  }
  if (continuation) {
    paramsObject.continuation = continuation
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

async function getCategories (fetch, token) {
  let url = `${BASE_URL}/categories?token=${token}`
  const obj = JSON.parse(await fetch(url))
  return obj
}

async function getSubCategories (fetch, token) {
  let url = `${BASE_URL}/subcategories?token=${token}`
  const obj = JSON.parse(await fetch(url))
  return obj
}

async function getEventTicketClasses (fetch, id, token) {
  let url = `${BASE_URL}/events/${id}/ticket_classes?token=${token}`
  const obj = JSON.parse(await fetch(url))
  return obj
}

/**
 * Aim to do all requests in here as it is the bottleneck.
 */
async function getPages (fetch, token) {
  const categories = Array.from((await getCategories(fetch, token)).categories)
  const categoriesMap = {}
  for (let item of categories) {
    categoriesMap[item.id] = item.name
  }
  // let start_date_range = moment().format('YYYY-MM-DDTHH:mm:ss')
  let start_date_range = moment().format('YYYY-MM-DDT00:00:00\\Z')
  let total = 0
  let events = {}
  let res, continuation
  while (total < LOOKAHEAD) {
    if (!total) {
      res = await getPage(fetch, {start_date_range, token})
    } else {
      res = await getPage(fetch, {start_date_range, continuation, token})
    }
    if (!res.events) { break }
    continuation = res.pagination.continuation
    total += res.events.length
    let id, time, local_date, local_time, venue
    const detailsRequests = []
    const ticketsRequests = []
    for (let event of res.events) {
      id = event.id; time = event.time; venue = event.venue
      start_date_range = event.start.utc
      console.info('event.name.text', event.name.text, new Date(event.start.utc));
      // TODO: parralelize
      // event = Object.assign(event, await getEvent(fetch, id, token))
      // event.ticket_classes = await getEventTicketClasses(fetch, id, token)
      detailsRequests.push(getEvent(fetch, id, token))
      ticketsRequests.push(getEventTicketClasses(fetch, id, token))
      events[id] = event
    }

    // Wait for all parralelized requests from earlier
    const details = await Promise.all(detailsRequests)
    console.info('details[0]', details[0]);
    details.map((detail) => {
      events[detail.id] = Object.assign(events[detail.id], detail)
    })
    const tickets = await Promise.all(ticketsRequests)
    console.info('tickets[0]', tickets[0]);
    tickets.map((ticket) => {
      if (!ticket.ticket_classes.length) return
      const event_id = ticket.ticket_classes[0].event_id
      events[event_id].ticket_classes = ticket
    })


    if (!res.pagination.has_more_items) { break }
  }

  return parsePages(events, categoriesMap)
}

function parsePages(events, categories) {
  const hot = []
  for (let id in events) {
    let event = events[id]
    const tags = []
    // console.info('Object.keys(event)', Object.keys(event));
    // console.info('ticket_classes', event.ticket_classes);

    const category_id = event.category_id || event.subcategory_id
    if (category_id) {
      event.category_name = categories[category_id]
    }

    tags.is_from_eventbrite = true
    tags.is_getting_full = false
    tags.is_popular = false
    tags.is_full = false

    addTimeOfDayTags(event, tags)
    addDescriptionTags(event, event.description.html, tags)
    addTagsToEvent(event, tags)
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
    const cost = ticket.cost || {}
    event.fee.amount = cost.major_value
    event.fee.currency = cost.currency
  }
  event.objectID = `ebrite:${event.id}`
  for (let i = 0; i < event.ticket_classes.ticket_classes.length; i++) {
    delete event.ticket_classes.ticket_classes[i].description
  }

  if (event.ticket_classes.ticket_classes.length) {
    // TODO: improve which ones to keep
    // limiting to 5 to avoid breaking algolia mem limits
    event.ticket_classes.ticket_classes = event.ticket_classes.ticket_classes.slice(0, 5)
  }

  const category = event.category_name
  if (category) {
    event.group = {category: {sort_name: category}}
  }
  return event
}

module.exports = {
  getPage,
  getPages
}
