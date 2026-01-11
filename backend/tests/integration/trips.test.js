const request = require('supertest');
const express = require('express');
const tripRoutes = require('../../src/routes/trip.routes');
const TripService = require('../../src/services/trip.service');

jest.mock('../../src/services/trip.service');
jest.mock('../../src/middleware/auth', () => (req, res, next) => {
  req.userId = 'test-user-123';
  next();
});

const app = express();
app.use(express.json());
app.use('/api/trips', tripRoutes);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ error: err.message });
});

describe('Trip Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/trips', () => {
    it('should create a trip with valid data', async () => {
      const tripData = {
        destination_name: 'Tokyo',
        start_date: '2026-02-01',
        end_date: '2026-02-10',
      };
      const createdTrip = { id: 'trip-1', ...tripData };
      TripService.createTrip.mockResolvedValue(createdTrip);

      const res = await request(app)
        .post('/api/trips')
        .send(tripData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(createdTrip);
    });

    it('should reject missing destination_name', async () => {
      const res = await request(app)
        .post('/api/trips')
        .send({
          start_date: '2026-02-01',
          end_date: '2026-02-10',
        })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should reject invalid dates', async () => {
      const res = await request(app)
        .post('/api/trips')
        .send({
          destination_name: 'Tokyo',
          start_date: 'invalid',
          end_date: '2026-02-10',
        })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should accept optional fields', async () => {
      const tripData = {
        destination_name: 'Tokyo',
        destination_city: 'Tokyo',
        destination_country: 'Japan',
        start_date: '2026-02-01',
        end_date: '2026-02-10',
        description: 'Exploring Japan',
        travel_style: 'adventure',
        latitude: 35.6762,
        longitude: 139.6503,
      };
      TripService.createTrip.mockResolvedValue({ id: 'trip-1', ...tripData });

      const res = await request(app)
        .post('/api/trips')
        .send(tripData)
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/trips', () => {
    it('should return user trips', async () => {
      const trips = [{ id: 'trip-1' }, { id: 'trip-2' }];
      TripService.getUserTrips.mockResolvedValue(trips);

      const res = await request(app)
        .get('/api/trips')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(trips);
    });

    it('should pass query parameters', async () => {
      TripService.getUserTrips.mockResolvedValue([]);

      await request(app)
        .get('/api/trips?limit=10&offset=5&includeInactive=true')
        .expect(200);

      expect(TripService.getUserTrips).toHaveBeenCalledWith('test-user-123', {
        limit: 10,
        offset: 5,
        includeInactive: true,
      });
    });
  });

  describe('GET /api/trips/active', () => {
    it('should return active trip', async () => {
      const trip = { id: 'trip-1', is_active: true };
      TripService.getActiveTrip.mockResolvedValue(trip);

      const res = await request(app)
        .get('/api/trips/active')
        .expect(200);

      expect(res.body.data).toEqual(trip);
    });
  });

  describe('GET /api/trips/upcoming', () => {
    it('should return upcoming trips', async () => {
      const trips = [{ id: 'trip-1' }];
      TripService.getUpcomingTrips.mockResolvedValue(trips);

      const res = await request(app)
        .get('/api/trips/upcoming?daysAhead=14')
        .expect(200);

      expect(TripService.getUpcomingTrips).toHaveBeenCalledWith('test-user-123', 14);
      expect(res.body.data).toEqual(trips);
    });
  });

  describe('GET /api/trips/:tripId', () => {
    it('should return a specific trip', async () => {
      const trip = { id: 'trip-1', destination_name: 'Tokyo' };
      TripService.getTripById.mockResolvedValue(trip);

      const res = await request(app)
        .get('/api/trips/trip-1')
        .expect(200);

      expect(res.body.data).toEqual(trip);
    });

    it('should return 404 for non-existent trip', async () => {
      const error = new Error('Trip not found');
      error.statusCode = 404;
      TripService.getTripById.mockRejectedValue(error);

      await request(app)
        .get('/api/trips/non-existent')
        .expect(404);
    });
  });

  describe('PATCH /api/trips/:tripId', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';

    it('should update a trip', async () => {
      const updates = { description: 'Updated description' };
      const updatedTrip = { id: validUUID, ...updates };
      TripService.updateTrip.mockResolvedValue(updatedTrip);

      const res = await request(app)
        .patch(`/api/trips/${validUUID}`)
        .send(updates)
        .expect(200);

      expect(res.body.data).toEqual(updatedTrip);
      expect(res.body.message).toBe('Trip updated successfully');
    });

    it('should validate travel_style enum', async () => {
      const res = await request(app)
        .patch(`/api/trips/${validUUID}`)
        .send({ travel_style: 'invalid_style' })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/trips/:tripId', () => {
    it('should delete a trip', async () => {
      TripService.deleteTrip.mockResolvedValue({ deleted: true, tripId: 'trip-1' });

      const res = await request(app)
        .delete('/api/trips/trip-1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Trip deleted successfully');
    });
  });

  describe('GET /api/trips/:tripId/travelers', () => {
    it('should return overlapping travelers', async () => {
      const travelers = [{ id: 'user-2', name: 'Fellow Traveler' }];
      TripService.findOverlappingTravelers.mockResolvedValue(travelers);

      const res = await request(app)
        .get('/api/trips/trip-1/travelers')
        .expect(200);

      expect(res.body.data).toEqual(travelers);
    });

    it('should pass query options', async () => {
      TripService.findOverlappingTravelers.mockResolvedValue([]);

      await request(app)
        .get('/api/trips/trip-1/travelers?maxDistance=100&limit=50')
        .expect(200);

      expect(TripService.findOverlappingTravelers).toHaveBeenCalledWith(
        'trip-1',
        'test-user-123',
        { maxDistance: 100, limit: 50 }
      );
    });
  });
});
