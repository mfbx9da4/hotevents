const knexLib = require('knex')
const config = require('config')

class PGLoader {
  constructor(connection = config.get('pg')) {
    this.knex = knexLib({
      client: 'postgresql',
      connection,
    })
  }

  async insertRow(trx, data) {
    await trx('events').insert({
      data,
    })
  }

  async load(rows) {
    await this.knex.transaction(async (trx) => {
      await trx('events').delete()
      for (let i = 0; i < rows.length; i++) {
        let item = rows[i]
        await this.insertRow(trx, item)
      }
    })
    console.log('finished')
  }
}

module.exports = {
  PGLoader,
}
