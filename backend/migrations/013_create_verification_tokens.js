/**
 * Migration: Create verification_tokens table
 * 
 * Used for:
 * - Email verification tokens
 * - Password reset tokens
 * - Other verification flows
 */

exports.up = function(knex) {
  return knex.schema.createTable('verification_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('token', 64).notNullable().unique();
    table.string('type', 20).notNullable(); // 'email', 'password_reset', 'phone'
    table.timestamp('expires_at').notNullable();
    table.boolean('is_used').defaultTo(false);
    table.timestamp('used_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('token');
    table.index('user_id');
    table.index(['type', 'user_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('verification_tokens');
};
