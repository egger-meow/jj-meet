const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const verificationController = require('../controllers/verification.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

router.post(
  '/email/send',
  authMiddleware,
  verificationController.sendVerificationEmail
);

router.post(
  '/email/verify',
  [body('token').isString().notEmpty().withMessage('Token is required')],
  verificationController.verifyEmail
);

router.post(
  '/password/reset-request',
  [body('email').isEmail().withMessage('Valid email is required')],
  verificationController.requestPasswordReset
);

router.get(
  '/status',
  authMiddleware,
  verificationController.getVerificationStatus
);

router.post(
  '/selfie',
  authMiddleware,
  upload.single('selfie'),
  verificationController.verifySelfie
);

module.exports = router;
