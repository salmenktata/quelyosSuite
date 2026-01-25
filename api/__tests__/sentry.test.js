const { describe, expect, test, beforeEach, afterEach } = require('@jest/globals');

// Fabrique un nouveau mock Sentry pour chaque scénario
const buildSentryMock = () => ({
  init: jest.fn(),
  Handlers: {
    requestHandler: jest.fn(() => 'reqHandler'),
    tracingHandler: jest.fn(() => 'traceHandler')
  }
});

// Mock ProfilingIntegration
jest.mock('@sentry/profiling-node', () => ({
  ProfilingIntegration: jest.fn().mockImplementation(() => ({
    name: 'ProfilingIntegration'
  }))
}));

// Charge initSentry avec un mock Sentry fourni
function loadInitSentry(sentryMock) {
  jest.resetModules();
  jest.doMock('@sentry/node', () => sentryMock);
  return require('../src/sentry').initSentry;
}

const ORIGINAL_ENV = { ...process.env };

describe('initSentry', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('désactive Sentry quand SENTRY_DSN est absent', () => {
    delete process.env.SENTRY_DSN;
    const sentryMock = buildSentryMock();
    const initSentry = loadInitSentry(sentryMock);

    const app = { use: jest.fn() };
    const result = initSentry(app);

    expect(result.enabled).toBe(false);
    expect(sentryMock.init).not.toHaveBeenCalled();
    expect(app.use).not.toHaveBeenCalled();
  });

  test('active Sentry et attache les middlewares quand SENTRY_DSN est défini', () => {
    process.env.SENTRY_DSN = 'https://examplePublicKey.ingest.sentry.io/projectId';
    process.env.SENTRY_TRACES_SAMPLE_RATE = '0.05';
    process.env.NODE_ENV = 'test';

    const sentryMock = buildSentryMock();
    const initSentry = loadInitSentry(sentryMock);
    const app = { use: jest.fn() };

    const result = initSentry(app);

    expect(result.enabled).toBe(true);
    expect(sentryMock.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: process.env.SENTRY_DSN,
        environment: 'test',
        tracesSampleRate: 0.05
      })
    );
    expect(app.use).toHaveBeenCalledTimes(2);
    expect(app.use).toHaveBeenCalledWith('reqHandler');
    expect(app.use).toHaveBeenCalledWith('traceHandler');
  });

  test('utilise le taux par défaut quand SENTRY_TRACES_SAMPLE_RATE est invalide', () => {
    process.env.SENTRY_DSN = 'https://examplePublicKey.ingest.sentry.io/projectId';
    process.env.SENTRY_TRACES_SAMPLE_RATE = 'abc';

    const sentryMock = buildSentryMock();
    const initSentry = loadInitSentry(sentryMock);
    const app = { use: jest.fn() };

    initSentry(app);

    expect(sentryMock.init).toHaveBeenCalledWith(
      expect.objectContaining({ tracesSampleRate: 0.1 })
    );
  });
});
