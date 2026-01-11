const tripController = require('../../../src/controllers/trip.controller');
const TripService = require('../../../src/services/trip.service');

jest.mock('../../../src/services/trip.service');

describe('TripController', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      userId: 'user-123',
      body: {},
      params: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('createTrip', () => {
    it('should create a trip and return 201', async () => {
      const tripData = {
        destination_name: 'Tokyo',
        start_date: '2026-02-01',
        end_date: '2026-02-10',
      };
      const createdTrip = { id: 'trip-1', ...tripData, user_id: 'user-123' };
      
      mockReq.body = tripData;
      TripService.createTrip.mockResolvedValue(createdTrip);

      await tripController.createTrip(mockReq, mockRes, mockNext);

      expect(TripService.createTrip).toHaveBeenCalledWith('user-123', tripData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: createdTrip,
      });
    });

    it('should call next on error', async () => {
      const error = new Error('Creation failed');
      mockReq.body = { destination_name: 'Tokyo' };
      TripService.createTrip.mockRejectedValue(error);

      await tripController.createTrip(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserTrips', () => {
    it('should return user trips with default options', async () => {
      const trips = [{ id: 'trip-1' }, { id: 'trip-2' }];
      TripService.getUserTrips.mockResolvedValue(trips);

      await tripController.getUserTrips(mockReq, mockRes, mockNext);

      expect(TripService.getUserTrips).toHaveBeenCalledWith('user-123', {
        limit: 20,
        offset: 0,
        includeInactive: false,
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: trips,
      });
    });

    it('should pass query parameters to service', async () => {
      mockReq.query = { limit: '10', offset: '5', includeInactive: 'true' };
      TripService.getUserTrips.mockResolvedValue([]);

      await tripController.getUserTrips(mockReq, mockRes, mockNext);

      expect(TripService.getUserTrips).toHaveBeenCalledWith('user-123', {
        limit: 10,
        offset: 5,
        includeInactive: true,
      });
    });
  });

  describe('getTripById', () => {
    it('should return a trip by ID', async () => {
      const trip = { id: 'trip-1', destination_name: 'Tokyo' };
      mockReq.params.tripId = 'trip-1';
      TripService.getTripById.mockResolvedValue(trip);

      await tripController.getTripById(mockReq, mockRes, mockNext);

      expect(TripService.getTripById).toHaveBeenCalledWith('trip-1', 'user-123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: trip,
      });
    });

    it('should call next on not found', async () => {
      const error = new Error('Trip not found');
      error.statusCode = 404;
      mockReq.params.tripId = 'invalid';
      TripService.getTripById.mockRejectedValue(error);

      await tripController.getTripById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateTrip', () => {
    it('should update a trip', async () => {
      const updates = { description: 'Updated' };
      const updatedTrip = { id: 'trip-1', ...updates };
      mockReq.params.tripId = 'trip-1';
      mockReq.body = updates;
      TripService.updateTrip.mockResolvedValue(updatedTrip);

      await tripController.updateTrip(mockReq, mockRes, mockNext);

      expect(TripService.updateTrip).toHaveBeenCalledWith('trip-1', 'user-123', updates);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: updatedTrip,
        message: 'Trip updated successfully',
      });
    });
  });

  describe('deleteTrip', () => {
    it('should delete a trip', async () => {
      mockReq.params.tripId = 'trip-1';
      TripService.deleteTrip.mockResolvedValue({ deleted: true, tripId: 'trip-1' });

      await tripController.deleteTrip(mockReq, mockRes, mockNext);

      expect(TripService.deleteTrip).toHaveBeenCalledWith('trip-1', 'user-123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { deleted: true, tripId: 'trip-1' },
        message: 'Trip deleted successfully',
      });
    });
  });

  describe('getActiveTrip', () => {
    it('should return active trip', async () => {
      const trip = { id: 'trip-1', is_active: true };
      TripService.getActiveTrip.mockResolvedValue(trip);

      await tripController.getActiveTrip(mockReq, mockRes, mockNext);

      expect(TripService.getActiveTrip).toHaveBeenCalledWith('user-123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: trip,
      });
    });

    it('should return null if no active trip', async () => {
      TripService.getActiveTrip.mockResolvedValue(undefined);

      await tripController.getActiveTrip(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: undefined,
      });
    });
  });

  describe('getUpcomingTrips', () => {
    it('should return upcoming trips with default days', async () => {
      const trips = [{ id: 'trip-1' }];
      TripService.getUpcomingTrips.mockResolvedValue(trips);

      await tripController.getUpcomingTrips(mockReq, mockRes, mockNext);

      expect(TripService.getUpcomingTrips).toHaveBeenCalledWith('user-123', 30);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: trips,
      });
    });

    it('should use custom daysAhead query param', async () => {
      mockReq.query.daysAhead = '14';
      TripService.getUpcomingTrips.mockResolvedValue([]);

      await tripController.getUpcomingTrips(mockReq, mockRes, mockNext);

      expect(TripService.getUpcomingTrips).toHaveBeenCalledWith('user-123', 14);
    });
  });

  describe('findOverlappingTravelers', () => {
    it('should return overlapping travelers', async () => {
      const travelers = [{ id: 'user-2', name: 'Test User' }];
      mockReq.params.tripId = 'trip-1';
      TripService.findOverlappingTravelers.mockResolvedValue(travelers);

      await tripController.findOverlappingTravelers(mockReq, mockRes, mockNext);

      expect(TripService.findOverlappingTravelers).toHaveBeenCalledWith(
        'trip-1',
        'user-123',
        { maxDistance: 50, limit: 20 }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: travelers,
      });
    });

    it('should use custom query params', async () => {
      mockReq.params.tripId = 'trip-1';
      mockReq.query = { maxDistance: '100', limit: '50' };
      TripService.findOverlappingTravelers.mockResolvedValue([]);

      await tripController.findOverlappingTravelers(mockReq, mockRes, mockNext);

      expect(TripService.findOverlappingTravelers).toHaveBeenCalledWith(
        'trip-1',
        'user-123',
        { maxDistance: 100, limit: 50 }
      );
    });
  });
});
