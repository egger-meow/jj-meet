const TripService = require('../../../src/services/trip.service');

describe('TripService', () => {
  describe('createTrip validation', () => {
    const userId = 'user-123';

    it('should throw error if destination is missing', async () => {
      const tripData = {
        start_date: '2026-02-01',
        end_date: '2026-02-10',
      };

      await expect(TripService.createTrip(userId, tripData))
        .rejects.toMatchObject({
          message: 'Destination and dates are required',
          statusCode: 400,
          code: 'TRIP_MISSING_FIELDS',
        });
    });

    it('should throw error if start_date is missing', async () => {
      const tripData = {
        destination_name: 'Tokyo',
        end_date: '2026-02-10',
      };

      await expect(TripService.createTrip(userId, tripData))
        .rejects.toMatchObject({
          message: 'Destination and dates are required',
          statusCode: 400,
          code: 'TRIP_MISSING_FIELDS',
        });
    });

    it('should throw error if end_date is missing', async () => {
      const tripData = {
        destination_name: 'Tokyo',
        start_date: '2026-02-01',
      };

      await expect(TripService.createTrip(userId, tripData))
        .rejects.toMatchObject({
          message: 'Destination and dates are required',
          statusCode: 400,
          code: 'TRIP_MISSING_FIELDS',
        });
    });

    it('should throw error if start date is after end date', async () => {
      const tripData = {
        destination_name: 'Tokyo',
        start_date: '2026-02-10',
        end_date: '2026-02-01',
      };

      await expect(TripService.createTrip(userId, tripData))
        .rejects.toMatchObject({
          message: 'Start date must be before end date',
          statusCode: 400,
          code: 'TRIP_INVALID_DATES',
        });
    });
  });

  describe('calculateOverlapDays', () => {
    it('should calculate overlap correctly for partial overlap', async () => {
      const result = await TripService.calculateOverlapDays(
        '2026-02-01',
        '2026-02-10',
        '2026-02-05',
        '2026-02-15'
      );

      expect(result).toBe(6); // Feb 5-10 = 6 days
    });

    it('should return 0 for non-overlapping dates', async () => {
      const result = await TripService.calculateOverlapDays(
        '2026-02-01',
        '2026-02-10',
        '2026-02-20',
        '2026-02-25'
      );

      expect(result).toBe(0);
    });

    it('should handle complete overlap (trip2 inside trip1)', async () => {
      const result = await TripService.calculateOverlapDays(
        '2026-02-01',
        '2026-02-10',
        '2026-02-03',
        '2026-02-07'
      );

      expect(result).toBe(5); // Feb 3-7 = 5 days
    });

    it('should handle identical dates', async () => {
      const result = await TripService.calculateOverlapDays(
        '2026-02-01',
        '2026-02-10',
        '2026-02-01',
        '2026-02-10'
      );

      expect(result).toBe(10); // Same 10 days
    });

    it('should handle single day overlap', async () => {
      const result = await TripService.calculateOverlapDays(
        '2026-02-01',
        '2026-02-05',
        '2026-02-05',
        '2026-02-10'
      );

      expect(result).toBe(1); // Only Feb 5
    });
  });
});
