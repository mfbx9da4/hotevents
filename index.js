'use strict'

const EventCrawler = require('./crawler/EventCrawler')
const { PGLoader } = require('./crawler/postgresql/load')
const updateAlgolia = require('./crawler/updateAlgolia')
const { readFile } = require('./crawler/fsUtils')
const removeUnchangedItems = require('./crawler/removeUnchangedItems')
const is_production = process.env.NODE_ENV === 'production'

console.log('Reloaded lambda function')
console.info('is_production', is_production)

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

async function loadAlgolia(data) {
  data = await removeUnchangedItems(data)
  console.log('AreNew-data.length', data.length)
  await updateAlgolia(data, [])
}

async function loadPg(data) {
  let psg = new PGLoader()
  psg.load(data)
}

async function handler(event, context, callback) {
  console.log('From /tmp/ event:', JSON.stringify(event, null, 2))
  let [ebRes, meetupRes] = await EventCrawler()
  console.log('Crawled-meetupRes.length', meetupRes.length)
  loadPg(meetupRes)
  loadAlgolia(meetupRes)
  callback(null, event.key1)
}

async function loadTest() {
  let data = await readFile(
    '/Users/DavidAdler/code/misc/meetup-hot/out/meetup/meetup1538573629305.json'
  )
  let dataObj = JSON.parse(data.toString())
  loadPg(dataObj)
}

exports.handler = handler

const firstArg = process.argv[2]
if (firstArg === '--load-test') {
  loadTest()
} else if (firstArg === '--run' || !is_production) {
  exports.handler({}, {}, () => {})
}
