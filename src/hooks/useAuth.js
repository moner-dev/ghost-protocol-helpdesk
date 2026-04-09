/**
 * GHOST PROTOCOL — useAuth Hook
 *
 * Authentication with session persistence via sessionStorage.
 * Session is automatically cleared when the app window closes.
 * DB-backed login in Electron, fallback in browser.
 */

import { create } from 'zustand';

const isElectron = typeof window !== 'undefined' && window.electronAPI?.auth;
const isElectronAudit = typeof window !== 'undefined' && window.electronAPI?.audit;

const SESSION_KEY = 'ghost_session';

// Restore session from sessionStorage
function loadSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const session = JSON.parse(stored);
      if (session.user && session.isAuthenticated) {
        return { isAuthenticated: true, user: session.user };
      }
    }
  } catch (e) {}
  return { isAuthenticated: false, user: null };
}

function saveSession(user) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ isAuthenticated: true, user }));
  } catch (e) {}
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {}
}

const restored = loadSession();

const useAuthStore = create((set) => ({
  isAuthenticated: restored.isAuthenticated,
  isLoading: false,
  error: null,
  user: restored.user,

  login: async (username, password) => {
    set({ isLoading: true, error: null });

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (isElectron) {
      const result = await window.electronAPI.auth.login(username, password);
      if (result.success) {
        saveSession(result.user);
        set({ isAuthenticated: true, isLoading: false, error: null, user: result.user });
        return true;
      } else {
        set({ isAuthenticated: false, isLoading: false, error: result.error, user: null });
        return false;
      }
    }

    // Browser fallback — DEV ONLY (stripped from production builds)
    if (import.meta.env.DEV) {
      const devCredentials = [
        { username: 'admin', password: 'ghost2026', role: 'admin', display_name: 'System Admin' },
        { username: 'moner', password: 'ghost2026', role: 'owner', display_name: 'Agent Moner' },
      ];
      const match = devCredentials.find(
        (c) => c.username === username && c.password === password
      );
      if (match) {
        const user = { id: `user-${match.username}`, username: match.username, role: match.role, display_name: match.display_name, account_status: 'approved' };
        saveSession(user);
        set({ isAuthenticated: true, isLoading: false, error: null, user });
        return true;
      }
    }

    // No valid credentials
    set({ isAuthenticated: false, isLoading: false, error: 'ACCESS DENIED — INVALID CREDENTIALS', user: null });
    return false;
  },

  register: async ({ username, password, email, display_name, department }) => {
    set({ isLoading: true, error: null });

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (isElectron) {
      const result = await window.electronAPI.auth.register({ username, password, email, display_name, department });
      set({ isLoading: false, error: result.success ? null : result.error });
      return result;
    }

    set({ isLoading: false, error: null });
    return { success: true, message: 'Account created. Awaiting admin approval.' };
  },

  logout: () => {
    // Log the logout event before clearing session
    const currentUser = useAuthStore.getState().user;
    if (isElectronAudit && currentUser) {
      window.electronAPI.audit.log({
        eventType: 'logout',
        targetType: 'user',
        targetId: currentUser.id,
        targetName: currentUser.display_name || currentUser.username,
        performedBy: currentUser.id,
        performerName: currentUser.display_name || currentUser.username,
      }).catch(() => {}); // Don't block logout on audit failure
    }
    clearSession();
    set({ isAuthenticated: false, isLoading: false, error: null, user: null });
  },

  clearError: () => {
    set({ error: null });
  },

  // Update user profile (after owner edits their own profile)
  updateUser: (updatedUser) => {
    if (!updatedUser) return;
    saveSession(updatedUser);
    set({ user: updatedUser });
  },
}));

export function useAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const clearError = useAuthStore((state) => state.clearError);
  const updateUser = useAuthStore((state) => state.updateUser);

  return { isAuthenticated, isLoading, error, user, login, register, logout, clearError, updateUser };
}

export default useAuth;
