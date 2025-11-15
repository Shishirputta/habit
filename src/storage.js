// src/storage.js - Local storage wrapper for game data
const storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    return value ? { value: JSON.parse(value) } : null;  // Parse JSON for safety
  },

  async set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return { success: true };
  },

  async delete(key) {
    localStorage.removeItem(key);
    return { success: true };
  }
};

// Expose globally
window.storage = storage;

export default storage;