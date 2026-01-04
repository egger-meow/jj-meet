/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('trips', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.specificType('destination_geom', 'geometry(Point, 4326)');
    table.string('destination_name', 255).notNullable();
    table.string('destination_country', 100);
    table.string('destination_city', 100);
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.text('description');
    table.string('travel_style', 50);
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_public').defaultTo(true);
    table.jsonb('preferences').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index(['start_date', 'end_date']);
    table.index('is_active');
  })
  .then(() => {
    return knex.raw(`
      CREATE INDEX trips_destination_idx ON trips USING GIST (destination_geom);
    `);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('trips');
};
