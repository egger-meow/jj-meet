/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('reports', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('reporter_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('reported_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('reason', 100).notNullable();
    table.text('description');
    table.string('status', 20).defaultTo('pending');
    table.uuid('reviewed_by').references('id').inTable('users').onDelete('SET NULL');
    table.text('admin_notes');
    table.string('action_taken', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('reviewed_at');

    table.index('reporter_id');
    table.index('reported_id');
    table.index('status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('reports');
};
