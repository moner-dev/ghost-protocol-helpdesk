/**
 * GHOST PROTOCOL — Company Departments Hook
 *
 * Shared hook for accessing company departments from the database.
 * Caches results to prevent multiple IPC calls from different components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { notifyDataChanged } from './useDataRefresh';

// ═══════════════════════════════════════════════════════════════════════════
// CACHE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// Simple in-memory cache shared across all hook instances
const cache = {
  departments: null,
  allDepartments: null,
  lastFetch: null,
  isLoading: false,
  error: null,
  listeners: new Set(),
};

// Cache TTL: 30 seconds
const CACHE_TTL = 30000;

function isCacheValid() {
  return cache.lastFetch && (Date.now() - cache.lastFetch) < CACHE_TTL;
}

function notifyListeners() {
  cache.listeners.forEach(listener => listener());
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useCompanyDepartments() {
  const [, forceUpdate] = useState({});
  const mountedRef = useRef(true);

  // Subscribe to cache updates
  useEffect(() => {
    const listener = () => {
      if (mountedRef.current) {
        forceUpdate({});
      }
    };
    cache.listeners.add(listener);
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      cache.listeners.delete(listener);
    };
  }, []);

  // Fetch departments from database
  const fetchDepartments = useCallback(async (force = false) => {
    // Return cached data if valid and not forcing refresh
    if (!force && isCacheValid() && cache.departments) {
      return;
    }

    // Prevent concurrent fetches
    if (cache.isLoading) {
      return;
    }

    cache.isLoading = true;
    cache.error = null;
    notifyListeners();

    try {
      // Fetch both active and all departments
      const [activeResult, allResult] = await Promise.all([
        window.electronAPI.companyDepts.getAll(false),
        window.electronAPI.companyDepts.getAll(true),
      ]);

      if (activeResult?.success) {
        cache.departments = activeResult.departments;
      } else if (activeResult?.error) {
        cache.error = activeResult.error;
      }
      if (allResult?.success) {
        cache.allDepartments = allResult.departments;
      } else if (allResult?.error) {
        cache.error = allResult.error;
      }
      cache.lastFetch = Date.now();
    } catch (err) {
      console.error('[useCompanyDepartments] Fetch error:', err);
      cache.error = err.message || 'Failed to fetch departments';
    } finally {
      cache.isLoading = false;
      notifyListeners();
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const createDepartment = useCallback(async (data, performedBy, performerName) => {
    try {
      const result = await window.electronAPI.companyDepts.create(data, performedBy, performerName);
      if (result?.success) {
        // Invalidate cache and refresh
        cache.lastFetch = null;
        await fetchDepartments(true);
        notifyDataChanged('departments');
      }
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchDepartments]);

  const updateDepartment = useCallback(async (id, updates, performedBy, performerName) => {
    try {
      const result = await window.electronAPI.companyDepts.update(id, updates, performedBy, performerName);
      if (result?.success) {
        // Invalidate cache and refresh
        cache.lastFetch = null;
        await fetchDepartments(true);
        notifyDataChanged('departments');
      }
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchDepartments]);

  const reactivateDepartment = useCallback(async (id, performedBy, performerName) => {
    try {
      const result = await window.electronAPI.companyDepts.reactivate(id, performedBy, performerName);
      if (result?.success) {
        cache.lastFetch = null;
        await fetchDepartments(true);
        notifyDataChanged('departments');
      }
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchDepartments]);

  const deleteDepartment = useCallback(async (id, performedBy, performerName) => {
    try {
      const result = await window.electronAPI.companyDepts.delete(id, performedBy, performerName);
      if (result?.success) {
        cache.lastFetch = null;
        await fetchDepartments(true);
        notifyDataChanged('departments');
      }
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchDepartments]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // Data
    departments: cache.departments || [],
    allDepartments: cache.allDepartments || [],

    // State
    isLoading: cache.isLoading,
    error: cache.error,

    // Actions
    refresh: () => fetchDepartments(true),
    createDepartment,
    updateDepartment,
    reactivateDepartment,
    deleteDepartment,

    // Helpers - convert to format expected by dropdowns
    departmentOptions: (cache.departments || []).map(d => ({
      value: d.id,
      label: d.name,
    })),
  };
}

export default useCompanyDepartments;
