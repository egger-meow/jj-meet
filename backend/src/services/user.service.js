const User = require('../models/User');
const knex = require('../config/database');

class UserService {
  static async findById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    delete user.password;
    return user;
  }

  static async findByEmail(email) {
    return User.findByEmail(email);
  }

  static async updateProfile(userId, updates) {
    const allowedFields = [
      'name', 'bio', 'birth_date', 'gender', 'user_type',
      'is_guide', 'has_car', 'has_motorcycle',
      'profile_photo', 'photos', 'interests',
      'languages', 'social_link', 'profile_details'
    ];

    const sanitizedUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      const error = new Error('No valid fields to update');
      error.statusCode = 400;
      error.code = 'USER_NO_UPDATES';
      throw error;
    }

    const user = await User.updateProfile(userId, sanitizedUpdates);
    return user;
  }

  static async updateLocation(userId, latitude, longitude) {
    if (!latitude || !longitude) {
      const error = new Error('Location coordinates required');
      error.statusCode = 400;
      error.code = 'USER_INVALID_LOCATION';
      throw error;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      const error = new Error('Invalid coordinates');
      error.statusCode = 400;
      error.code = 'USER_INVALID_COORDINATES';
      throw error;
    }

    await User.updateLocation(userId, latitude, longitude);
    return { latitude, longitude };
  }

  static async getNearbyUsers(userId, options = {}) {
    const {
      maxDistance = 50,
      user_type,
      is_guide,
      gender,
      has_car,
      has_motorcycle,
      limit = 20
    } = options;

    const filters = {};
    if (user_type) filters.user_type = user_type;
    if (is_guide !== undefined) filters.is_guide = is_guide;
    if (gender) filters.gender = gender;
    if (has_car !== undefined) filters.has_car = has_car;
    if (has_motorcycle !== undefined) filters.has_motorcycle = has_motorcycle;

    const users = await User.getNearbyUsers(userId, maxDistance, filters);
    return users.slice(0, limit);
  }

  static async setGuideMode(userId, isGuide, guideDetails = {}) {
    const updates = {
      is_guide: isGuide
    };

    if (isGuide && guideDetails) {
      const currentUser = await User.findById(userId);
      const profileDetails = currentUser.profile_details || {};
      
      updates.profile_details = {
        ...profileDetails,
        is_guide: true,
        languages: guideDetails.languages || profileDetails.languages,
        favorite_spots: guideDetails.favorite_spots || profileDetails.favorite_spots,
        availability: guideDetails.availability || profileDetails.availability
      };
    }

    return User.updateProfile(userId, updates);
  }

  static async updateGuideProfile(userId, guideData) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const allowedGuideFields = [
      'guide_specialties', 'guide_availability', 'hourly_rate',
      'guide_description', 'years_experience', 'tour_types',
      'guide_city', 'guide_languages'
    ];

    const updates = { is_guide: true };
    for (const field of allowedGuideFields) {
      if (guideData[field] !== undefined) {
        updates[field] = guideData[field];
      }
    }

    const [updatedUser] = await knex('users')
      .where({ id: userId })
      .update(updates)
      .returning('*');

    delete updatedUser.password;
    return updatedUser;
  }

  static async getGuideProfile(userId) {
    const user = await knex('users')
      .where({ id: userId })
      .select(
        'id', 'name', 'profile_photo', 'bio', 'is_guide',
        'guide_specialties', 'guide_availability', 'hourly_rate',
        'guide_description', 'years_experience', 'tour_types',
        'guide_city', 'guide_languages', 'guide_verified_at',
        'rating', 'rating_count', 'is_verified'
      )
      .first();

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return user;
  }

  static async searchGuides(options = {}) {
    const { city, specialties, minRating, maxRate, limit = 20, offset = 0 } = options;

    let query = knex('users')
      .where('is_guide', true)
      .where('is_active', true)
      .select(
        'id', 'name', 'profile_photo', 'bio',
        'guide_specialties', 'hourly_rate', 'guide_city',
        'years_experience', 'rating', 'rating_count', 'is_verified'
      );

    if (city) {
      query = query.whereRaw('LOWER(guide_city) = LOWER(?)', [city]);
    }

    if (specialties && specialties.length > 0) {
      query = query.whereRaw('guide_specialties && ?', [specialties]);
    }

    if (minRating) {
      query = query.where('rating', '>=', minRating);
    }

    if (maxRate) {
      query = query.where('hourly_rate', '<=', maxRate);
    }

    const guides = await query
      .orderBy('rating', 'desc')
      .limit(limit)
      .offset(offset);

    return guides;
  }

  static async deactivateAccount(userId) {
    await knex('users')
      .where({ id: userId })
      .update({ is_active: false });
  }

  static async reactivateAccount(userId) {
    await knex('users')
      .where({ id: userId })
      .update({ is_active: true });
  }

  static async getProfileCompleteness(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const requiredFields = ['name', 'bio', 'birth_date', 'gender', 'profile_photo'];
    const optionalFields = ['photos', 'interests', 'languages', 'social_link'];
    
    let completedRequired = 0;
    let completedOptional = 0;

    for (const field of requiredFields) {
      if (user[field]) completedRequired++;
    }

    for (const field of optionalFields) {
      if (user[field] && (Array.isArray(user[field]) ? user[field].length > 0 : true)) {
        completedOptional++;
      }
    }

    const requiredScore = (completedRequired / requiredFields.length) * 70;
    const optionalScore = (completedOptional / optionalFields.length) * 30;

    return {
      percentage: Math.round(requiredScore + optionalScore),
      missingRequired: requiredFields.filter(f => !user[f]),
      missingOptional: optionalFields.filter(f => !user[f] || (Array.isArray(user[f]) && user[f].length === 0))
    };
  }
}

module.exports = UserService;
