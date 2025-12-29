/**
 * Map Supabase auth error messages to user-friendly messages
 */
export function getAuthErrorMessage(error: any): string {
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code || '';

  // Invalid credentials
  if (message.includes('invalid login credentials') || message.includes('invalid password')) {
    return 'Incorrect email or password. Please check and try again.';
  }

  // User not found
  if (message.includes('user not found') || message.includes('no user found')) {
    return 'No account found with this email. Would you like to sign up?';
  }

  // Email already registered
  if (message.includes('user already registered') || message.includes('already exists')) {
    return 'This email is already registered. Try signing in instead.';
  }

  // Invalid email format
  if (message.includes('invalid email') || message.includes('unable to validate email')) {
    return 'Please enter a valid email address.';
  }

  // Weak password
  if (message.includes('password') && (message.includes('weak') || message.includes('short') || message.includes('at least'))) {
    return 'Password must be at least 6 characters long.';
  }

  // Too many requests / Rate limiting
  if (message.includes('too many requests') || message.includes('rate limit') || code === '429') {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  // Email not confirmed
  if (message.includes('email not confirmed') || message.includes('confirm your email')) {
    return 'Please check your email and click the confirmation link before signing in.';
  }

  // Network error
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'Connection error. Please check your internet and try again.';
  }

  // Signup disabled
  if (message.includes('signups not allowed') || message.includes('signup disabled')) {
    return 'New signups are currently disabled. Please try again later.';
  }

  // Session expired
  if (message.includes('session') && (message.includes('expired') || message.includes('invalid'))) {
    return 'Your session has expired. Please sign in again.';
  }

  // Generic fallback
  if (message) {
    // Capitalize first letter and ensure it ends with a period
    const formatted = message.charAt(0).toUpperCase() + message.slice(1);
    return formatted.endsWith('.') ? formatted : `${formatted}.`;
  }

  return 'Something went wrong. Please try again.';
}
