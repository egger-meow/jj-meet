const knex = require('../config/database');
const UploadService = require('./upload.service');

class VerificationService {
  static VERIFICATION_THRESHOLD = 90;

  static async verifySelfie(userId, selfieBuffer, mimeType) {
    const user = await knex('users')
      .where({ id: userId })
      .select('id', 'profile_photo', 'is_verified')
      .first();

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (user.is_verified) {
      const error = new Error('User is already verified');
      error.statusCode = 400;
      error.code = 'VERIFICATION_ALREADY_VERIFIED';
      throw error;
    }

    if (!user.profile_photo) {
      const error = new Error('Profile photo required for verification');
      error.statusCode = 400;
      error.code = 'VERIFICATION_NO_PROFILE_PHOTO';
      throw error;
    }

    const selfieResult = await UploadService.uploadToCloudinary(selfieBuffer, {
      folder: `jjmeet/verification/${userId}`,
      transformation: [
        { width: 800, height: 800, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
      ],
    });

    let verificationResult;
    
    if (process.env.AWS_REKOGNITION_ENABLED === 'true') {
      verificationResult = await this.compareFacesWithRekognition(
        user.profile_photo,
        selfieResult.secure_url
      );
    } else {
      verificationResult = await this.mockFaceComparison();
    }

    if (verificationResult.isMatch) {
      await knex('users')
        .where({ id: userId })
        .update({
          is_verified: true,
          verification_photo: selfieResult.secure_url,
          verified_at: knex.fn.now(),
        });

      return {
        success: true,
        isVerified: true,
        confidence: verificationResult.confidence,
        message: 'Verification successful! Your profile is now verified.',
      };
    }

    return {
      success: false,
      isVerified: false,
      confidence: verificationResult.confidence,
      message: 'Verification failed. Please ensure your face is clearly visible and matches your profile photo.',
    };
  }

  static async compareFacesWithRekognition(sourceImageUrl, targetImageUrl) {
    try {
      const AWS = require('aws-sdk');
      
      const rekognition = new AWS.Rekognition({
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });

      const [sourceResponse, targetResponse] = await Promise.all([
        fetch(sourceImageUrl),
        fetch(targetImageUrl),
      ]);

      const sourceBuffer = Buffer.from(await sourceResponse.arrayBuffer());
      const targetBuffer = Buffer.from(await targetResponse.arrayBuffer());

      const params = {
        SourceImage: { Bytes: sourceBuffer },
        TargetImage: { Bytes: targetBuffer },
        SimilarityThreshold: this.VERIFICATION_THRESHOLD,
      };

      const result = await rekognition.compareFaces(params).promise();

      if (result.FaceMatches && result.FaceMatches.length > 0) {
        const highestMatch = result.FaceMatches.reduce((max, match) => 
          match.Similarity > max.Similarity ? match : max
        );

        return {
          isMatch: highestMatch.Similarity >= this.VERIFICATION_THRESHOLD,
          confidence: Math.round(highestMatch.Similarity),
        };
      }

      return {
        isMatch: false,
        confidence: 0,
      };
    } catch (error) {
      console.error('AWS Rekognition error:', error);
      throw new Error('Face comparison service unavailable');
    }
  }

  static async mockFaceComparison() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockConfidence = 85 + Math.random() * 15;
    
    return {
      isMatch: mockConfidence >= this.VERIFICATION_THRESHOLD,
      confidence: Math.round(mockConfidence),
    };
  }

  static async getVerificationStatus(userId) {
    const user = await knex('users')
      .where({ id: userId })
      .select('is_verified', 'verification_photo', 'verified_at', 'email_verified')
      .first();

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return {
      selfie_verified: !!user.is_verified,
      email_verified: !!user.email_verified,
      verified_at: user.verified_at,
    };
  }

  static async revokeVerification(userId, reason, adminId = null) {
    const [user] = await knex('users')
      .where({ id: userId })
      .update({
        is_verified: false,
        verification_photo: null,
        verified_at: null,
      })
      .returning(['id', 'email', 'is_verified']);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    console.log(`[VERIFICATION] Revoked verification for user ${userId}. Reason: ${reason}. Admin: ${adminId || 'system'}`);

    return user;
  }
}

module.exports = VerificationService;
