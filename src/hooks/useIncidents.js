/**
 * GHOST PROTOCOL — useIncidents Hook
 *
 * Manages incident data via Electron IPC.
 * Requires Electron runtime — no mock data fallback.
 */

import { useState, useEffect, useCallback } from 'react';
import { notifyDataChanged } from './useDataRefresh';

const isElectron = typeof window !== 'undefined' && window.electronAPI?.incidents;

export function useIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isElectron) {
        const data = await window.electronAPI.incidents.getAll();
        setIncidents(data);
      } else {
        // No mock fallback — requires Electron runtime
        setIncidents([]);
        setError('Database unavailable — run with Electron');
      }
    } catch (err) {
      setError(err.message);
      setIncidents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();

    // Poll every 10s when in Electron
    if (isElectron) {
      const interval = setInterval(() => {
        // Silent refresh — don't set isLoading to avoid UI flicker
        window.electronAPI.incidents.getAll()
          .then((data) => setIncidents(data))
          .catch(() => {});
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchIncidents]);

  const createIncident = useCallback(async (data, performedBy) => {
    try {
      if (isElectron) {
        const result = await window.electronAPI.incidents.create(data, performedBy);
        // Handle new response format with RBAC
        if (result && typeof result === 'object' && 'success' in result) {
          if (result.success) {
            setIncidents((prev) => [result.data, ...prev]);
            notifyDataChanged('incidents');
            return result.data;
          } else {
            setError(result.error);
            return null;
          }
        }
        // Legacy format
        setIncidents((prev) => [result, ...prev]);
        notifyDataChanged('incidents');
        return result;
      } else {
        setError('Database unavailable — run with Electron');
        return null;
      }
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const updateIncident = useCallback(async (id, updates, performedBy) => {
    try {
      if (isElectron) {
        const result = await window.electronAPI.incidents.update(id, updates, performedBy);

        // Handle new response format with backend validation
        if (result && typeof result === 'object' && 'success' in result) {
          if (result.success) {
            const updated = result.data;
            if (updated) {
              setIncidents((prev) => prev.map((inc) => (inc.id === id ? updated : inc)));
            }
            notifyDataChanged('incidents');
            return { success: true, data: updated };
          } else {
            // Backend validation error
            setError(result.error);
            return { success: false, error: result.error };
          }
        }

        // Legacy format support (direct object return)
        if (result) {
          setIncidents((prev) => prev.map((inc) => (inc.id === id ? result : inc)));
        }
        notifyDataChanged('incidents');
        return { success: true, data: result };
      } else {
        const errorMsg = 'Database unavailable — run with Electron';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  const deleteIncident = useCallback(async (id, performedBy, performerName) => {
    try {
      if (isElectron) {
        const result = await window.electronAPI.incidents.delete(id, performedBy, performerName);
        // Handle new response format with RBAC
        if (result && typeof result === 'object' && 'success' in result) {
          if (result.success) {
            setIncidents((prev) => prev.filter((inc) => inc.id !== id));
            notifyDataChanged('incidents');
            return true;
          } else {
            setError(result.error);
            return { success: false, error: result.error };
          }
        }
        // Legacy format
        if (result) {
          setIncidents((prev) => prev.filter((inc) => inc.id !== id));
          notifyDataChanged('incidents');
        }
        return result;
      } else {
        setError('Database unavailable — run with Electron');
        return false;
      }
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const getIncidentHistory = useCallback(async (incidentId) => {
    try {
      if (isElectron) {
        return await window.electronAPI.incidents.getHistory(incidentId);
      }
      return [];
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, []);

  return {
    incidents,
    setIncidents,
    isLoading,
    error,
    fetchIncidents,
    createIncident,
    updateIncident,
    deleteIncident,
    getIncidentHistory,
  };
}

export default useIncidents;
