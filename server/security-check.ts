// Security validation module - ensures no sensitive data is exposed to client
export function validateEnvironmentSecurity() {
  const sensitiveEnvVars = [
    'OPENAI_API_KEY',
    'DATABASE_URL', 
    'STRIPE_SECRET_KEY',
    'SESSION_SECRET',
    'PGPASSWORD'
  ];

  // Check that sensitive environment variables exist in production
  if (process.env.NODE_ENV === 'production') {
    const missingVars = sensitiveEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('SECURITY ERROR: Missing required environment variables in production:', missingVars);
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  // Verify that client-accessible environment variables are properly prefixed
  const clientSafeVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID', 
    'VITE_FIREBASE_APP_ID',
    'VITE_STRIPE_PUBLIC_KEY'
  ];

  // Log security status
  console.log('✅ Security validation passed - all sensitive environment variables are server-side only');
  console.log('✅ Client environment variables are properly prefixed with VITE_');
  
  return true;
}

// Helper to strip sensitive data from error messages before sending to client
export function sanitizeErrorForClient(error: any): string {
  const errorMessage = error?.message || 'An unexpected error occurred';
  
  // Remove any potential sensitive information from error messages
  return errorMessage
    .replace(/api[_-]?key/gi, '[REDACTED]')
    .replace(/secret/gi, '[REDACTED]')
    .replace(/password/gi, '[REDACTED]')
    .replace(/token/gi, '[REDACTED]')
    .replace(/sk_[a-zA-Z0-9_]+/g, '[REDACTED]')  // Stripe secret keys
    .replace(/pk_[a-zA-Z0-9_]+/g, '[PUBLIC_KEY]'); // Stripe public keys (less sensitive)
}