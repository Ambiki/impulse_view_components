/**
 * For the tests only: it is left out of the build. Vitest runs it before each test file.
 */

// Back to real time after a test that faked it. Impulse's testing helpers keep to real time whatever a test fakes.
afterEach(() => {
  vi.useRealTimers();
});
