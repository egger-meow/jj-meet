exports.up = function(knex) {
  return knex.schema.createTable('moderation_logs', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('admin_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('target_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('action').notNullable();
    table.string('reason');
    table.json('metadata');
    table.string('ip_address');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['target_user_id', 'created_at']);
    table.index(['admin_id', 'created_at']);
    table.index(['action', 'created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('moderation_logs');
};
