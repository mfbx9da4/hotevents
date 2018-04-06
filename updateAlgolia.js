var algoliasearch = require('algoliasearch')
var config = require('config')
const chunk = require('lodash.chunk')
const records = require('./hot-sf.json')
const eventbriteRecords = require('./hot-sf-eventbrite.json')

const client = algoliasearch(config.get('algolia.app_id'), config.get('algolia.admin_api_key'))
const index = client.initIndex('sf-events')

index.setSettings({
  'attributesForFaceting': [
    'group.category.sort_name',
    'is_getting_full',
    'is_from_meetup',
    'is_from_eventbrite',
    'is_full',
    'has_drinks',
    'has_pizza',
    'has_food',
    'is_popular'
  ],
  ranking: [
    'asc(time)',
    'asc(name)'
  ]
})

console.info('Reindex')

function deleteStale(index) {
  const today = new Date()
  // Don't delete events which started in the last 4 hours
  today.setHours(Math.max(today.getHours() - 4, 0))
  const params = {
    filters: `time < ${today.getTime()}`
  }
  index.deleteBy(params, function(err, res) {
    if (err) {
      console.info(err)
    } else {
      console.log('Success Deleted Stale', res)
    }
  })
}

function deleteAll (index) {
  index.deleteByQuery('', function(err, res) {
    if (err) {
      console.info(err)
    } else {
      console.log('Success Deleted All', res)
    }
  })
}

function uploadRecords (items) {
  const chunks = chunk(items, 1000)
  chunks.map(function(batch, i) {
    console.info('Indexed batch', i)
    return index.addObjects(batch)
  })
}

deleteStale(index)
// deleteAll(index)

console.info('[records, eventbriteRecords]', [records.length, eventbriteRecords.length]);
[records, eventbriteRecords].map(uploadRecords)
