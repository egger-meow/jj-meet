const { validationResult } = require('express-validator');
const TripService = require('../services/trip.service');

exports.createTrip = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const trip = await TripService.createTrip(req.userId, req.body);
    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

exports.getUserTrips = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, includeInactive = false } = req.query;
    const trips = await TripService.getUserTrips(req.userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeInactive: includeInactive === 'true',
    });
    res.json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
};

exports.getTripById = async (req, res, next) => {
  try {
    const trip = await TripService.getTripById(req.params.tripId, req.userId);
    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

exports.updateTrip = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const trip = await TripService.updateTrip(req.params.tripId, req.userId, req.body);
    res.json({ success: true, data: trip, message: 'Trip updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.deleteTrip = async (req, res, next) => {
  try {
    const result = await TripService.deleteTrip(req.params.tripId, req.userId);
    res.json({ success: true, data: result, message: 'Trip deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getActiveTrip = async (req, res, next) => {
  try {
    const trip = await TripService.getActiveTrip(req.userId);
    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

exports.getUpcomingTrips = async (req, res, next) => {
  try {
    const { daysAhead = 30 } = req.query;
    const trips = await TripService.getUpcomingTrips(req.userId, parseInt(daysAhead));
    res.json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
};

exports.findOverlappingTravelers = async (req, res, next) => {
  try {
    const { maxDistance = 50, limit = 20 } = req.query;
    const travelers = await TripService.findOverlappingTravelers(
      req.params.tripId,
      req.userId,
      {
        maxDistance: parseInt(maxDistance),
        limit: parseInt(limit),
      }
    );
    res.json({ success: true, data: travelers });
  } catch (error) {
    next(error);
  }
};
