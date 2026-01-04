const { setupTestDb, teardownTestDb, cleanTestDb, createTestDb } = require('../../setup');
const { createTestUser, generateUUID } = require('../../fixtures/testData');

jest.mock('../../../src/config/database', () => {
  const { createTestDb } = require('../../setup');
  return createTestDb();
});

const UserService = require('../../../src/services/user.service');

describe('UserService', () => {
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

  describe('findById', () => {
    it('should find user by ID', async () => {
      const testUser = await createTestUser(db, {
        email: 'findme@test.com',
        name: 'Find Me'
      });

      const user = await UserService.findById(testUser.id);

      expect(user).toBeDefined();
      expect(user.email).toBe('findme@test.com');
      expect(user.name).toBe('Find Me');
      expect(user.password).toBeUndefined();
    });

    it('should throw error for non-existent user', async () => {
      const fakeId = generateUUID();

      await expect(UserService.findById(fakeId))
        .rejects.toMatchObject({
          statusCode: 404,
          code: 'USER_NOT_FOUND'
        });
    });
  });

  describe('updateProfile', () => {
    it('should update allowed fields', async () => {
      const testUser = await createTestUser(db);

      const updated = await UserService.updateProfile(testUser.id, {
        name: 'Updated Name',
        bio: 'New bio'
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.bio).toBe('New bio');
    });

    it('should ignore disallowed fields', async () => {
      const testUser = await createTestUser(db, {
        email: 'original@test.com'
      });

      const updated = await UserService.updateProfile(testUser.id, {
        email: 'hacked@test.com',
        password: 'newpassword',
        name: 'Valid Update'
      });

      expect(updated.email).toBe('original@test.com');
      expect(updated.name).toBe('Valid Update');
    });

    it('should throw error when no valid fields provided', async () => {
      const testUser = await createTestUser(db);

      await expect(UserService.updateProfile(testUser.id, {
        email: 'invalid@test.com',
        password: 'invalid'
      })).rejects.toMatchObject({
        statusCode: 400,
        code: 'USER_NO_UPDATES'
      });
    });

    it('should update guide-related fields', async () => {
      const testUser = await createTestUser(db);

      const updated = await UserService.updateProfile(testUser.id, {
        is_guide: true,
        has_car: true,
        has_motorcycle: true
      });

      expect(updated.is_guide).toBe(1);
      expect(updated.has_car).toBe(1);
      expect(updated.has_motorcycle).toBe(1);
    });
  });

  describe('updateLocation', () => {
    it('should throw error for missing coordinates', async () => {
      const testUser = await createTestUser(db);

      await expect(UserService.updateLocation(testUser.id, null, null))
        .rejects.toMatchObject({
          statusCode: 400,
          code: 'USER_INVALID_LOCATION'
        });
    });

    it('should throw error for invalid coordinates', async () => {
      const testUser = await createTestUser(db);

      await expect(UserService.updateLocation(testUser.id, 200, 100))
        .rejects.toMatchObject({
          statusCode: 400,
          code: 'USER_INVALID_COORDINATES'
        });
    });

    // Skip PostGIS test in SQLite - tested in integration tests with PostgreSQL
    it.skip('should accept valid coordinates (requires PostGIS)', async () => {
      const testUser = await createTestUser(db);

      const result = await UserService.updateLocation(testUser.id, 25.0330, 121.5654);

      expect(result.latitude).toBe(25.0330);
      expect(result.longitude).toBe(121.5654);
    });
  });

  describe('setGuideMode', () => {
    // Skip JSONB test in SQLite - tested in integration tests with PostgreSQL
    it.skip('should enable guide mode with details (requires JSONB)', async () => {
      const testUser = await createTestUser(db, { is_guide: false });

      const updated = await UserService.setGuideMode(testUser.id, true, {
        languages: ['English', 'Chinese'],
        favorite_spots: ['Night Market']
      });

      expect(updated.is_guide).toBe(1);
    });

    it('should disable guide mode', async () => {
      const testUser = await createTestUser(db, { is_guide: true });

      const updated = await UserService.setGuideMode(testUser.id, false);

      expect(updated.is_guide).toBe(0);
    });
  });

  describe('deactivateAccount', () => {
    it('should deactivate user account', async () => {
      const testUser = await createTestUser(db, { is_active: true });

      await UserService.deactivateAccount(testUser.id);

      const user = await db('users').where('id', testUser.id).first();
      expect(user.is_active).toBe(0);
    });
  });

  describe('reactivateAccount', () => {
    it('should reactivate user account', async () => {
      const testUser = await createTestUser(db, { is_active: false });

      await UserService.reactivateAccount(testUser.id);

      const user = await db('users').where('id', testUser.id).first();
      expect(user.is_active).toBe(1);
    });
  });

  describe('getProfileCompleteness', () => {
    it('should calculate profile completeness', async () => {
      const testUser = await createTestUser(db, {
        name: 'Test User',
        bio: 'My bio',
        birth_date: '1990-01-01',
        gender: 'other',
        profile_photo: 'https://example.com/photo.jpg'
      });

      const completeness = await UserService.getProfileCompleteness(testUser.id);

      expect(completeness.percentage).toBeGreaterThanOrEqual(70);
      expect(completeness.missingRequired).toHaveLength(0);
    });

    it('should identify missing required fields', async () => {
      const testUser = await createTestUser(db, {
        name: 'Test User',
        bio: null,
        profile_photo: null
      });

      const completeness = await UserService.getProfileCompleteness(testUser.id);

      expect(completeness.missingRequired).toContain('bio');
      expect(completeness.missingRequired).toContain('profile_photo');
    });

    it('should throw error for non-existent user', async () => {
      const fakeId = generateUUID();

      await expect(UserService.getProfileCompleteness(fakeId))
        .rejects.toMatchObject({
          statusCode: 404,
          code: 'USER_NOT_FOUND'
        });
    });
  });
});
