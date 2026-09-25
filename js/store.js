/**
 * store.js — Safe localStorage wrapper.
 * Every read/write is try/catch so the app works even if storage is blocked.
 */

const PREFIX = 'lankawave:';

export function get(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

export function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — silently ignore */
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* silently ignore */
  }
}
