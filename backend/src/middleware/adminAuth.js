const knex = require('../config/database');

const adminAuth = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const user = await knex('users')
      .where({ id: req.userId })
      .select('id', 'is_admin', 'email')
      .first();

    if (!user || !user.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED',
      });
    }

    req.isAdmin = true;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = adminAuth;
