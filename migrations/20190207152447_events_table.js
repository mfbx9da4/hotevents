exports.up = async function(knex) {
  console.log('got here')
  await knex.schema.createTable('events', function(table) {
    table.increments()
    table.jsonb('json')
    table.timestamps()
  })
}

exports.down = async function(knex) {
  await knex.schema.dropTable('events')
}
