'use strict'

const fs = require('./fsUtils')
const config = require('config')
const redis = require('./redis')
const { fetchCachedUrl } = require('./fetchCacheService')
const cache = require('./cacheService')
const MeetupCrawler = require('./MeetupCrawler')
const EventbriteCrawler = require('./EventbriteCrawler')
const is_production = process.env.NODE_ENV === 'production'
const path = require('path')
const _ = require('underscore')

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

async function perform() {
  console.info('perform')
  const crawlerConf = config.get('event_crawler')
  let ebRes
  if (!crawlerConf.eventbrite.skip) {
    ebRes = await EventbriteCrawler.getPages(
      fetchCachedUrl,
      config.get('eventbrite.personal_token')
    )
    console.info('Eventbrite', ebRes.length)
    await fs.writeFile(
      crawlerConf.eventbrite.filename,
      JSON.stringify(ebRes, null, 2)
    )
  }

  let meetupRes
  if (!crawlerConf.meetup.skip) {
    meetupRes = await MeetupCrawler.getPages(
      fetchCachedUrl,
      config.get('meetup.api_key')
    )
    console.info('Meetup', meetupRes.length)
    await fs.writeFile(
      crawlerConf.meetup.filename,
      JSON.stringify(meetupRes, null, 2)
    )
    await fs.writeFile(
      `./out/meetup/meetup${Date.now()}.json`,
      JSON.stringify(meetupRes, null, 2)
    )
  }
  return [ebRes, meetupRes]
}

async function main(done) {
  console.info('main')
  let performed = false

  const doPerform = async (done) => {
    if (!performed) {
      performed = true
      const res = await perform()
      redis.quit()
      done(null, res)
    }
  }

  redis.on('connect', async () => {
    console.info('Redis connected')
    await doPerform(done)
  })

  redis.on('error', async () => {
    console.info('Redis connection error')
    await doPerform(done)
  })
}

function waitForRedisAndPerform() {
  return new Promise(function(resolve, reject) {
    main((err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = waitForRedisAndPerform
