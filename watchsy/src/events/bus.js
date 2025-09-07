export const emit = (type, detail) => {
  try {
    window.dispatchEvent(new CustomEvent(type, { detail }));
  } catch (_) {
    // no-op
  }
};

export const on = (type, handler) => {
  window.addEventListener(type, handler);
  return () => window.removeEventListener(type, handler);
}; 