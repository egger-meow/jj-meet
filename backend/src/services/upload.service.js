const cloudinary = require('cloudinary').v2;
const knex = require('../config/database');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class UploadService {
  static ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  static MAX_PHOTOS_PER_USER = 6;

  static async uploadProfilePhoto(userId, fileBuffer, mimeType) {
    this.validateFile(fileBuffer, mimeType);

    const result = await this.uploadToCloudinary(fileBuffer, {
      folder: `jjmeet/profiles/${userId}`,
      transformation: [
        { width: 800, height: 800, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });

    await knex('users')
      .where({ id: userId })
      .update({ profile_photo: result.secure_url });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  static async uploadAdditionalPhoto(userId, fileBuffer, mimeType) {
    this.validateFile(fileBuffer, mimeType);

    const user = await knex('users').where({ id: userId }).first();
    const currentPhotos = user.photos || [];

    if (currentPhotos.length >= this.MAX_PHOTOS_PER_USER) {
      const error = new Error(`Maximum ${this.MAX_PHOTOS_PER_USER} photos allowed`);
      error.statusCode = 400;
      error.code = 'UPLOAD_MAX_PHOTOS';
      throw error;
    }

    const result = await this.uploadToCloudinary(fileBuffer, {
      folder: `jjmeet/profiles/${userId}/photos`,
      transformation: [
        { width: 1200, height: 1600, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });

    const newPhotos = [...currentPhotos, {
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date().toISOString(),
    }];

    await knex('users')
      .where({ id: userId })
      .update({ photos: JSON.stringify(newPhotos) });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      photos: newPhotos,
    };
  }

  static async deletePhoto(userId, publicId) {
    const user = await knex('users').where({ id: userId }).first();
    
    if (user.profile_photo?.includes(publicId)) {
      await cloudinary.uploader.destroy(publicId);
      await knex('users')
        .where({ id: userId })
        .update({ profile_photo: null });
      return { deleted: 'profile_photo' };
    }

    const currentPhotos = user.photos || [];
    const photoIndex = currentPhotos.findIndex(p => p.publicId === publicId);

    if (photoIndex === -1) {
      const error = new Error('Photo not found');
      error.statusCode = 404;
      error.code = 'UPLOAD_PHOTO_NOT_FOUND';
      throw error;
    }

    await cloudinary.uploader.destroy(publicId);

    const newPhotos = currentPhotos.filter(p => p.publicId !== publicId);
    await knex('users')
      .where({ id: userId })
      .update({ photos: JSON.stringify(newPhotos) });

    return { deleted: publicId, photos: newPhotos };
  }

  static async reorderPhotos(userId, photoOrder) {
    const user = await knex('users').where({ id: userId }).first();
    const currentPhotos = user.photos || [];

    if (photoOrder.length !== currentPhotos.length) {
      const error = new Error('Invalid photo order');
      error.statusCode = 400;
      error.code = 'UPLOAD_INVALID_ORDER';
      throw error;
    }

    const reorderedPhotos = photoOrder.map(publicId => {
      const photo = currentPhotos.find(p => p.publicId === publicId);
      if (!photo) {
        const error = new Error('Photo not found in order');
        error.statusCode = 400;
        error.code = 'UPLOAD_INVALID_ORDER';
        throw error;
      }
      return photo;
    });

    await knex('users')
      .where({ id: userId })
      .update({ photos: JSON.stringify(reorderedPhotos) });

    return { photos: reorderedPhotos };
  }

  static async uploadChatAttachment(userId, matchId, fileBuffer, mimeType) {
    this.validateFile(fileBuffer, mimeType);

    const result = await this.uploadToCloudinary(fileBuffer, {
      folder: `jjmeet/chats/${matchId}`,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      type: 'image',
    };
  }

  static validateFile(fileBuffer, mimeType) {
    if (!this.ALLOWED_TYPES.includes(mimeType)) {
      const error = new Error('Invalid file type. Allowed: JPEG, PNG, WebP, HEIC');
      error.statusCode = 400;
      error.code = 'UPLOAD_INVALID_TYPE';
      throw error;
    }

    if (fileBuffer.length > this.MAX_FILE_SIZE) {
      const error = new Error('File too large. Maximum 10MB allowed');
      error.statusCode = 400;
      error.code = 'UPLOAD_FILE_TOO_LARGE';
      throw error;
    }
  }

  static uploadToCloudinary(fileBuffer, options) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      const bufferStream = require('stream').Readable.from(fileBuffer);
      bufferStream.pipe(uploadStream);
    });
  }

  static async getUploadSignature(userId, folder = 'profiles') {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: `jjmeet/${folder}/${userId}`,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: `jjmeet/${folder}/${userId}`,
    };
  }
}

module.exports = UploadService;
