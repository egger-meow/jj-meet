exports.up = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.specificType('guide_specialties', 'text[]');
    table.json('guide_availability');
    table.decimal('hourly_rate', 10, 2);
    table.text('guide_description');
    table.timestamp('guide_verified_at');
    table.integer('years_experience').defaultTo(0);
    table.specificType('tour_types', 'text[]');
    table.string('guide_city');
    table.specificType('guide_languages', 'text[]');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.dropColumn('guide_specialties');
    table.dropColumn('guide_availability');
    table.dropColumn('hourly_rate');
    table.dropColumn('guide_description');
    table.dropColumn('guide_verified_at');
    table.dropColumn('years_experience');
    table.dropColumn('tour_types');
    table.dropColumn('guide_city');
    table.dropColumn('guide_languages');
  });
};
