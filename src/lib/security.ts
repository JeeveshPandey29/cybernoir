const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,32}$/;

export function isValidEmail(email: string) {
  return EMAIL_REGEX.test(email.trim());
}

export function normalizeUsername(username: string) {
  return username.trim();
}

export function isValidUsername(username: string) {
  return USERNAME_REGEX.test(username);
}

export function validatePasswordStrength(password: string) {
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must include a number";
  }

  return null;
}
