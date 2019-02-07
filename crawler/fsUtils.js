const is_production = process.env.NODE_ENV === 'production'
const fs = require('fs')

function getMostRecentFileName(dir) {
  var files = fs.readdirSync(dir)

  // use underscore for max()
  return _.max(files, function(f) {
    var fullpath = path.join(dir, f)

    // ctime = creation time is used
    // replace with mtime for modification time
    return fs.statSync(fullpath).ctime
  })
}

function writeFile(filename, contents) {
  if (is_production) return
  return new Promise(function(resolve, reject) {
    fs.writeFile(filename, contents, function(err, res) {
      if (err) {
        console.info('Err writing file', err)
        return reject(err)
      }
      console.log('wrote ' + filename)
      return resolve(res)
    })
  })
}

function readFile(filename, contents) {
  if (is_production) return
  return new Promise(function(resolve, reject) {
    fs.readFile(filename, contents, function(err, res) {
      if (err) {
        console.info('Err writing file', err)
        return reject(err)
      }
      console.log('wrote ' + filename)
      return resolve(res)
    })
  })
}

function renameFile(filename, filenameNew) {
  if (is_production) return
  return new Promise(function(resolve, reject) {
    fs.rename(filename, filenameNew, function(err, res) {
      if (err) {
        console.info('Err renaming file', err)
        return reject(err)
      }
      console.log('renamed ' + filename, 'to', filenameNew)
      return resolve(res)
    })
  })
}

module.exports = { writeFile, readFile, renameFile, getMostRecentFileName }
