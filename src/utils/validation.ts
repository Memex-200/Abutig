export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validatePhoneNumber = (phone: string): ValidationResult => {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, "");

  if (!cleanPhone) {
    return {
      isValid: false,
      error: "رقم الهاتف مطلوب",
    };
  }

  if (cleanPhone.length !== 11) {
    return {
      isValid: false,
      error: "رقم الهاتف يجب أن يكون 11 رقم بالضبط",
    };
  }

  // Check if it starts with 01 (Egyptian mobile numbers)
  if (!cleanPhone.startsWith("01")) {
    return {
      isValid: false,
      error: "رقم الهاتف يجب أن يبدأ بـ 01",
    };
  }

  return { isValid: true };
};

export const validateNationalId = (nationalId: string): ValidationResult => {
  // Remove any non-digit characters
  const cleanNationalId = nationalId.replace(/\D/g, "");

  if (!cleanNationalId) {
    return {
      isValid: false,
      error: "الرقم القومي مطلوب",
    };
  }

  if (cleanNationalId.length !== 14) {
    return {
      isValid: false,
      error: "الرقم القومي يجب أن يكون 14 رقم بالضبط",
    };
  }

  return { isValid: true };
};

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: true }; // Email is optional
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: "البريد الإلكتروني غير صحيح",
    };
  }

  return { isValid: true };
};

export const validateRequired = (
  value: string,
  fieldName: string
): ValidationResult => {
  if (!value || !value.trim()) {
    return {
      isValid: false,
      error: `${fieldName} مطلوب`,
    };
  }

  return { isValid: true };
};
