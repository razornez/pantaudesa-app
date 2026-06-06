// Global test setup — runs before every test file
// Mock environment variables so tests don't need real credentials
process.env.DATABASE_URL  = "postgresql://test:test@localhost:5432/test";
process.env.AUTH_SECRET   = "test-secret-32-chars-minimum-here";
process.env.RESEND_API_KEY = "re_test_key";
process.env.SENTRY_DSN    = "";
