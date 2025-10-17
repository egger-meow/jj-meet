exports.up = function(knex) {
  return knex.schema.createTable('swipes', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('swiper_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('swiped_id').references('id').inTable('users').onDelete('CASCADE');
    table.enum('direction', ['like', 'pass', 'super_like']).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Ensure unique swipe per user pair
    table.unique(['swiper_id', 'swiped_id']);
    table.index(['swiper_id', 'created_at']);
    table.index(['swiped_id', 'direction']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('swipes');
};
