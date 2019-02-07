const knexLib = require('knex')

class PGLoader {
  constructor(
    connection = {
      host: '127.0.0.1',
      user: 'DavidAdler',
      password: '',
      database: 'DavidAdler',
    }
  ) {
    this.knex = knexLib({
      client: 'postgresql',
      connection,
    })
  }

  async insertRow(trx, data) {
    let res = await trx('books').insert({
      data,
    })
  }

  async load(rows) {
    await this.knex.transaction(async (trx) => {
      await trx('books').delete()
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
