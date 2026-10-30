import '@testing-library/jest-dom/vitest';

// Mock ResizeObserver for Recharts in jsdom
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.scrollTo
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
}
