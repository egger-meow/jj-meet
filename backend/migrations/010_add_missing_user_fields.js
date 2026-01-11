/**
 * Migration: Add missing user characteristic fields and GiST index
 * 
 * Adds:
 * - speaks_english, speaks_local, flexible_schedule (from registration form)
 * - last_location_update (for Redis sync tracking)
 * - GiST index on location for fast geo queries
 */

exports.up = function(knex) {
  return knex.schema
    .alterTable('users', (table) => {
      table.boolean('speaks_english').defaultTo(false);
      table.boolean('speaks_local').defaultTo(false);
      table.boolean('flexible_schedule').defaultTo(false);
      table.timestamp('last_location_update');
    })
    .then(() => {
      return knex.raw(
        'CREATE INDEX IF NOT EXISTS users_location_gist_idx ON users USING GIST(location)'
      );
    });
};

exports.down = function(knex) {
  return knex.raw('DROP INDEX IF EXISTS users_location_gist_idx')
    .then(() => {
      return knex.schema.alterTable('users', (table) => {
        table.dropColumn('speaks_english');
        table.dropColumn('speaks_local');
        table.dropColumn('flexible_schedule');
        table.dropColumn('last_location_update');
      });
    });
};
