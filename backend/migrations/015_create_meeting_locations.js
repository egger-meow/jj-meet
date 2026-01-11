exports.up = function(knex) {
  return knex.schema
    .createTable('meeting_locations', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name').notNullable();
      table.string('address');
      table.geography('location', 'POINT', 4326);
      table.string('city');
      table.string('country');
      table.string('category');
      table.integer('safety_score').defaultTo(3);
      table.boolean('is_verified').defaultTo(false);
      table.string('google_place_id');
      table.json('metadata');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('meeting_proposals', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('proposer_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('match_id').references('id').inTable('matches').onDelete('CASCADE');
      table.uuid('location_id').references('id').inTable('meeting_locations').onDelete('SET NULL');
      table.string('custom_location_name');
      table.string('custom_location_address');
      table.geography('custom_location', 'POINT', 4326);
      table.timestamp('proposed_time');
      table.string('status').defaultTo('pending');
      table.text('message');
      table.timestamp('responded_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('meeting_proposals')
    .dropTableIfExists('meeting_locations');
};
