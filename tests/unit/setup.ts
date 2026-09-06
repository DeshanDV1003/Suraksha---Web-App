// Global test setup — runs once per test file, before the suite.

// Backend modules read these at import time; give them deterministic values so
// nothing throws just from being imported.
process.env.JWT_SECRET ??= 'unit-test-secret';
process.env.DATABASE_URL ??= 'postgresql://unit:test@localhost:5432/unit_test_db';
process.env.NODE_ENV = 'test';

// jsdom-only matchers (@testing-library). Harmless to load in the node env too,
// but guard so we don't pull the DOM shim where it isn't needed.
if (typeof window !== 'undefined') {
  await import('@testing-library/jest-dom/vitest');
}
