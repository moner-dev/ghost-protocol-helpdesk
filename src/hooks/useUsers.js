/**
 * GHOST PROTOCOL — useUsers Hook
 *
 * Fetches user and department data from the database.
 * Requires Electron runtime — no mock data fallback.
 */

import { useState, useEffect, useCallback } from 'react';

const isElectron = typeof window !== 'undefined' && window.electronAPI?.users;

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isElectron) {
        const [usersRes, deptsRes] = await Promise.all([
          window.electronAPI.users.getAll(),
          window.electronAPI.departments.getAll(),
        ]);
        setUsers(usersRes);
        setDepartments(deptsRes);
      } else {
        // No mock fallback — requires Electron runtime
        setUsers([]);
        setDepartments([]);
        setError('Database unavailable — run with Electron');
      }
    } catch (err) {
      console.error('Users fetch failed:', err);
      setUsers([]);
      setDepartments([]);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    departments,
    isLoading,
    error,
    refresh: fetchUsers,
  };
}

export default useUsers;
