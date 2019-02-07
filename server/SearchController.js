const { QueryService } = require('./QueryService')

class SearchController {
  constructor() {
    this.service = new QueryService()
    this.hi = 1
    console.log('hi')
  }

  async perform(req, res) {
    console.log('hi')
    let result = await this.service.query(req.query)
    let body = JSON.stringify(result, null, 2)
    res.setHeader('Content-Type', 'text/json')
    console.log('body', body)
    res.end(body)
  }
}

module.exports = {
  SearchController,
}
