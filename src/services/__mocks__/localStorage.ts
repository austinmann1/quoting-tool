class LocalStorageMock {
  private store: { [key: string]: string } = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = value;
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

export const localStorageMock = new LocalStorageMock();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
