/**
 * Migration: Add is_seen field to swipes table
 * 
 * Adds:
 * - is_seen boolean for "new likes" badge feature
 * - Partial index for efficient unseen likes queries
 */

exports.up = function(knex) {
  return knex.schema
    .alterTable('swipes', (table) => {
      table.boolean('is_seen').defaultTo(false);
    })
    .then(() => {
      return knex.raw(
        'CREATE INDEX IF NOT EXISTS swipes_unseen_idx ON swipes(swiped_id, is_seen) WHERE is_seen = false'
      );
    });
};

exports.down = function(knex) {
  return knex.raw('DROP INDEX IF EXISTS swipes_unseen_idx')
    .then(() => {
      return knex.schema.alterTable('swipes', (table) => {
        table.dropColumn('is_seen');
      });
    });
};
