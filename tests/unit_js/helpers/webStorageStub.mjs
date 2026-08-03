// Minimal in-memory Web Storage stub for Node tests that import a module calling localStorage
// directly (getItem/setItem/removeItem only — that's the app's whole usage surface).
class MemoryStorage {
  #data = new Map();
  getItem(key) {
    return this.#data.has(key) ? this.#data.get(key) : null;
  }
  setItem(key, value) {
    this.#data.set(key, String(value));
  }
  removeItem(key) {
    this.#data.delete(key);
  }
  clear() {
    this.#data.clear();
  }
}
globalThis.localStorage = new MemoryStorage();
