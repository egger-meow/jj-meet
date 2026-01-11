const UserService = require('../services/user.service');
const SwipeService = require('../services/swipe.service');

exports.getNearbyUsers = async (req, res, next) => {
  try {
    const options = {
      maxDistance: parseInt(req.query.maxDistance) || 50,
      user_type: req.query.user_type,
      is_guide: req.query.is_guide === 'true' ? true : req.query.is_guide === 'false' ? false : undefined,
      gender: req.query.gender,
      has_car: req.query.has_car === 'true' ? true : req.query.has_car === 'false' ? false : undefined,
      has_motorcycle: req.query.has_motorcycle === 'true' ? true : req.query.has_motorcycle === 'false' ? false : undefined,
      limit: parseInt(req.query.limit) || 20
    };

    const users = await UserService.getNearbyUsers(req.userId, options);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const location = await UserService.updateLocation(req.userId, latitude, longitude);
    res.json({ success: true, data: location, message: 'Location updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await UserService.findById(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.setGuideMode = async (req, res, next) => {
  try {
    const { is_guide, guideDetails } = req.body;
    const user = await UserService.setGuideMode(req.userId, is_guide, guideDetails);
    res.json({ success: true, data: user, message: 'Guide mode updated' });
  } catch (error) {
    next(error);
  }
};

exports.getProfileCompleteness = async (req, res, next) => {
  try {
    const completeness = await UserService.getProfileCompleteness(req.userId);
    res.json({ success: true, data: completeness });
  } catch (error) {
    next(error);
  }
};

exports.deactivateAccount = async (req, res, next) => {
  try {
    await UserService.deactivateAccount(req.userId);
    res.json({ success: true, message: 'Account deactivated' });
  } catch (error) {
    next(error);
  }
};

exports.getDiscoveryCandidates = async (req, res, next) => {
  try {
    const options = {
      maxDistance: parseInt(req.query.maxDistance) || 50,
      limit: parseInt(req.query.limit) || 20,
      filters: {
        user_type: req.query.user_type,
        is_guide: req.query.is_guide === 'true' ? true : req.query.is_guide === 'false' ? false : undefined,
        gender: req.query.gender,
        has_car: req.query.has_car === 'true',
        has_motorcycle: req.query.has_motorcycle === 'true'
      }
    };

    const candidates = await SwipeService.getDiscoveryCandidates(req.userId, options);
    res.json({ success: true, data: candidates });
  } catch (error) {
    next(error);
  }
};

exports.updateGuideProfile = async (req, res, next) => {
  try {
    const user = await UserService.updateGuideProfile(req.userId, req.body);
    res.json({ success: true, data: user, message: 'Guide profile updated' });
  } catch (error) {
    next(error);
  }
};

exports.getGuideProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const guide = await UserService.getGuideProfile(userId);
    res.json({ success: true, data: guide });
  } catch (error) {
    next(error);
  }
};

exports.searchGuides = async (req, res, next) => {
  try {
    const { city, specialties, minRating, maxRate, limit, offset } = req.query;
    
    const guides = await UserService.searchGuides({
      city,
      specialties: specialties ? specialties.split(',') : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      maxRate: maxRate ? parseFloat(maxRate) : undefined,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    res.json({ success: true, data: guides });
  } catch (error) {
    next(error);
  }
};
