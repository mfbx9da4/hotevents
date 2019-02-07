const fs = require('./fsUtils')
const config = require('config')
const { fetchAllRecords } = require('./searchAlgolia')
const is_production = process.env.NODE_ENV === 'production'
const _ = require('lodash')

function difference(object, base) {
  function changes(object, base) {
    return _.transform(object, function(result, value, key) {
      if (!_.isEqual(value, base[key])) {
        result[key] =
          _.isObject(value) && _.isObject(base[key])
            ? changes(value, base[key])
            : value
      }
    })
  }
  return changes(object, base)
}

/*
 * Object 2 can have stuff not in 1 but
 * if Object 1 is diff or new field return diff
 */
function firstDiff(obj1, obj2, ignore = new Set(), path = []) {
  for (let key in obj1) {
    const val1 = obj1[key]
    const val2 = obj2[key]
    let newPath = path.concat(key)
    let newPathStr = newPath.join('.')
    let val1IsUndefined = typeof val1 === 'undefined'

    if (_.isObject(val1)) {
      if (_.isObject(val2)) {
        return firstDiff(val1, val2, ignore, newPath)
      } else {
        if (!ignore.has(newPathStr) || val1IsUndefined) return newPathStr
      }
    }
    if (val1 !== val2) {
      if (!ignore.has(newPathStr) || val1IsUndefined) return newPathStr
    }
  }
}

async function removeUnchangedItems(newRecords) {
  if (!is_production) {
    const dbRecords = await getUploadedEvents()
    // const dbRecords = require('../out/browse/browseAll1549284693193.json')
    console.log('newRecords.length', newRecords.length)
    console.log('dbRecords.length', dbRecords.length)
    const dbItems = {}
    dbRecords.map((x) => {
      dbItems[x.id] = x
    })
    const newItems = {}
    newRecords.map((x) => {
      newItems[x.id] = x
    })
    let out = []
    for (let key in newItems) {
      let newItem = newItems[key]
      let dbItem = dbItems[key]
      newItem._geoloc = {}
      let venue = newItem.venue || {}
      newItem._geoloc = {
        lat: venue.lat,
        lng: venue.lon,
      }
      if (!dbItem) {
        out.push(newItem)
      } else {
        const diff = firstDiff(
          dbItem,
          newItem,
          new Set(['venue.lat', 'venue.lon', 'group.lat', 'group.lon'])
        )
        if (diff) {
          // console.log('different', dbItem.id, newItem.id, diff)
          console.log(
            `dbItem[${diff}], newItem[${diff}]`,
            _.get(dbItem, diff),
            _.get(newItem, diff)
          )
          out.push(newItem)
        }
      }
    }
    return out
  }
}

async function fetchAll() {
  return new Promise((res, rej) => {
    fetchAllRecords((err, data) => {
      if (err) {
        rej(err)
      } else {
        res(data)
      }
    })
  })
}

async function getUploadedEvents() {
  console.log('getUploadedEvents')
  const records = await fetchAll()
  console.log('records', records.length)
  await fs.writeFile(
    `./out/browse/browseAll${Date.now()}.json`,
    JSON.stringify(records, null, 2)
  )
  return records
}

module.exports = removeUnchangedItems
