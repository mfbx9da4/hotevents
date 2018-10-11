var algoliasearch = require('algoliasearch')
var config = require('config')
const chunk = require('lodash.chunk')

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

async function setIndexSettings () {
  console.info('setIndexSettings');
  const client = algoliasearch(config.get('algolia.app_id'), config.get('algolia.admin_api_key'))
  const index = client.initIndex('sf-events')
  const params = {
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
  }
  const res = await setSettings(index, params)
  return index
}

function setSettings (index, arg1) {
  return new Promise(function(resolve, reject) {
    index.setSettings(arg1, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

function deleteAll (index) {
  return new Promise(function(resolve, reject) {
    index.deleteByQuery('', (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

function deleteStale (index) {
  // Don't delete events which started in the last 4 hours
  const today = new Date()
  today.setHours(Math.max(today.getHours() - 4, 0))
  const params = {
    filters: `time < ${today.getTime() * 1000}`
  }
  console.log('deleteStale', params)
  return new Promise(function(resolve, reject) {
      index.deleteBy(params, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
  })
}

function addObjects (index, batch) {
  return new Promise(function(resolve, reject) {
    index.addObjects(batch, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

async function uploadRecords (index, items) {
  const chunks = chunk(items, 500)
  return Promise.all(chunks.slice().map(async function(batch, i) {
    for (let item of batch) {
      // console.info('batch.name', item.id, item.name);
    }
    const res = await addObjects(index, batch)
    console.info('Indexed batch', i, res.length, res.objectIDs.length)
    return res
  }))
}

async function main (records, eventbriteRecords) {
  records = records || require('./hot-sf.json')
  eventbriteRecords = eventbriteRecords || require('./hot-sf-eventbrite.json')
  const index = await setIndexSettings()
  const deleteStaleRes = await deleteStale(index)
  console.info('deleteStaleRes', deleteStaleRes);
  console.info('[records, eventbriteRecords]', [records.length, eventbriteRecords.length]);

  const allRecords = []
  if (!config.get('event_crawler.meetup.skip')) {
    allRecords.push(records)
  }
  if (!config.get('event_crawler.eventbrite.skip')) {
    allRecords.push(eventbriteRecords)
  }
  try {
    const uploadRes = await Promise.all(allRecords.map(uploadRecords.bind(null, index)))
    console.info('uploadRes', uploadRes);
  } catch (err) {
    console.info('err', err);
  }
}

module.exports = main


