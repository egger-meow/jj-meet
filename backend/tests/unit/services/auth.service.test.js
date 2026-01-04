const { setupTestDb, teardownTestDb, cleanTestDb, createTestDb } = require('../../setup');
const { createTestUser, createTestRefreshToken, generateUUID } = require('../../fixtures/testData');

jest.mock('../../../src/config/database', () => {
  const { createTestDb } = require('../../setup');
  return createTestDb();
});

const AuthService = require('../../../src/services/auth.service');

describe('AuthService', () => {
  let db;

  beforeAll(async () => {
    db = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const userId = generateUUID();
      const deviceId = generateUUID();
      
      const token = AuthService.generateAccessToken(userId, deviceId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a random refresh token', () => {
      const token1 = AuthService.generateRefreshToken();
      const token2 = AuthService.generateRefreshToken();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(80);
    });
  });

  describe('hashToken', () => {
    it('should hash token consistently', () => {
      const token = 'test-token';
      const hash1 = AuthService.hashToken(token);
      const hash2 = AuthService.hashToken(token);
      
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });

    it('should produce different hashes for different tokens', () => {
      const hash1 = AuthService.hashToken('token1');
      const hash2 = AuthService.hashToken('token2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
        birth_date: '1990-01-01',
        gender: 'other',
        user_type: 'tourist'
      };

      const user = await AuthService.register(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.password).toBeUndefined();
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'password123',
        name: 'User 1',
        birth_date: '1990-01-01'
      };

      await AuthService.register(userData);

      await expect(AuthService.register({
        ...userData,
        name: 'User 2'
      })).rejects.toMatchObject({
        statusCode: 400,
        code: 'AUTH_EMAIL_EXISTS'
      });
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const user = await createTestUser(db, {
        email: 'login@test.com'
      });

      const result = await AuthService.login('login@test.com', 'password123', {});

      expect(result).toBeDefined();
      expect(result.user.email).toBe('login@test.com');
      expect(result.accessToken).toBeDefined();
      expect(result.expiresIn).toBe(900);
    });

    it('should throw error for invalid email', async () => {
      await expect(AuthService.login('nonexistent@test.com', 'password123', {}))
        .rejects.toMatchObject({
          statusCode: 401,
          code: 'AUTH_INVALID_CREDENTIALS'
        });
    });

    it('should throw error for invalid password', async () => {
      await createTestUser(db, {
        email: 'wrongpass@test.com'
      });

      await expect(AuthService.login('wrongpass@test.com', 'wrongpassword', {}))
        .rejects.toMatchObject({
          statusCode: 401,
          code: 'AUTH_INVALID_CREDENTIALS'
        });
    });

    it('should store refresh token when device info provided', async () => {
      await createTestUser(db, {
        email: 'device@test.com'
      });

      const deviceId = generateUUID();
      const result = await AuthService.login('device@test.com', 'password123', {
        deviceId,
        deviceName: 'Test Device',
        platform: 'ios'
      });

      expect(result.refreshToken).toBeDefined();

      const storedToken = await db('refresh_tokens')
        .where('device_id', deviceId)
        .first();

      expect(storedToken).toBeDefined();
      expect(storedToken.status).toBe('active');
    });
  });

  describe('logout', () => {
    it('should revoke refresh tokens for device', async () => {
      const user = await createTestUser(db);
      const deviceId = generateUUID();
      
      await createTestRefreshToken(db, user.id, { device_id: deviceId });

      await AuthService.logout(user.id, deviceId);

      const token = await db('refresh_tokens')
        .where('device_id', deviceId)
        .first();

      expect(token.status).toBe('revoked');
      expect(token.revoked_reason).toBe('logout');
    });
  });

  describe('logoutAllDevices', () => {
    it('should revoke all refresh tokens except current device', async () => {
      const user = await createTestUser(db);
      const currentDeviceId = generateUUID();
      const otherDeviceId = generateUUID();

      await createTestRefreshToken(db, user.id, { device_id: currentDeviceId });
      await createTestRefreshToken(db, user.id, { device_id: otherDeviceId });

      await AuthService.logoutAllDevices(user.id, currentDeviceId);

      const currentToken = await db('refresh_tokens')
        .where('device_id', currentDeviceId)
        .first();
      const otherToken = await db('refresh_tokens')
        .where('device_id', otherDeviceId)
        .first();

      expect(currentToken.status).toBe('active');
      expect(otherToken.status).toBe('revoked');
    });
  });

  describe('getDevices', () => {
    it('should return active devices for user', async () => {
      const user = await createTestUser(db);
      
      await createTestRefreshToken(db, user.id, {
        device_id: generateUUID(),
        device_name: 'Device 1'
      });
      await createTestRefreshToken(db, user.id, {
        device_id: generateUUID(),
        device_name: 'Device 2'
      });

      const devices = await AuthService.getDevices(user.id);

      expect(devices).toHaveLength(2);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', async () => {
      const userId = generateUUID();
      const token = AuthService.generateAccessToken(userId);

      const decoded = await AuthService.verifyAccessToken(token);

      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('access');
    });

    it('should throw error for invalid token', async () => {
      await expect(AuthService.verifyAccessToken('invalid-token'))
        .rejects.toMatchObject({
          statusCode: 401,
          code: 'AUTH_INVALID_ACCESS'
        });
    });
  });
});
