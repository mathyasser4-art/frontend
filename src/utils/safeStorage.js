// Safe Storage Utility
// Prevents app crashes in iOS Safari Private Browsing Mode, WebView restrictions, or environments where localStorage/sessionStorage throws errors.

const memoryStorage = {};

const isStorageAvailable = (type) => {
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

const hasLocalStorage = isStorageAvailable('localStorage');
const hasSessionStorage = isStorageAvailable('sessionStorage');

export const safeLocalStorage = {
  getItem: (key) => {
    try {
      if (hasLocalStorage) {
        return localStorage.getItem(key);
      }
      return memoryStorage[key] || null;
    } catch (e) {
      console.warn(`safeLocalStorage.getItem failed for key "${key}":`, e);
      return memoryStorage[key] || null;
    }
  },

  setItem: (key, value) => {
    try {
      const stringValue = String(value);
      memoryStorage[key] = stringValue;
      if (hasLocalStorage) {
        localStorage.setItem(key, stringValue);
      }
    } catch (e) {
      console.warn(`safeLocalStorage.setItem failed for key "${key}":`, e);
    }
  },

  removeItem: (key) => {
    try {
      delete memoryStorage[key];
      if (hasLocalStorage) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`safeLocalStorage.removeItem failed for key "${key}":`, e);
    }
  },

  clear: () => {
    try {
      Object.keys(memoryStorage).forEach(k => delete memoryStorage[k]);
      if (hasLocalStorage) {
        localStorage.clear();
      }
    } catch (e) {
      console.warn(`safeLocalStorage.clear failed:`, e);
    }
  }
};

export const safeSessionStorage = {
  getItem: (key) => {
    try {
      if (hasSessionStorage) {
        return sessionStorage.getItem(key);
      }
      return memoryStorage[key] || null;
    } catch (e) {
      return memoryStorage[key] || null;
    }
  },

  setItem: (key, value) => {
    try {
      const stringValue = String(value);
      memoryStorage[key] = stringValue;
      if (hasSessionStorage) {
        sessionStorage.setItem(key, stringValue);
      }
    } catch (e) {
      console.warn(`safeSessionStorage.setItem failed:`, e);
    }
  },

  removeItem: (key) => {
    try {
      delete memoryStorage[key];
      if (hasSessionStorage) {
        sessionStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`safeSessionStorage.removeItem failed:`, e);
    }
  }
};

export default safeLocalStorage;
