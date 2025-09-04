import React, { createContext, useContext, useCallback, useState, useMemo } from 'react';

const ToastContext = createContext({ success: () => {}, error: () => {}, info: () => {}, warn: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), 3000);
  }, [remove]);

  const api = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
    warn: (m) => push('warn', m),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={styles.container} aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} style={{ ...styles.toast, ...styles[t.type] }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = {
  container: {
    position: 'fixed',
    right: 16,
    bottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 9999,
  },
  toast: {
    minWidth: 260,
    maxWidth: 360,
    padding: '12px 14px',
    borderRadius: 12,
    color: '#f5f6fa',
    boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  success: { background: 'linear-gradient(135deg, #224b2a, #1e2f24)' },
  error: { background: 'linear-gradient(135deg, #4b2222, #2f1e1e)' },
  info: { background: 'linear-gradient(135deg, #223a4b, #1e2a2f)' },
  warn: { background: 'linear-gradient(135deg, #4b4322, #2f2a1e)' },
}; 