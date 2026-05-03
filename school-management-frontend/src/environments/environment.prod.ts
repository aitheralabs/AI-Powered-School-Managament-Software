export const environment = {
  production: true,
  // Relative URL: works on any domain since nginx proxies /api/ to the backend.
  // Same-origin requests have no CORS preflight — eliminates the Authorization
  // header preflight issue that caused intermittent E2E test failures.
  apiUrl: '/api/v1',
  apiTimeout: 30000,
  apiVersion: 'v1',
};
