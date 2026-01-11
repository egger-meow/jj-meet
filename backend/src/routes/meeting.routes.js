const express = require('express');
const { body, param } = require('express-validator');
const meetingController = require('../controllers/meeting.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/history', meetingController.getMeetingHistory);

router.get(
  '/:matchId/suggest',
  [param('matchId').isUUID().withMessage('Valid match ID is required')],
  meetingController.suggestLocations
);

router.get(
  '/:matchId/proposals',
  [param('matchId').isUUID().withMessage('Valid match ID is required')],
  meetingController.getProposalsForMatch
);

router.post(
  '/:matchId/propose',
  [
    param('matchId').isUUID().withMessage('Valid match ID is required'),
    body('proposed_time').optional().isISO8601().withMessage('Valid date required'),
    body('message').optional().isString().isLength({ max: 500 }),
    body('location_id').optional().isUUID(),
    body('custom_location.name').optional().isString(),
    body('custom_location.address').optional().isString(),
    body('custom_location.lat').optional().isFloat({ min: -90, max: 90 }),
    body('custom_location.lng').optional().isFloat({ min: -180, max: 180 }),
  ],
  meetingController.createProposal
);

router.post(
  '/proposals/:proposalId/respond',
  [
    param('proposalId').isUUID().withMessage('Valid proposal ID is required'),
    body('response').isIn(['accepted', 'declined']).withMessage('Response must be accepted or declined'),
  ],
  meetingController.respondToProposal
);

module.exports = router;
