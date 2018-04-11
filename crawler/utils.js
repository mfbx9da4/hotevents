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
    const urls = getUrls(description)
    let desc = description.toLowerCase()
    tags.is_paid = desc.indexOf('a paid event') > -1
    tags.has_drinks = desc.indexOf(' drinks ') > -1
    tags.has_food = desc.indexOf(' food ') > -1 || desc.indexOf('refreshments') > -1
    tags.has_pizza = desc.indexOf(' pizza ') > -1

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
