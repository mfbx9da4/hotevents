const sirv = require('sirv')
const polka = require('polka')
const { basename } = require('path')
const compression = require('compression')()
const { readFileSync } = require('fs')
const { SearchController } = require('./SearchController')
// const { h } = require('preact')
// const render = require('preact-render-to-string')
// const bundle = require('./server/build/ssr-build/ssr-bundle')

// const App = bundle.default
const RGX = /<div id="app"[^>]*>.*?(?=<script)/i
const template = readFileSync('./server/build/index.html', 'utf8')

const { PORT = 3000 } = process.env

function setHeaders(res, file) {
  let cache =
    basename(file) === 'sw.js'
      ? 'private,no-cache'
      : 'public,max-age=31536000,immutable'
  res.setHeader('Cache-Control', cache) // don't cache service worker file
}

let searchController = new SearchController()
console.log('asdf')

polka()
  .use(compression)
  .use(sirv('./server/build', { setHeaders }))
  .get('/search', (req, res) =>
  {
    searchController.perform(req, res)
  })
  .get('*', (req, res) => {
    let body = JSON.stringify(req.url, null, 2)
    res.setHeader('Content-Type', 'text/html')
    console.log('body', body)
    res.end(template.replace(RGX, body))
  })
  .listen(PORT, (err) => {
    if (err) throw err
    console.log(`> Running a on localhost:${PORT}`)
  })
