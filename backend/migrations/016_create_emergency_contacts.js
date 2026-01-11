exports.up = function(knex) {
  return knex.schema
    .createTable('emergency_contacts', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('phone').notNullable();
      table.string('email');
      table.string('relationship');
      table.boolean('is_primary').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('meeting_shares', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('match_id').references('id').inTable('matches').onDelete('CASCADE');
      table.uuid('contact_id').references('id').inTable('emergency_contacts').onDelete('CASCADE');
      table.string('meeting_location');
      table.geography('meeting_coordinates', 'POINT', 4326);
      table.timestamp('meeting_time');
      table.string('meeting_with_name');
      table.string('status').defaultTo('active');
      table.timestamp('shared_at').defaultTo(knex.fn.now());
      table.timestamp('expires_at');
      table.timestamp('checked_in_at');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('meeting_shares')
    .dropTableIfExists('emergency_contacts');
};
