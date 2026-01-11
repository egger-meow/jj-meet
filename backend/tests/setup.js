const knex = require('knex');
const knexConfig = require('../knexfile');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_ACCESS_EXPIRE = '15m';

let testDb;

const createTestDb = () => {
  if (!testDb) {
    testDb = knex(knexConfig.test);
  }
  return testDb;
};

const setupTestDb = async () => {
  const db = createTestDb();
  
  await db.schema.dropTableIfExists('messages');
  await db.schema.dropTableIfExists('matches');
  await db.schema.dropTableIfExists('swipes');
  await db.schema.dropTableIfExists('reviews');
  await db.schema.dropTableIfExists('trips');
  await db.schema.dropTableIfExists('refresh_tokens');
  await db.schema.dropTableIfExists('blocks');
  await db.schema.dropTableIfExists('reports');
  await db.schema.dropTableIfExists('users');

  await db.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(db.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.string('email').unique().notNullable();
    table.string('password').notNullable();
    table.string('name').notNullable();
    table.date('birth_date');
    table.string('gender');
    table.string('user_type').defaultTo('tourist');
    table.boolean('is_guide').defaultTo(false);
    table.text('bio');
    table.string('profile_photo');
    table.json('photos');
    table.string('social_link');
    table.boolean('has_car').defaultTo(false);
    table.boolean('has_motorcycle').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.string('location');
    table.json('profile_details');
    table.json('interests');
    table.json('languages');
    table.timestamp('last_active').defaultTo(db.fn.now());
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
    table.boolean('is_shadow_banned').defaultTo(false);
    table.string('shadow_ban_reason');
    table.timestamp('shadow_ban_until');
    table.boolean('is_banned').defaultTo(false);
    table.string('ban_reason');
    table.timestamp('banned_at');
    table.boolean('email_verified').defaultTo(false);
    table.boolean('is_verified').defaultTo(false);
    table.string('verification_photo');
    table.timestamp('verified_at');
    table.float('rating').defaultTo(0);
    table.integer('rating_count').defaultTo(0);
  });

  await db.schema.createTable('swipes', (table) => {
    table.uuid('id').primary().defaultTo(db.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.uuid('swiper_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('swiped_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('direction').notNullable();
    table.boolean('is_seen').defaultTo(false);
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('matches', (table) => {
    table.uuid('id').primary().defaultTo(db.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.uuid('user1_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('user2_id').references('id').inTable('users').onDelete('CASCADE');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('matched_at').defaultTo(db.fn.now());
    table.timestamp('last_interaction').defaultTo(db.fn.now());
    table.timestamp('unmatched_at');
    table.uuid('unmatched_by');
  });

  await db.schema.createTable('messages', (table) => {
    table.uuid('id').primary().defaultTo(db.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.uuid('match_id').references('id').inTable('matches').onDelete('CASCADE');
    table.uuid('sender_id').references('id').inTable('users').onDelete('CASCADE');
    table.text('content');
    table.string('attachment_url');
    table.string('attachment_type');
    table.boolean('is_read').defaultTo(false);
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('read_at');
    table.timestamp('deleted_at');
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(db.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('device_id');
    table.string('device_name');
    table.string('platform');
    table.string('token_hash');
    table.uuid('family_id');
    table.string('status').defaultTo('active');
    table.timestamp('expires_at');
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('last_used_at').defaultTo(db.fn.now());
    table.timestamp('used_at');
    table.timestamp('revoked_at');
    table.string('revoked_reason');
  });

  await db.schema.createTable('blocks', (table) => {
    table.uuid('id').primary().defaultTo(db.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.uuid('blocker_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('blocked_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('reason');
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('reports', (table) => {
    table.uuid('id').primary().defaultTo(db.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.uuid('reporter_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('reported_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('reason').notNullable();
    table.text('description');
    table.string('status').defaultTo('pending');
    table.uuid('reviewed_by').references('id').inTable('users').onDelete('SET NULL');
    table.text('admin_notes');
    table.string('action_taken');
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('reviewed_at');
  });

  await db.schema.createTable('verification_tokens', (table) => {
    table.uuid('id').primary().defaultTo(db.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('token').notNullable();
    table.string('type').notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_used').defaultTo(false);
    table.timestamp('used_at');
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('reviews', (table) => {
    table.uuid('id').primary().defaultTo(db.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.uuid('reviewer_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('reviewed_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating').notNullable();
    table.text('comment');
    table.boolean('is_guide_review').defaultTo(false);
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.unique(['reviewer_id', 'reviewed_id']);
  });

  await db.schema.createTable('moderation_logs', (table) => {
    table.uuid('id').primary().defaultTo(db.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.uuid('admin_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('target_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('action').notNullable();
    table.string('reason');
    table.json('metadata');
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  return db;
};

const teardownTestDb = async () => {
  if (testDb) {
    await testDb.destroy();
    testDb = null;
  }
};

const cleanTestDb = async () => {
  const db = createTestDb();
  await db('moderation_logs').del();
  await db('reviews').del();
  await db('messages').del();
  await db('matches').del();
  await db('swipes').del();
  await db('refresh_tokens').del();
  await db('verification_tokens').del();
  await db('reports').del();
  await db('blocks').del();
  await db('users').del();
};

module.exports = {
  createTestDb,
  setupTestDb,
  teardownTestDb,
  cleanTestDb
};
