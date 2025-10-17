exports.up = function(knex) {
  return knex.schema.createTable('messages', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('match_id').references('id').inTable('matches').onDelete('CASCADE');
    table.uuid('sender_id').references('id').inTable('users').onDelete('CASCADE');
    table.text('content');
    table.string('attachment_url');
    table.enum('attachment_type', ['image', 'location', 'audio']);
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['match_id', 'created_at']);
    table.index(['sender_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('messages');
};
