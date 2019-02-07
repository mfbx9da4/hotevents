var algoliasearch = require('algoliasearch')
var config = require('config')

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

const client = algoliasearch(
  config.get('algolia.app_id'),
  config.get('algolia.admin_api_key')
)
const index = client.initIndex('sf-events')

async function search(searhFn, searchParams) {
  return new Promise((res, rej) => {
    index.search(searchParams, (err, data) => {
      if (err) {
        rej(err)
      } else {
        res(data)
      }
    })
  })
}

async function exampleFetch() {
  const filtersObj = {
    has_food: true,
    // 'NOT has_drinks': true
  }
  const filtersArray = []
  for (let key in filtersObj) {
    filtersArray.push(`${key}:${filtersObj[key]}`)
  }
  let filters = filtersArray.join(' AND ')

  const today = new Date()
  today.setHours(Math.max(today.getHours() - 4, 0))
  filters = `time < ${today.getTime() * 1000}`
  const res = await search(index.search, { query: '', filters })
  console.log('res2', res)
}

function fetchAllRecords(done) {
  console.log('fetchAllRecords')
  var browser = index.browseAll()
  var hits = []

  browser.on('result', function onResult(content) {
    console.log('result')
    hits = hits.concat(content.hits)
  })

  browser.on('end', function onEnd() {
    console.log('Finished!')
    console.log('We got %d hits', hits.length)
    done(null, hits)
  })

  browser.on('error', function onError(err) {
    console.log('err', err)
    done(err, hits)
    throw err
  })
}

module.exports = {
  fetchAllRecords,
}
