/**
 * GHOST PROTOCOL — Data Refresh Event Bus
 *
 * Lightweight module-level event bus for immediate data invalidation
 * across component boundaries. Works alongside existing polling as
 * a fast-path notification when incident data changes.
 */

import { useEffect } from 'react';

const listeners = new Set();

export function notifyDataChanged(type = 'incidents') {
  listeners.forEach((fn) => fn(type));
}

export function useDataRefresh(callback) {
  useEffect(() => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }, [callback]);
}
