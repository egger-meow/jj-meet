const express = require('express');
const { body, param, query } = require('express-validator');
const tripController = require('../controllers/trip.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const createTripValidation = [
  body('destination_name').trim().notEmpty().withMessage('Destination name is required'),
  body('start_date').isDate().withMessage('Valid start date is required'),
  body('end_date').isDate().withMessage('Valid end date is required'),
  body('destination_city').optional().trim(),
  body('destination_country').optional().trim(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('description').optional().trim(),
  body('travel_style').optional().isIn(['adventure', 'relaxed', 'cultural', 'nightlife', 'foodie', 'budget', 'luxury']),
  body('preferences').optional().isObject(),
];

const updateTripValidation = [
  param('tripId').isUUID().withMessage('Valid trip ID is required'),
  body('destination_name').optional().trim().notEmpty(),
  body('start_date').optional().isDate(),
  body('end_date').optional().isDate(),
  body('destination_city').optional().trim(),
  body('destination_country').optional().trim(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('description').optional().trim(),
  body('travel_style').optional().isIn(['adventure', 'relaxed', 'cultural', 'nightlife', 'foodie', 'budget', 'luxury']),
  body('is_active').optional().isBoolean(),
  body('is_public').optional().isBoolean(),
  body('preferences').optional().isObject(),
];

const tripIdValidation = [
  param('tripId').isUUID().withMessage('Valid trip ID is required'),
];

router.use(authMiddleware);

router.post('/', createTripValidation, tripController.createTrip);

router.get('/', tripController.getUserTrips);

router.get('/active', tripController.getActiveTrip);

router.get('/upcoming', tripController.getUpcomingTrips);

router.get('/:tripId', tripIdValidation, tripController.getTripById);

router.patch('/:tripId', updateTripValidation, tripController.updateTrip);

router.delete('/:tripId', tripIdValidation, tripController.deleteTrip);

router.get('/:tripId/travelers', tripIdValidation, tripController.findOverlappingTravelers);

module.exports = router;
