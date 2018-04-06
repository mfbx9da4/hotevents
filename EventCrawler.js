'use strict'

const fs = require('fs')
const config = require('config')
const redis = require('./redis')
const { fetchCachedUrl } = require('./fetchCacheService')
const cache = require('./cacheService')
const MeetupCrawler = require('./MeetupCrawler')
const EventbriteCrawler = require('./EventbriteCrawler')

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


function writeFile (filename, contents) {
  fs.writeFile(filename, contents, function (err) {
      if (err)
        return console.log(err);
      console.log('wrote ' + filename);
  });
}

async function perform () {
  const crawlerConf = config.get('event_crawler')
  if (!crawlerConf.eventbrite.skip) {
    const res = await EventbriteCrawler.getPages(fetchCachedUrl, config.get('eventbrite.personal_token'))
    writeFile(crawlerConf.eventbrite.filename, JSON.stringify(res, null, 2))
  }

  if (!crawlerConf.meetup.skip) {
    const res = await MeetupCrawler.getPages(fetchCachedUrl, config.get('meetup.api_key'))
    writeFile(crawlerConf.meetup.filename, JSON.stringify(res, null, 2))
  }

}

async function main () {
  let performed = false
  redis.on('connect', async () => {
    console.info('connected');
    !performed && await perform()
    performed = true
    redis.quit()
  })
  redis.on('error', () => {
    console.info('error');
    !performed && perform()
    performed = true
    redis.quit()
  })
}

main()
