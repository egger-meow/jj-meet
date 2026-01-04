const UploadService = require('../../../src/services/upload.service');

describe('UploadService', () => {
  describe('validateFile', () => {
    it('should accept valid JPEG file', () => {
      const buffer = Buffer.alloc(1024);
      expect(() => {
        UploadService.validateFile(buffer, 'image/jpeg');
      }).not.toThrow();
    });

    it('should accept valid PNG file', () => {
      const buffer = Buffer.alloc(1024);
      expect(() => {
        UploadService.validateFile(buffer, 'image/png');
      }).not.toThrow();
    });

    it('should accept valid WebP file', () => {
      const buffer = Buffer.alloc(1024);
      expect(() => {
        UploadService.validateFile(buffer, 'image/webp');
      }).not.toThrow();
    });

    it('should accept valid HEIC file', () => {
      const buffer = Buffer.alloc(1024);
      expect(() => {
        UploadService.validateFile(buffer, 'image/heic');
      }).not.toThrow();
    });

    it('should reject invalid file type', () => {
      const buffer = Buffer.alloc(1024);
      expect(() => {
        UploadService.validateFile(buffer, 'application/pdf');
      }).toThrow('Invalid file type');
    });

    it('should reject file exceeding max size', () => {
      const buffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      expect(() => {
        UploadService.validateFile(buffer, 'image/jpeg');
      }).toThrow('File too large');
    });

    it('should accept file at max size boundary', () => {
      const buffer = Buffer.alloc(10 * 1024 * 1024); // Exactly 10MB
      expect(() => {
        UploadService.validateFile(buffer, 'image/jpeg');
      }).not.toThrow();
    });
  });

  describe('ALLOWED_TYPES', () => {
    it('should include standard image types', () => {
      expect(UploadService.ALLOWED_TYPES).toContain('image/jpeg');
      expect(UploadService.ALLOWED_TYPES).toContain('image/png');
      expect(UploadService.ALLOWED_TYPES).toContain('image/webp');
      expect(UploadService.ALLOWED_TYPES).toContain('image/heic');
    });

    it('should have exactly 4 allowed types', () => {
      expect(UploadService.ALLOWED_TYPES).toHaveLength(4);
    });
  });

  describe('MAX_FILE_SIZE', () => {
    it('should be 10MB', () => {
      expect(UploadService.MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });

  describe('MAX_PHOTOS_PER_USER', () => {
    it('should be 6', () => {
      expect(UploadService.MAX_PHOTOS_PER_USER).toBe(6);
    });
  });
});
