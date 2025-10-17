exports.up = function(knex) {
  return knex.schema.createTable('reviews', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('reviewer_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('reviewed_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating').notNullable().checkBetween([1, 5]);
    table.text('comment');
    table.boolean('is_guide_review').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // One review per user pair
    table.unique(['reviewer_id', 'reviewed_id']);
    table.index(['reviewed_id', 'rating']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('reviews');
};
