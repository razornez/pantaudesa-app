const REQUIRED_ENV_VARS = ["AUTH_SECRET", "DATABASE_URL", "RESEND_API_KEY", "RESEND_FROM"] as const;

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
