'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if ('serviceWorker' in navigator && (process.env.NODE_ENV === 'production' || isLocalhost)) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
    }
  }, []);
  return null;
}
