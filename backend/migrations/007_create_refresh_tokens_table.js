/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('device_id').notNullable();
    table.string('device_name', 255);
    table.string('platform', 20);
    table.string('token_hash', 64).notNullable();
    table.uuid('family_id').notNullable();
    table.string('status', 20).defaultTo('active');
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('last_used_at').defaultTo(knex.fn.now());
    table.timestamp('used_at');
    table.timestamp('revoked_at');
    table.string('revoked_reason', 50);
    table.string('ip_address', 45);
    table.text('user_agent');

    table.index('user_id');
    table.index('family_id');
    table.index('token_hash');
    table.index('status');
    table.index('device_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('refresh_tokens');
};
