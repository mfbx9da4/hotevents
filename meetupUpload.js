var algoliasearch = require('algoliasearch');
var config = require('config');
const chunk = require('lodash.chunk')
const records = require('./hot-sf.json')

const client = algoliasearch(config.get('algolia.app_id'), config.get('algolia.admin_api_key'));
const index = client.initIndex('sf-events');

const params = {
  filters: `time < ${Date.now()}`
}
index.deleteBy(params, function(err, res) {
  if (err) {
    console.info(err)
  } else {
    console.log('Success Deleted Stale', res)
  }
})

function deleteAll (index) {
  index.deleteByQuery('', function(err, res) {
    if (err) {
      console.info(err)
    } else {
      console.log('Success Deleted All', res)
    }
  })
}

// deleteAll(index)
const chunks = chunk(records, 1000)

chunks.map(function(batch) {
  return index.addObjects(batch)
})
