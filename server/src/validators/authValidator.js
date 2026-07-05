/**
 * Validator middleware for registration request body
 */
export const validateRegister = (req, res, next) => {
  const { firstName, lastName, email, password, phone } = req.body;
  const errors = [];

  // 1. Validate First Name
  if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
    errors.push('First name is required');
  }

  // 2. Validate Last Name
  if (!lastName || typeof lastName !== 'string' || lastName.trim() === '') {
    errors.push('Last name is required');
  }

  // 3. Validate Email
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Invalid email format');
    }
  }

  // 4. Validate Password Complexity
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else {
    if (password.length < 8 || password.length > 64) {
      errors.push('Password must be between 8 and 64 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  // 5. Validate Phone (optional but checked if supplied)
  if (phone !== undefined && phone !== null && phone !== '') {
    if (typeof phone !== 'string') {
      errors.push('Phone number must be a string');
    } else {
      // Allow standard formats: e.g. +1234567890, (123) 456-7890, 123-456-7890
      const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
      if (!phoneRegex.test(phone.trim())) {
        errors.push('Invalid phone number format');
      }
    }
  }

  // If validation failed, return 400 Bad Request
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
    });
  }

  next();
};

/**
 * Validator middleware for login request body
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Validate Email
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Invalid email format');
    }
  }

  // Validate Password
  if (!password || typeof password !== 'string' || password === '') {
    errors.push('Password is required');
  }

  // If validation failed, return 400 Bad Request
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
    });
  }

  next();
};

/**
 * Helper to check password complexity rules
 */
export const isPasswordComplex = (password) => {
  const errors = [];
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return errors;
  }
  if (password.length < 8 || password.length > 64) {
    errors.push('Password must be between 8 and 64 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  return errors;
};

/**
 * Validator middleware for forgot password requests
 */
export const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Invalid email format');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }
  next();
};

/**
 * Validator middleware for verifying reset OTP codes
 */
export const validateVerifyResetOtp = (req, res, next) => {
  const { email, otp } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Invalid email format');
    }
  }

  if (!otp || typeof otp !== 'string' || otp.trim() === '') {
    errors.push('OTP is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }
  next();
};

/**
 * Validator middleware for resetting passwords
 */
export const validateResetPassword = (req, res, next) => {
  const { email, otp, newPassword, confirmPassword } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Invalid email format');
    }
  }

  if (!otp || typeof otp !== 'string' || otp.trim() === '') {
    errors.push('OTP is required');
  }

  const pwdErrors = isPasswordComplex(newPassword);
  if (pwdErrors.length > 0) {
    errors.push(...pwdErrors);
  }

  if (newPassword !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }
  next();
};

/**
 * Validator middleware for authenticated change password requests
 */
export const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const errors = [];

  if (!currentPassword || typeof currentPassword !== 'string' || currentPassword === '') {
    errors.push('Current password is required');
  }

  const pwdErrors = isPasswordComplex(newPassword);
  if (pwdErrors.length > 0) {
    errors.push(...pwdErrors);
  }

  if (newPassword !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }
  next();
};
