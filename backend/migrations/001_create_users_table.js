exports.up = function(knex) {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .raw('CREATE EXTENSION IF NOT EXISTS "postgis"')
    .createTable('users', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('email').unique().notNullable();
      table.string('phone').unique();
      table.string('password').notNullable();
      table.string('name').notNullable();
      table.date('birth_date').notNullable();
      table.enum('gender', ['male', 'female', 'other']);
      table.text('bio', 500);
      table.enum('user_type', ['tourist', 'local', 'both']).defaultTo('tourist');
      table.boolean('is_guide').defaultTo(false);
      table.boolean('has_car').defaultTo(false);
      table.boolean('has_motorcycle').defaultTo(false);
      table.specificType('photos', 'text[]');
      table.string('profile_photo');
      table.specificType('languages', 'text[]');
      table.specificType('interests', 'text[]');
      table.float('rating').defaultTo(0);
      table.integer('rating_count').defaultTo(0);
      table.boolean('is_verified').defaultTo(false);
      table.boolean('email_verified').defaultTo(false);
      table.boolean('phone_verified').defaultTo(false);
      table.geography('location', 'POINT', 4326);
      table.string('city');
      table.string('country');
      table.timestamp('last_active').defaultTo(knex.fn.now());
      table.boolean('is_active').defaultTo(true);
      table.json('preferences').defaultTo('{}');
      table.integer('max_distance').defaultTo(50); // km
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('users')
    .raw('DROP EXTENSION IF EXISTS "postgis"')
    .raw('DROP EXTENSION IF EXISTS "uuid-ossp"');
};
