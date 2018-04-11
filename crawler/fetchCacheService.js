const fs = require('fs')
const fetch = require('isomorphic-fetch')
const config = require('config')
const urlParser = require('url')
const redis = require('./redis')

const use_cache = JSON.parse(config.get('fetch_cache.use_cache'))
const CACHE_EXPIRATION = config.get('fetch_cache.expiration')
const save_to_disk = config.get('fetch_cache.save_to_disk')

async function fetchCachedUrl (url, key) {
  key = key || url
  let text
  if (use_cache && redis.connected) {
    text = await redis.getAsync(key)
  }
  if (!text) {
    // miss
    try {
      const res = await fetch(url)
      text = await res.text()
      if (redis.connected) {
        await redis.setAsync(url, text, 'EX', CACHE_EXPIRATION)
      }
    } catch (err) {
      console.info('Error fetching', url, err);
      return 'ERROR_FETCHING_RESOURCE'
    }
  } else {
    // hit
  }

  if (save_to_disk) {
    const filename = `./cached_pages/${encodeURIComponent(key)}.html`
    console.info('save_to_disk', filename);
    fs.writeFile(filename, text, 'utf-8', (res, err) => {
    });
  }
  return text
}

module.exports = {
  fetchCachedUrl
}
