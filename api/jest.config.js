module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  verbose: true,
  setupFilesAfterEnv: ["./__tests__/setup.js"],

  // Coverage configuration (T54: 90%+ target)
  collectCoverage: false, // Set to true via CLI with --coverage
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/__tests__/**",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/dist/**",
  ],

  // Coverage thresholds - 90%+ required for T54
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },

  // Coverage reporters
  coverageReporters: [
    "text",          // Console output
    "text-summary",  // Summary in console
    "lcov",          // For CI/CD and tools like Codecov
    "html",          // HTML report in coverage/ folder
    "json",          // JSON for programmatic access
  ],

  // Coverage directory
  coverageDirectory: "coverage",

  // Test timeout (30s for integration tests)
  testTimeout: 30000,
};
