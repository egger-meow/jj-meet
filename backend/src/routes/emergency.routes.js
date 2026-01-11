const express = require('express');
const { body, param } = require('express-validator');
const emergencyController = require('../controllers/emergency.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/contacts', emergencyController.getContacts);

router.post(
  '/contacts',
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('phone').isString().notEmpty().withMessage('Phone is required'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('relationship').optional().isString(),
    body('is_primary').optional().isBoolean(),
  ],
  emergencyController.addContact
);

router.patch(
  '/contacts/:contactId',
  [
    param('contactId').isUUID().withMessage('Valid contact ID required'),
    body('name').optional().isString(),
    body('phone').optional().isString(),
    body('email').optional().isEmail(),
    body('relationship').optional().isString(),
    body('is_primary').optional().isBoolean(),
  ],
  emergencyController.updateContact
);

router.delete(
  '/contacts/:contactId',
  [param('contactId').isUUID().withMessage('Valid contact ID required')],
  emergencyController.deleteContact
);

router.get('/shares', emergencyController.getActiveShares);

router.post(
  '/share-meeting',
  [
    body('match_id').isUUID().withMessage('Valid match ID required'),
    body('contact_ids').isArray({ min: 1 }).withMessage('At least one contact required'),
    body('meeting_location').isString().notEmpty().withMessage('Location required'),
    body('meeting_time').optional().isISO8601(),
    body('meeting_coordinates.lat').optional().isFloat({ min: -90, max: 90 }),
    body('meeting_coordinates.lng').optional().isFloat({ min: -180, max: 180 }),
  ],
  emergencyController.shareMeeting
);

router.post(
  '/shares/:shareId/check-in',
  [param('shareId').isUUID().withMessage('Valid share ID required')],
  emergencyController.checkIn
);

router.post(
  '/sos',
  [
    body('lat').optional().isFloat({ min: -90, max: 90 }),
    body('lng').optional().isFloat({ min: -180, max: 180 }),
  ],
  emergencyController.sendSOS
);

module.exports = router;
