const cheerio = require('cheerio')
const getUrls = require('get-urls')

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

function addTimeOfDayTags (event) {

}

function addDescriptionTags (event, description, tags) {
  event.urls = []
  if (description) {
    const $ = cheerio.load(description);
    let urls = []
    $('a').each((i, e) => {
      urls.push($(e).attr('href'))
    })

    const stt = /\s+[\.,\-&]{0,3}/
    const end = /[\.,\-&]{0,3}\s+/


    let desc = $.text().toLowerCase()
    tags.is_paid = (RegExp(`a paid event`)).test(desc)
    tags.has_drinks = (RegExp(stt.source + '(drinks)' + end.source)).test(desc)
    tags.has_food = (RegExp(stt.source + '(foods?|refreshments)' + end.source)).test(desc)
    tags.has_pizza = (RegExp(stt.source + '(pizza)' + end.source)).test(desc)

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
}

module.exports = {
  addTagsToEvent,
  addDescriptionTags,
  addTimeOfDayTags
}
