const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const generateUUID = () => uuidv4();

const createTestUser = async (db, overrides = {}) => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const id = overrides.id || generateUUID();
  
  const userData = {
    id,
    email: overrides.email || `test-${id}@example.com`,
    password: hashedPassword,
    name: overrides.name || 'Test User',
    birth_date: overrides.birth_date || '1990-01-01',
    gender: overrides.gender || 'other',
    user_type: overrides.user_type || 'tourist',
    is_guide: overrides.is_guide || false,
    bio: overrides.bio || 'Test bio',
    is_active: overrides.is_active !== undefined ? overrides.is_active : true,
    has_car: overrides.has_car || false,
    has_motorcycle: overrides.has_motorcycle || false,
    ...overrides
  };

  delete userData.password_plain;

  await db('users').insert(userData);
  
  return { ...userData, password_plain: 'password123' };
};

const createTestSwipe = async (db, swiperId, swipedId, direction = 'like') => {
  const id = generateUUID();
  const swipeData = {
    id,
    swiper_id: swiperId,
    swiped_id: swipedId,
    direction
  };

  await db('swipes').insert(swipeData);
  return swipeData;
};

const createTestMatch = async (db, userId1, userId2) => {
  const [user1_id, user2_id] = [userId1, userId2].sort();
  const id = generateUUID();
  
  const matchData = {
    id,
    user1_id,
    user2_id,
    is_active: true
  };

  await db('matches').insert(matchData);
  return matchData;
};

const createTestMessage = async (db, matchId, senderId, content = 'Test message') => {
  const id = generateUUID();
  
  const messageData = {
    id,
    match_id: matchId,
    sender_id: senderId,
    content,
    is_read: false,
    created_at: new Date().toISOString()
  };

  await db('messages').insert(messageData);
  return messageData;
};

const createTestRefreshToken = async (db, userId, overrides = {}) => {
  const id = generateUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const tokenData = {
    id,
    user_id: userId,
    device_id: overrides.device_id || generateUUID(),
    device_name: overrides.device_name || 'Test Device',
    platform: overrides.platform || 'ios',
    token_hash: overrides.token_hash || 'test-token-hash',
    family_id: overrides.family_id || generateUUID(),
    status: overrides.status || 'active',
    expires_at: overrides.expires_at || expiresAt.toISOString(),
    ...overrides
  };

  await db('refresh_tokens').insert(tokenData);
  return tokenData;
};

const testUsers = {
  tourist: {
    email: 'tourist@test.com',
    name: 'Tourist User',
    user_type: 'tourist',
    is_guide: false
  },
  guide: {
    email: 'guide@test.com',
    name: 'Guide User',
    user_type: 'local',
    is_guide: true
  },
  inactive: {
    email: 'inactive@test.com',
    name: 'Inactive User',
    is_active: false
  }
};

module.exports = {
  generateUUID,
  createTestUser,
  createTestSwipe,
  createTestMatch,
  createTestMessage,
  createTestRefreshToken,
  testUsers
};
