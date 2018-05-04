'use strict'

const fs = require('fs')
const config = require('config')
const redis = require('./redis')
const { fetchCachedUrl } = require('./fetchCacheService')
const cache = require('./cacheService')
const MeetupCrawler = require('./MeetupCrawler')
const EventbriteCrawler = require('./EventbriteCrawler')
const is_production = process.env.NODE_ENV === 'production'

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


function writeFile (filename, contents) {
  if (is_production) return
  return new Promise(function(resolve, reject) {
    fs.writeFile(filename, contents, function (err, res) {
      if (err) {
        console.info('Err writing file', err);
        return reject(err)
      }
      console.log('wrote ' + filename);
      return resolve(res)
    });
  })
}

async function perform () {
  console.info('perform');
  const crawlerConf = config.get('event_crawler')
  if (!crawlerConf.eventbrite.skip) {
    const res = await EventbriteCrawler.getPages(fetchCachedUrl, config.get('eventbrite.personal_token'))
    console.info('Eventbrite', res.length);
    await writeFile(crawlerConf.eventbrite.filename, JSON.stringify(res, null, 2))
  }

  if (!crawlerConf.meetup.skip) {
    const res = await MeetupCrawler.getPages(fetchCachedUrl, config.get('meetup.api_key'))
    console.info('Meetup', res.length);
    await writeFile(crawlerConf.meetup.filename, JSON.stringify(res, null, 2))
  }

}

async function main (done) {
  console.info('main');
  let performed = false

  const doPerform = async (done) => {
    if (!performed) {
      performed = true
      await perform()
      redis.quit()
      done()
    }
  }

  redis.on('connect', async () => {
    console.info('Redis connected');
    await doPerform(done)
  })

  redis.on('error', async () => {
    console.info('Redis connection error');
    await doPerform(done)
  })
}

function waitForMain () {
  return new Promise(function(resolve, reject) {
    main((err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = waitForMain
