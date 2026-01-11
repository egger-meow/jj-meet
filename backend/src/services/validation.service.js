class ValidationService {
  static SOCIAL_PLATFORMS = {
    instagram: {
      pattern: /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?$/,
      urlTemplate: 'https://instagram.com/',
      handlePattern: /^@?([a-zA-Z0-9_.]{1,30})$/,
    },
    twitter: {
      pattern: /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/?$/,
      urlTemplate: 'https://twitter.com/',
      handlePattern: /^@?([a-zA-Z0-9_]{1,15})$/,
    },
    tiktok: {
      pattern: /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@?([a-zA-Z0-9_.]+)\/?$/,
      urlTemplate: 'https://tiktok.com/@',
      handlePattern: /^@?([a-zA-Z0-9_.]{1,24})$/,
    },
    facebook: {
      pattern: /^(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9.]+)\/?$/,
      urlTemplate: 'https://facebook.com/',
      handlePattern: /^([a-zA-Z0-9.]{5,50})$/,
    },
    linkedin: {
      pattern: /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)\/?$/,
      urlTemplate: 'https://linkedin.com/in/',
      handlePattern: /^([a-zA-Z0-9-]{3,100})$/,
    },
  };

  static parseSocialLink(input) {
    if (!input || typeof input !== 'string') {
      return { isValid: false, error: 'Invalid input' };
    }

    const trimmed = input.trim();

    for (const [platform, config] of Object.entries(this.SOCIAL_PLATFORMS)) {
      const urlMatch = trimmed.match(config.pattern);
      if (urlMatch) {
        return {
          isValid: true,
          platform,
          handle: urlMatch[1],
          normalizedUrl: config.urlTemplate + urlMatch[1],
        };
      }

      const handleMatch = trimmed.match(config.handlePattern);
      if (handleMatch && !trimmed.includes('/') && !trimmed.includes('.com')) {
        continue;
      }
    }

    if (trimmed.startsWith('@')) {
      const handle = trimmed.slice(1);
      if (this.SOCIAL_PLATFORMS.instagram.handlePattern.test(handle)) {
        return {
          isValid: true,
          platform: 'instagram',
          handle,
          normalizedUrl: this.SOCIAL_PLATFORMS.instagram.urlTemplate + handle,
        };
      }
    }

    const urlPattern = /^(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/;
    if (urlPattern.test(trimmed)) {
      return {
        isValid: true,
        platform: 'other',
        handle: null,
        normalizedUrl: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
      };
    }

    return {
      isValid: false,
      error: 'Could not parse social link. Please provide a valid URL or @username',
    };
  }

  static validateSocialLink(input) {
    const result = this.parseSocialLink(input);
    
    if (!result.isValid) {
      const error = new Error(result.error);
      error.statusCode = 400;
      error.code = 'VALIDATION_INVALID_SOCIAL_LINK';
      throw error;
    }

    return result;
  }

  static normalizeSocialLink(input) {
    const result = this.parseSocialLink(input);
    return result.isValid ? result.normalizedUrl : null;
  }

  static extractPlatform(input) {
    const result = this.parseSocialLink(input);
    return result.isValid ? result.platform : null;
  }

  static validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  static validatePhone(phone) {
    const phonePattern = /^\+?[\d\s-()]{10,20}$/;
    return phonePattern.test(phone);
  }

  static sanitizeString(input, maxLength = 1000) {
    if (!input || typeof input !== 'string') return '';
    return input.trim().slice(0, maxLength);
  }

  static validateBirthDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }

    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();

    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      actualAge--;
    }

    if (actualAge < 18) {
      return { isValid: false, error: 'Must be at least 18 years old' };
    }

    if (actualAge > 120) {
      return { isValid: false, error: 'Invalid birth date' };
    }

    return { isValid: true, age: actualAge };
  }
}

module.exports = ValidationService;
