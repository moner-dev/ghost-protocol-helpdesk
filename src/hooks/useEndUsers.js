/**
 * GHOST PROTOCOL — useEndUsers Hook
 *
 * Manages end users (reporters) data from the database.
 * Provides CRUD operations for the End Users system.
 * Requires Electron runtime — no mock data fallback.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

const isElectron = typeof window !== 'undefined' && window.electronAPI?.endUsers;

export function useEndUsers(options = {}) {
  const { includeInactive = false, autoFetch = true } = options;

  const [endUsers, setEndUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════

  const totalCount = useMemo(() => endUsers.length, [endUsers]);

  const activeCount = useMemo(() =>
    endUsers.filter(user => user.is_active).length,
    [endUsers]
  );

  const inactiveCount = useMemo(() =>
    endUsers.filter(user => !user.is_active).length,
    [endUsers]
  );

  const withIncidentsCount = useMemo(() =>
    endUsers.filter(user => (user.incident_count || 0) > 0).length,
    [endUsers]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH ALL END USERS
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchEndUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isElectron) {
        const result = await window.electronAPI.endUsers.getAll({ includeInactive });
        setEndUsers(result);
      } else {
        setEndUsers([]);
        setError('Database unavailable — run with Electron');
      }
    } catch (err) {
      console.error('[useEndUsers] Fetch failed:', err);
      setEndUsers([]);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [includeInactive]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GET SINGLE END USER BY ID
  // ═══════════════════════════════════════════════════════════════════════════

  const getEndUserById = useCallback(async (id) => {
    if (!isElectron) {
      throw new Error('Database unavailable — run with Electron');
    }
    return window.electronAPI.endUsers.getById(id);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH END USERS
  // ═══════════════════════════════════════════════════════════════════════════

  const searchEndUsers = useCallback(async (query) => {
    if (!isElectron) {
      throw new Error('Database unavailable — run with Electron');
    }
    return window.electronAPI.endUsers.search(query);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE END USER
  // ═══════════════════════════════════════════════════════════════════════════

  const createEndUser = useCallback(async (data, performedBy, performerName) => {
    if (!isElectron) {
      throw new Error('Database unavailable — run with Electron');
    }
    const result = await window.electronAPI.endUsers.create(data, performedBy, performerName);
    // Refresh the list after creation
    await fetchEndUsers();
    return result;
  }, [fetchEndUsers]);

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE END USER
  // ═══════════════════════════════════════════════════════════════════════════

  const updateEndUser = useCallback(async (id, updates, performedBy, performerName) => {
    if (!isElectron) {
      throw new Error('Database unavailable — run with Electron');
    }
    const result = await window.electronAPI.endUsers.update(id, updates, performedBy, performerName);
    // Refresh the list after update
    await fetchEndUsers();
    return result;
  }, [fetchEndUsers]);

  // ═══════════════════════════════════════════════════════════════════════════
  // DEACTIVATE END USER (Soft Delete)
  // ═══════════════════════════════════════════════════════════════════════════

  const deactivateEndUser = useCallback(async (id, performedBy, performerName) => {
    if (!isElectron) {
      throw new Error('Database unavailable — run with Electron');
    }
    const result = await window.electronAPI.endUsers.deactivate(id, performedBy, performerName);
    // Refresh the list after deactivation
    await fetchEndUsers();
    return result;
  }, [fetchEndUsers]);

  // ═══════════════════════════════════════════════════════════════════════════
  // REACTIVATE END USER
  // ═══════════════════════════════════════════════════════════════════════════

  const reactivateEndUser = useCallback(async (id, performedBy, performerName) => {
    if (!isElectron) {
      throw new Error('Database unavailable — run with Electron');
    }
    const result = await window.electronAPI.endUsers.reactivate(id, performedBy, performerName);
    // Refresh the list after reactivation
    await fetchEndUsers();
    return result;
  }, [fetchEndUsers]);

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE END USER (Hard Delete — only if no linked incidents)
  // ═══════════════════════════════════════════════════════════════════════════

  const deleteEndUser = useCallback(async (id, performedBy, performerName) => {
    if (!isElectron) {
      throw new Error('Database unavailable — run with Electron');
    }
    const result = await window.electronAPI.endUsers.delete(id, performedBy, performerName);
    // Refresh the list after deletion
    await fetchEndUsers();
    return result;
  }, [fetchEndUsers]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GET INCIDENT COUNT FOR END USER
  // ═══════════════════════════════════════════════════════════════════════════

  const getIncidentCount = useCallback(async (id) => {
    if (!isElectron) {
      throw new Error('Database unavailable — run with Electron');
    }
    return window.electronAPI.endUsers.getIncidentCount(id);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-FETCH ON MOUNT
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (autoFetch) {
      fetchEndUsers();
    }
  }, [autoFetch, fetchEndUsers]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN HOOK API
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // State
    endUsers,
    isLoading,
    error,

    // Computed values
    totalCount,
    activeCount,
    inactiveCount,
    withIncidentsCount,

    // Read operations
    refresh: fetchEndUsers,
    getEndUserById,
    searchEndUsers,
    getIncidentCount,

    // Write operations
    createEndUser,
    updateEndUser,
    deactivateEndUser,
    reactivateEndUser,
    deleteEndUser,
  };
}

export default useEndUsers;
