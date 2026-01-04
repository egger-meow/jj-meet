/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('blocks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('blocker_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('blocked_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('reason', 100);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['blocker_id', 'blocked_id']);
    table.index('blocker_id');
    table.index('blocked_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('blocks');
};
