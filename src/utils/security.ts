import DOMPurify from "dompurify";

// Input validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+20|0)?1[0125][0-9]{8}$/,
  NATIONAL_ID: /^[0-9]{14}$/,
  NAME: /^[\u0600-\u06FF\s]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9\u0600-\u06FF\s]+$/,
  URL: /^https?:\/\/.+/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
};

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== "string") return "";

  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  // HTML sanitization
  sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });

  return sanitized;
};

// Input validation
export const validateInput = {
  email: (email: string): boolean => {
    const sanitized = sanitizeInput(email);
    return VALIDATION_PATTERNS.EMAIL.test(sanitized);
  },

  phone: (phone: string): boolean => {
    const sanitized = sanitizeInput(phone);
    return VALIDATION_PATTERNS.PHONE.test(sanitized);
  },

  nationalId: (nationalId: string): boolean => {
    const sanitized = sanitizeInput(nationalId);
    return VALIDATION_PATTERNS.NATIONAL_ID.test(sanitized);
  },

  name: (name: string): boolean => {
    const sanitized = sanitizeInput(name);
    return VALIDATION_PATTERNS.NAME.test(sanitized) && sanitized.length >= 2;
  },

  required: (value: any): boolean => {
    if (typeof value === "string") {
      return sanitizeInput(value).length > 0;
    }
    return value !== null && value !== undefined;
  },

  minLength: (value: string, min: number): boolean => {
    return sanitizeInput(value).length >= min;
  },

  maxLength: (value: string, max: number): boolean => {
    return sanitizeInput(value).length <= max;
  },

  alphanumeric: (value: string): boolean => {
    const sanitized = sanitizeInput(value);
    return VALIDATION_PATTERNS.ALPHANUMERIC.test(sanitized);
  },
};

// Rate limiting
export const checkRateLimit = (
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
};

// XSS Prevention
export const escapeHtml = (text: string): string => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

// SQL Injection Prevention (basic)
export const sanitizeSqlInput = (input: string): string => {
  if (typeof input !== "string") return "";

  // Remove SQL injection patterns
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b)/gi,
    /(['";\\])/g,
    /(--)/g,
    /(\/\*|\*\/)/g,
    /(xp_|sp_)/gi,
  ];

  let sanitized = input;
  sqlPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  return sanitized.trim();
};

// Password strength validation
export const validatePassword = (
  password: string
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Session security
export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
};

// CSRF Protection
export const generateCSRFToken = (): string => {
  return generateSecureToken();
};

export const validateCSRFToken = (
  token: string,
  storedToken: string
): boolean => {
  return token === storedToken && token.length === 64;
};
