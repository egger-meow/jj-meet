const knex = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static tableName = 'users';

  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await knex(this.tableName)
      .insert({
        ...userData,
        password: hashedPassword
      })
      .returning('*');
    
    delete user.password;
    return user;
  }

  static async findById(id) {
    const user = await knex(this.tableName)
      .where({ id })
      .first();
    return user;
  }

  static async findByEmail(email) {
    const user = await knex(this.tableName)
      .where({ email })
      .first();
    return user;
  }

  static async updateLocation(userId, lat, lng) {
    const point = knex.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [lng, lat]);
    
    await knex(this.tableName)
      .where({ id: userId })
      .update({
        location: point,
        last_active: knex.fn.now()
      });
  }

  static async getNearbyUsers(userId, maxDistance = 50, filters = {}) {
    const currentUser = await this.findById(userId);
    
    if (!currentUser.location) {
      return [];
    }

    let query = knex(this.tableName)
      .select(
        '*',
        knex.raw(
          `ST_Distance(location::geography, ?) / 1000 as distance`,
          [currentUser.location]
        )
      )
      .whereNot('id', userId)
      .where('is_active', true)
      .whereRaw(
        `ST_DWithin(location::geography, ?::geography, ?)`,
        [currentUser.location, maxDistance * 1000]
      );

    // Apply filters
    if (filters.user_type) {
      query = query.where('user_type', filters.user_type);
    }
    if (filters.is_guide !== undefined) {
      query = query.where('is_guide', filters.is_guide);
    }
    if (filters.gender) {
      query = query.where('gender', filters.gender);
    }
    if (filters.has_car !== undefined) {
      query = query.where('has_car', filters.has_car);
    }
    if (filters.has_motorcycle !== undefined) {
      query = query.where('has_motorcycle', filters.has_motorcycle);
    }

    // Exclude already swiped users
    const swipedUsers = await knex('swipes')
      .where('swiper_id', userId)
      .pluck('swiped_id');
    
    if (swipedUsers.length > 0) {
      query = query.whereNotIn('id', swipedUsers);
    }

    const users = await query
      .orderBy('distance', 'asc')
      .limit(20);

    // Remove sensitive data
    return users.map(user => {
      delete user.password;
      return user;
    });
  }

  static async updateProfile(userId, updates) {
    const [user] = await knex(this.tableName)
      .where({ id: userId })
      .update(updates)
      .returning('*');
    
    delete user.password;
    return user;
  }

  static async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;
