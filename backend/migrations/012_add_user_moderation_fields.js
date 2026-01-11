/**
 * Migration: Add user moderation fields for shadow ban system
 * 
 * Adds:
 * - is_shadow_banned: User appears normal to themselves but invisible to others
 * - shadow_ban_reason: Why the user was shadow banned
 * - shadow_ban_until: Expiry date (null = permanent)
 * - is_banned: Full account ban
 * - ban_reason: Why the user was banned
 * - email_verified: For email verification feature
 * - is_verified: Selfie verification status
 * - verification_photo: Selfie used for verification
 */

exports.up = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.boolean('is_shadow_banned').defaultTo(false);
    table.string('shadow_ban_reason', 100);
    table.timestamp('shadow_ban_until');
    table.boolean('is_banned').defaultTo(false);
    table.string('ban_reason', 100);
    table.timestamp('banned_at');
    table.boolean('email_verified').defaultTo(false);
    table.boolean('is_verified').defaultTo(false);
    table.string('verification_photo');
    table.timestamp('verified_at');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('is_shadow_banned');
    table.dropColumn('shadow_ban_reason');
    table.dropColumn('shadow_ban_until');
    table.dropColumn('is_banned');
    table.dropColumn('ban_reason');
    table.dropColumn('banned_at');
    table.dropColumn('email_verified');
    table.dropColumn('is_verified');
    table.dropColumn('verification_photo');
    table.dropColumn('verified_at');
  });
};
