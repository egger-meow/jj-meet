const Redis = require('ioredis');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
};

if (process.env.REDIS_URL) {
  Object.assign(redisConfig, { host: undefined, port: undefined });
}

const redis = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL)
  : new Redis(redisConfig);

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

const GEO_KEY = 'user_locations';
const LOCATION_BATCH_KEY = 'location_updates_batch';
const BATCH_INTERVAL_MS = 5 * 60 * 1000;

class RedisGeoService {
  static async updateUserLocation(userId, longitude, latitude) {
    try {
      await redis.geoadd(GEO_KEY, longitude, latitude, userId);
      
      await redis.hset(LOCATION_BATCH_KEY, userId, JSON.stringify({
        longitude,
        latitude,
        timestamp: Date.now(),
      }));
      
      return true;
    } catch (error) {
      console.error('Redis geo update error:', error.message);
      return false;
    }
  }

  static async getNearbyUsers(longitude, latitude, radiusKm = 50, limit = 50) {
    try {
      const results = await redis.georadius(
        GEO_KEY,
        longitude,
        latitude,
        radiusKm,
        'km',
        'WITHDIST',
        'WITHCOORD',
        'COUNT',
        limit,
        'ASC'
      );

      return results.map(([userId, distance, [lng, lat]]) => ({
        userId,
        distance: parseFloat(distance),
        longitude: parseFloat(lng),
        latitude: parseFloat(lat),
      }));
    } catch (error) {
      console.error('Redis geo query error:', error.message);
      return [];
    }
  }

  static async getUserLocation(userId) {
    try {
      const result = await redis.geopos(GEO_KEY, userId);
      if (!result || !result[0]) return null;
      
      return {
        longitude: parseFloat(result[0][0]),
        latitude: parseFloat(result[0][1]),
      };
    } catch (error) {
      console.error('Redis geopos error:', error.message);
      return null;
    }
  }

  static async removeUserLocation(userId) {
    try {
      await redis.zrem(GEO_KEY, userId);
      await redis.hdel(LOCATION_BATCH_KEY, userId);
      return true;
    } catch (error) {
      console.error('Redis geo remove error:', error.message);
      return false;
    }
  }

  static async getDistanceBetweenUsers(userId1, userId2) {
    try {
      const distance = await redis.geodist(GEO_KEY, userId1, userId2, 'km');
      return distance ? parseFloat(distance) : null;
    } catch (error) {
      console.error('Redis geodist error:', error.message);
      return null;
    }
  }

  static async getPendingLocationUpdates() {
    try {
      const updates = await redis.hgetall(LOCATION_BATCH_KEY);
      const parsed = [];
      
      for (const [userId, data] of Object.entries(updates)) {
        try {
          const { longitude, latitude, timestamp } = JSON.parse(data);
          parsed.push({ userId, longitude, latitude, timestamp });
        } catch (e) {
          console.error('Failed to parse location update:', e);
        }
      }
      
      return parsed;
    } catch (error) {
      console.error('Redis hgetall error:', error.message);
      return [];
    }
  }

  static async clearPendingLocationUpdates(userIds) {
    if (!userIds.length) return;
    try {
      await redis.hdel(LOCATION_BATCH_KEY, ...userIds);
    } catch (error) {
      console.error('Redis hdel error:', error.message);
    }
  }
}

class LocationSyncService {
  static syncInterval = null;

  static async syncToPostgres(knex) {
    const updates = await RedisGeoService.getPendingLocationUpdates();
    if (!updates.length) return;

    const staleThreshold = Date.now() - BATCH_INTERVAL_MS;
    const updatesToSync = updates.filter(u => u.timestamp <= staleThreshold);

    if (!updatesToSync.length) return;

    console.log(`Syncing ${updatesToSync.length} location updates to PostgreSQL`);

    const successfulIds = [];

    for (const update of updatesToSync) {
      try {
        await knex('users')
          .where({ id: update.userId })
          .update({
            location: knex.raw(
              `ST_SetSRID(ST_MakePoint(?, ?), 4326)`,
              [update.longitude, update.latitude]
            ),
            last_location_update: knex.fn.now(),
          });
        successfulIds.push(update.userId);
      } catch (error) {
        console.error(`Failed to sync location for ${update.userId}:`, error.message);
      }
    }

    if (successfulIds.length) {
      await RedisGeoService.clearPendingLocationUpdates(successfulIds);
    }
  }

  static startSyncInterval(knex, intervalMs = BATCH_INTERVAL_MS) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncToPostgres(knex).catch(console.error);
    }, intervalMs);

    console.log(`✅ Location sync started (interval: ${intervalMs / 1000}s)`);
  }

  static stopSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Location sync stopped');
    }
  }
}

module.exports = {
  redis,
  RedisGeoService,
  LocationSyncService,
  GEO_KEY,
  LOCATION_BATCH_KEY,
};
