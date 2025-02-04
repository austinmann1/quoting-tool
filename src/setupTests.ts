// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { act } from 'react';

// Configure Testing Library to use React's act
configure({
  asyncUtilTimeout: 5000,
  defaultHidden: true,
  eventWrapper: (cb) => act(cb),
});

// Mock TextEncoder/TextDecoder
class TextEncoderPolyfill {
  encode(str: string): Uint8Array {
    const arr = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      arr[i] = str.charCodeAt(i);
    }
    return arr;
  }
}

class TextDecoderPolyfill {
  decode(arr: Uint8Array): string {
    return String.fromCharCode.apply(null, Array.from(arr));
  }
}

global.TextEncoder = TextEncoderPolyfill;
global.TextDecoder = TextDecoderPolyfill;

// Mock localStorage
class LocalStorageMock {
  private store: { [key: string]: string } = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
  writable: false,
});

// Clear all mocks before each test
beforeEach(() => {
  (window.localStorage as LocalStorageMock).clear();
  jest.clearAllMocks();
});
