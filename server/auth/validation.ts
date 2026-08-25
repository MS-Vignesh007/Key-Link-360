const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "10minutemail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "getnada.com",
  "temp-mail.org",
  "throwaway.email",
  "fakeinbox.com",
  "maildrop.cc",
  "dispostable.com",
  "mailnesia.com"
]);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1] || "";
  return DISPOSABLE_DOMAINS.has(domain.toLowerCase());
}

export function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return "Phone number is required.";
  if (!/^\+?[\d\s().-]{7,20}$/.test(trimmed)) {
    return "Enter a valid phone number.";
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return "Enter a valid phone number.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password must be at most 128 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include letters and numbers.";
  }
  return null;
}

export function passwordStrength(password: string): "weak" | "fair" | "good" | "strong" {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return "weak";
  if (score === 3) return "fair";
  if (score === 4) return "good";
  return "strong";
}

export function validateRegistration(input: {
  firstName: string;
  lastName: string;
  companyName: string;
  businessName: string;
  phone: string;
  country: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptPrivacy?: boolean;
}): string | null {
  if (!input.firstName.trim()) return "First name is required.";
  if (!input.lastName.trim()) return "Last name is required.";
  if (!input.companyName.trim()) return "Company name is required.";
  if (!input.businessName.trim()) return "Business name is required.";
  const phoneError = validatePhone(input.phone);
  if (phoneError) return phoneError;
  if (!input.country.trim()) return "Country is required.";
  if (!input.email.trim()) return "Email is required.";
  const email = normalizeEmail(input.email);
  if (!isValidEmailFormat(email)) return "Enter a valid email address.";
  if (isDisposableEmail(email)) {
    return "Disposable email addresses are not allowed.";
  }
  const passwordError = validatePassword(input.password);
  if (passwordError) return passwordError;
  if (input.password !== input.confirmPassword) return "Passwords do not match.";
  if (!input.acceptTerms) return "You must accept the Terms of Service.";
  if (input.acceptPrivacy === false) return "You must accept the Privacy Policy.";
  return null;
}
