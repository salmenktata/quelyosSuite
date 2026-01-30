/**
 * Jest setup file
 */

import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_ODOO_URL = 'http://localhost:8069';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_PRIMARY_COLOR = '#01613a';
process.env.NEXT_PUBLIC_SECONDARY_COLOR = '#c9c18f';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock localStorage (functional: stores values)
const createStorageMock = () => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] ?? null),
    setItem: jest.fn((key, value) => { store[key] = String(value); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((i) => Object.keys(store)[i] ?? null),
  };
};

Object.defineProperty(window, 'localStorage', { value: createStorageMock(), configurable: true });
Object.defineProperty(window, 'sessionStorage', { value: createStorageMock(), configurable: true });
