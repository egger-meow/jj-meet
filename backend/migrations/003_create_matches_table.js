exports.up = function(knex) {
  return knex.schema.createTable('matches', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user1_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('user2_id').references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('matched_at').defaultTo(knex.fn.now());
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_interaction');
    
    // Ensure unique match per user pair
    table.unique(['user1_id', 'user2_id']);
    table.index(['user1_id', 'is_active']);
    table.index(['user2_id', 'is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('matches');
};
