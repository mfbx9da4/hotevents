const knexLib = require('knex')
const config = require('config')

class QueryService {
  constructor(connection = config.get('pg')) {
    this.knex = knexLib({
      client: 'postgresql',
      connection,
      debug: true,
    })
  }

  async query(query) {
    console.log('query', query)
    let queryPlaceHolderString = ''
    let queryPlaceHolders = []
    let transformedQuery = {}
    let namedBindings = {}
    let i = 0
    for (let key in query) {
      i++
      transformedQuery[`data->'${key}'`] = query[key]
      namedBindings[`value${i}`] = query[key]
      namedBindings[`value${i}`] = query[key]
      queryPlaceHolders.push(`:property${i}: = :value${i}`)
    }

    queryPlaceHolderString = queryPlaceHolders.join(' and ')

    return await this.knex.select('*').from('events')
    // .whereRaw(`${queryPlaceHolderString}`, {
    //   transformedQuery,
    // })
  }
}

module.exports = {
  QueryService,
}
