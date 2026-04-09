import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, UserX, Trash2, ChevronDown, Shield, Eye, EyeOff, AlertTriangle, AlertCircle, Crown, KeyRound, Loader2, Search, RefreshCw, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import DeleteUserDialog from './DeleteUserDialog';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

// ═══════════════════════════════════════════════════════════════════════════
// EDIT PROFILE DIALOG (with integrated password change)
// ═══════════════════════════════════════════════════════════════════════════

function EditProfileDialog({ isOpen, onClose, targetUser, currentUser, onSuccess, onUserUpdated }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isElectronProfile = typeof window !== 'undefined' && window.electronAPI?.profile?.update;
  const isSelf = targetUser?.id === currentUser?.id;

  // Initialize form when dialog opens or target user changes
  useEffect(() => {
    if (isOpen && targetUser) {
      setUsername(targetUser.username || '');
      setDisplayName(targetUser.display_name || '');
      setEmail(targetUser.email || '');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setError(null);
    }
  }, [isOpen, targetUser]);

  const handleSave = async () => {
    // Validation - Username (Agent ID)
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Agent ID cannot be empty');
      return;
    }
    if (trimmedUsername.length < 3) {
      setError('Agent ID must be at least 3 characters');
      return;
    }
    if (/\s/.test(trimmedUsername)) {
      setError('Agent ID cannot contain spaces');
      return;
    }

    // Validation - Display Name
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    // Validation - Password (if provided)
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (!/[A-Z]/.test(newPassword)) {
        setError('Password must contain at least one uppercase letter');
        return;
      }
      if (!/[a-z]/.test(newPassword)) {
        setError('Password must contain at least one lowercase letter');
        return;
      }
      if (!/[0-9]/.test(newPassword)) {
        setError('Password must contain at least one number');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isElectronProfile) {
        const updates = {
          username: trimmedUsername,
          display_name: displayName.trim(),
          email: email.trim() || null,
        };
        if (newPassword) {
          updates.password = newPassword;
        }

        const res = await window.electronAPI.profile.update(targetUser.id, updates, currentUser.id);

        if (res.success) {
          // If editing self, update the auth session
          if (isSelf && res.user) {
            onUserUpdated?.(res.user);
          }
          onSuccess?.('Profile updated successfully', res.user);
          onClose();
        } else {
          setError(res.error || 'Failed to update profile');
        }
      } else {
        setError('Profile update unavailable');
      }
    } catch (err) {
      console.error('[EditProfileDialog] Save error:', err);
      setError('Operation failed');
    }
    setIsLoading(false);
  };

  if (!isOpen || !targetUser) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '440px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', backgroundColor: DARK_THEME.surface,
          border: `1px solid ${DARK_THEME.border}`, borderRadius: '12px',
          boxShadow: `0 16px 64px rgba(0,0,0,0.5), 0 0 30px ${DARK_THEME.glow}`,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Edit3 size={24} style={{ color: DARK_THEME.gold, marginBottom: '12px' }} />
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 700, color: DARK_THEME.text }}>EDIT PROFILE</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, marginTop: '6px' }}>
            {isSelf ? 'Update your account information' : `Editing: ${targetUser.display_name}`}
          </div>
        </div>

        {/* Agent ID (Username) */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', color: DARK_THEME.textMuted, marginBottom: '8px' }}>AGENT ID</label>
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value.toLowerCase()); setError(null); }}
            placeholder="Enter agent ID..."
            style={{
              width: '100%', height: '44px', padding: '0 16px', boxSizing: 'border-box',
              backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '14px',
              color: DARK_THEME.text, outline: 'none',
            }}
          />
        </div>

        {/* Display Name */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', color: DARK_THEME.textMuted, marginBottom: '8px' }}>DISPLAY NAME</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setError(null); }}
            placeholder="Enter display name..."
            style={{
              width: '100%', height: '44px', padding: '0 16px', boxSizing: 'border-box',
              backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '6px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
              color: DARK_THEME.text, outline: 'none',
            }}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', color: DARK_THEME.textMuted, marginBottom: '8px' }}>EMAIL (OPTIONAL)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="Enter email address..."
            style={{
              width: '100%', height: '44px', padding: '0 16px', boxSizing: 'border-box',
              backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '6px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
              color: DARK_THEME.text, outline: 'none',
            }}
          />
        </div>

        {/* Password Change Section */}
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'rgba(79, 195, 247, 0.02)', border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', color: DARK_THEME.textMuted, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={12} /> CHANGE PASSWORD (OPTIONAL)
          </div>

          {/* New Password */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginBottom: '6px' }}>NEW PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                placeholder="Enter new password..."
                style={{
                  width: '100%', height: '40px', padding: '0 40px 0 14px', boxSizing: 'border-box',
                  backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.border}`,
                  borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px',
                  color: DARK_THEME.text, outline: 'none',
                }}
              />
              <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: DARK_THEME.textMuted }}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginBottom: '6px' }}>CONFIRM PASSWORD</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
              placeholder="Confirm new password..."
              style={{
                width: '100%', height: '40px', padding: '0 14px', boxSizing: 'border-box',
                backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.border}`,
                borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px',
                color: DARK_THEME.text, outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Validation Error */}
        {error && (
          <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: `${DARK_THEME.danger}10`, border: `1px solid ${DARK_THEME.danger}30`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.danger, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', background: 'none', border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, cursor: 'pointer',
          }}>CANCEL</button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={isLoading} style={{
            flex: 1, padding: '12px',
            background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.gold}30)`,
            border: `1px solid ${DARK_THEME.gold}`, borderRadius: '6px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em',
            color: DARK_THEME.gold, cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            {isLoading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> SAVING...</> : 'SAVE CHANGES'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ELECTRON CHECK — No mock data fallback
// ═══════════════════════════════════════════════════════════════════════════

const isElectron = typeof window !== 'undefined' && window.electronAPI?.admin;

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StatBadge({ label, value, color, icon: Icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 22px',
      backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '10px',
      position: 'relative', overflow: 'hidden', flex: 1,
    }}>
      <div style={{ height: '100%', width: '3px', backgroundColor: color, position: 'absolute', left: 0, top: 0, bottom: 0 }} />
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '28px', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, marginTop: '2px' }}>{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    pending: { color: DARK_THEME.gold, label: 'PENDING' },
    approved: { color: DARK_THEME.success, label: 'APPROVED' },
    rejected: { color: DARK_THEME.danger, label: 'REJECTED' },
    suspended: { color: DARK_THEME.textMuted, label: 'SUSPENDED' },
  };
  const c = config[status] || config.pending;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: c.color, boxShadow: `0 0 6px ${c.color}` }} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.05em', color: c.color, padding: '4px 10px', backgroundColor: `${c.color}12`, border: `1px solid ${c.color}30`, borderRadius: '5px' }}>
        {c.label}
      </span>
    </div>
  );
}

function RoleBadge({ role }) {
  if (role === 'owner') {
    return (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.05em', color: DARK_THEME.gold, padding: '4px 10px', backgroundColor: `${DARK_THEME.gold}12`, border: `1px solid ${DARK_THEME.gold}30`, borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        <Crown size={12} /> OWNER
      </span>
    );
  }
  const config = {
    admin: { color: DARK_THEME.danger, label: 'ADMIN' },
    operator: { color: DARK_THEME.electric, label: 'OPERATOR' },
    viewer: { color: DARK_THEME.textMuted, label: 'VIEWER' },
  };
  const c = config[role] || config.viewer;
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.05em', color: c.color, padding: '4px 10px', backgroundColor: `${c.color}12`, border: `1px solid ${c.color}30`, borderRadius: '5px' }}>
      {c.label}
    </span>
  );
}

function ActionButton({ icon: Icon, color, label, onClick, disabled = false }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      title={label}
      style={{
        width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'transparent', border: `1px solid ${color}30`, borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, transition: 'all 0.15s',
      }}
    >
      <Icon size={15} style={{ color }} />
    </motion.button>
  );
}

function RoleDropdown({ currentRole, userId, onChangeRole, openDropdownId, setOpenDropdownId }) {
  const open = openDropdownId === userId;
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const roles = ['viewer', 'operator', 'admin'];
  const colors = { admin: DARK_THEME.danger, operator: DARK_THEME.electric, viewer: DARK_THEME.textMuted, owner: DARK_THEME.gold };

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpenDropdownId(open ? null : userId);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
          backgroundColor: `${colors[currentRole]}12`, border: `1px solid ${colors[currentRole]}30`, borderRadius: '5px',
          fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: colors[currentRole], cursor: 'pointer',
        }}
      >
        {currentRole.toUpperCase()} <ChevronDown size={12} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999,
              backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px',
              padding: '6px', minWidth: '130px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => { onChangeRole(userId, role); setOpenDropdownId(null); }}
                style={{
                  display: 'block', width: '100%', padding: '8px 12px', backgroundColor: role === currentRole ? `${colors[role]}15` : 'transparent',
                  border: 'none', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
                  color: colors[role], cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${colors[role]}15`)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = role === currentRole ? `${colors[role]}15` : 'transparent')}
              >
                {role.toUpperCase()}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ADMIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

function AdminPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dbError, setDbError] = useState(null);
  const toast = useToast();
  const { updateUser } = useAuth();
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editProfileTarget, setEditProfileTarget] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const searchTimeoutRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Dynamic departments for filter
  const [departments, setDepartments] = useState([]);

  // Debounced search (200ms)
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery]);

  const isCurrentOwner = currentUser?.role === 'owner';
  const isCurrentAdmin = currentUser?.role === 'admin' || isCurrentOwner;

  const fetchUsers = useCallback(async () => {
    setDbError(null);
    try {
      if (isElectron) {
        const data = await window.electronAPI.admin.getUsers();
        setUsers(data);
      } else {
        // No mock fallback — requires Electron runtime
        setUsers([]);
        setDbError('Database unavailable — run with Electron');
      }
    } catch (err) {
      setUsers([]);
      setDbError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Listen for ghost:refresh event (triggered by R shortcut)
  useEffect(() => {
    const handleRefresh = () => fetchUsers();
    window.addEventListener('ghost:refresh', handleRefresh);
    return () => window.removeEventListener('ghost:refresh', handleRefresh);
  }, [fetchUsers]);

  // Load departments for filter
  useEffect(() => {
    const loadDepartments = async () => {
      if (typeof window !== 'undefined' && window.electronAPI?.departments?.getAll) {
        try {
          const depts = await window.electronAPI.departments.getAll();
          setDepartments(depts || []);
        } catch (err) {
          console.error('[AdminPage] Failed to load departments:', err);
        }
      }
    };
    loadDepartments();
  }, []);

  const handleStatusChange = async (userId, status) => {
    if (!isElectron) {
      toast.error('Database unavailable');
      return;
    }
    const res = await window.electronAPI.admin.updateUserStatus(userId, status, currentUser?.id, currentUser?.display_name);
    if (res.success) { fetchUsers(); toast.success(`User ${status}`); }
  };

  const handleRoleChange = async (userId, role) => {
    if (!isElectron) {
      toast.error('Database unavailable');
      return;
    }
    const res = await window.electronAPI.admin.updateUserRole(userId, role, currentUser?.id, currentUser?.display_name);
    if (res.success) { fetchUsers(); toast.success(`Role updated to ${role}`); }
  };

  const handleDelete = (userId) => {
    if (userId === currentUser?.id) return;
    const target = users.find((u) => u.id === userId);
    if (target) setDeleteTarget(target);
  };

  const handleDeleteComplete = (outcome, name) => {
    setDeleteTarget(null);
    fetchUsers();
    if (outcome === 'deleted') {
      toast.success(`${name} deleted`);
    } else if (outcome === 'deactivated') {
      toast.success(`${name} deactivated`);
    } else {
      toast.error(`Error: ${name}`);
    }
  };

  const pendingUsers = users.filter((u) => u.account_status === 'pending');

  // Filter option definitions
  const roleOptions = [
    { id: 'all', label: 'ALL' },
    { id: 'owner', label: 'OWNER' },
    { id: 'admin', label: 'ADMIN' },
    { id: 'operator', label: 'OPERATOR' },
    { id: 'viewer', label: 'VIEWER' },
  ];

  // Dynamic department options from database
  const departmentOptions = useMemo(() => {
    const options = [{ id: 'all', label: 'ALL' }];
    departments.forEach((dept) => {
      options.push({
        id: dept.id || dept.name,
        label: (dept.display_name || dept.name || '').toUpperCase(),
      });
    });
    return options;
  }, [departments]);

  const statusOptions = [
    { id: 'all', label: 'ALL' },
    { id: 'pending', label: 'PENDING' },
    { id: 'approved', label: 'APPROVED' },
    { id: 'suspended', label: 'SUSPENDED' },
    { id: 'rejected', label: 'REJECTED' },
  ];

  // Combined AND filter logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter (name, username, email)
      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase();
        const matchesSearch =
          (user.display_name?.toLowerCase().includes(search)) ||
          (user.username?.toLowerCase().includes(search)) ||
          (user.email?.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Role filter
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;

      // Department filter
      if (departmentFilter !== 'all' && user.department !== departmentFilter) return false;

      // Status filter
      if (filter !== 'all' && user.account_status !== filter) return false;

      return true;
    });
  }, [users, debouncedSearch, roleFilter, departmentFilter, filter]);

  // Pagination calculations
  const filteredCount = filteredUsers.length;
  const totalPages = Math.ceil(filteredCount / pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, roleFilter, departmentFilter, filter]);

  // Check if any filter is active
  const hasActiveFilters = searchQuery || roleFilter !== 'all' || departmentFilter !== 'all' || filter !== 'all';

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setRoleFilter('all');
    setDepartmentFilter('all');
    setFilter('all');
  };

  const totalCount = users.length;
  const approvedCount = users.filter((u) => u.account_status === 'approved').length;
  const pendingCount = pendingUsers.length;
  const suspendedCount = users.filter((u) => u.account_status === 'suspended' || u.account_status === 'rejected').length;

  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: 'transparent' }}>
      {/* Database Error Banner */}
      {dbError && (
        <div style={{
          padding: '16px 20px', marginBottom: '24px',
          backgroundColor: `${DARK_THEME.danger}10`,
          border: `1px solid ${DARK_THEME.danger}30`,
          borderLeft: `4px solid ${DARK_THEME.danger}`,
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <AlertCircle size={20} style={{ color: DARK_THEME.danger }} />
          <div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '16px', fontWeight: 600, color: DARK_THEME.danger }}>
              DATABASE UNAVAILABLE
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted }}>
              {dbError}. Start the app with <code style={{ backgroundColor: DARK_THEME.surface, padding: '2px 6px', borderRadius: '4px' }}>npm run electron:dev</code>
            </div>
          </div>
        </div>
      )}

      {/* Header with inline stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '30px', fontWeight: 700, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 6px 0' }}>
            USER ADMINISTRATION
          </h1>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.textMuted }}>
            {hasActiveFilters ? (
              <>SHOWING <span style={{ color: DARK_THEME.electric }}>{filteredUsers.length}</span> OF {totalCount} AGENTS</>
            ) : (
              'MANAGE AGENT ACCESS & ROLE ASSIGNMENTS'
            )}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {[
            { label: 'TOTAL', value: totalCount, color: DARK_THEME.electric },
            { label: 'APPROVED', value: approvedCount, color: DARK_THEME.success },
            { label: 'PENDING', value: pendingCount, color: DARK_THEME.gold },
            { label: 'INACTIVE', value: suspendedCount, color: DARK_THEME.danger },
          ].map((s) => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
              backgroundColor: `${s.color}10`, border: `1px solid ${s.color}25`, borderRadius: '8px',
            }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: 700, color: s.color }}>{s.value}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.05em', color: DARK_THEME.textMuted }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Approval Banner */}
      <AnimatePresence>
        {pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: '24px' }}
          >
            <div style={{
              padding: '20px 24px',
              backgroundColor: `${DARK_THEME.gold}08`,
              border: `1px solid ${DARK_THEME.gold}30`,
              borderLeft: `4px solid ${DARK_THEME.gold}`,
              borderRadius: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={18} style={{ color: DARK_THEME.gold }} />
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '18px', fontWeight: 600, color: DARK_THEME.gold }}>
                    {pendingCount} PENDING REGISTRATION{pendingCount > 1 ? 'S' : ''}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pendingUsers.map((user) => (
                  <div key={user.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: `${DARK_THEME.gold}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={18} style={{ color: DARK_THEME.gold }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 500, color: DARK_THEME.text }}>{user.display_name}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>
                          @{user.username}{user.email ? ` · ${user.email}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <motion.button
                        onClick={() => handleStatusChange(user.id, 'approved')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          padding: '8px 18px', backgroundColor: `${DARK_THEME.success}15`, border: `1px solid ${DARK_THEME.success}40`, borderRadius: '6px',
                          fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.success, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                      >
                        <UserCheck size={14} /> APPROVE
                      </motion.button>
                      <motion.button
                        onClick={() => handleStatusChange(user.id, 'rejected')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          padding: '8px 18px', backgroundColor: `${DARK_THEME.danger}15`, border: `1px solid ${DARK_THEME.danger}40`, borderRadius: '6px',
                          fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                      >
                        <UserX size={14} /> REJECT
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filter Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '16px 20px',
        background: `linear-gradient(135deg, ${DARK_THEME.surface} 0%, rgba(27, 42, 107, 0.15) 100%)`,
        borderRadius: '8px',
        border: `1px solid ${DARK_THEME.border}`,
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        {/* ROLE Filter Group */}
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginRight: '4px' }}>
          ROLE:
        </span>
        {roleOptions.map((opt) => (
          <motion.button
            key={opt.id}
            onClick={() => setRoleFilter(opt.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '8px 14px',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 500,
              letterSpacing: '0.05em',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              background: roleFilter === opt.id ? DARK_THEME.navy : 'transparent',
              color: roleFilter === opt.id ? '#FFFFFF' : DARK_THEME.textMuted,
              boxShadow: roleFilter === opt.id ? `0 0 12px ${DARK_THEME.glow}` : 'none',
              ...(roleFilter === opt.id ? {} : { border: `1px solid ${DARK_THEME.border}` }),
            }}
          >
            {opt.label}
          </motion.button>
        ))}

        {/* Separator */}
        <div style={{ width: '1px', height: '24px', backgroundColor: DARK_THEME.border, margin: '0 8px' }} />

        {/* DEPARTMENT Filter Group */}
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginRight: '4px' }}>
          DEPT:
        </span>
        {departmentOptions.map((opt) => (
          <motion.button
            key={opt.id}
            onClick={() => setDepartmentFilter(opt.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '8px 14px',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 500,
              letterSpacing: '0.05em',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              background: departmentFilter === opt.id ? DARK_THEME.navy : 'transparent',
              color: departmentFilter === opt.id ? '#FFFFFF' : DARK_THEME.textMuted,
              boxShadow: departmentFilter === opt.id ? `0 0 12px ${DARK_THEME.glow}` : 'none',
              ...(departmentFilter === opt.id ? {} : { border: `1px solid ${DARK_THEME.border}` }),
            }}
          >
            {opt.label}
          </motion.button>
        ))}

        {/* Separator */}
        <div style={{ width: '1px', height: '24px', backgroundColor: DARK_THEME.border, margin: '0 8px' }} />

        {/* STATUS Filter Group */}
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginRight: '4px' }}>
          STATUS:
        </span>
        {statusOptions.map((opt) => (
          <motion.button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '8px 14px',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 500,
              letterSpacing: '0.05em',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              background: filter === opt.id ? DARK_THEME.navy : 'transparent',
              color: filter === opt.id ? '#FFFFFF' : DARK_THEME.textMuted,
              boxShadow: filter === opt.id ? `0 0 12px ${DARK_THEME.glow}` : 'none',
              ...(filter === opt.id ? {} : { border: `1px solid ${DARK_THEME.border}` }),
            }}
          >
            {opt.label}
          </motion.button>
        ))}
      </div>

      {/* ── Search Bar ── */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        padding: '16px 20px',
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '10px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: DARK_THEME.textMuted }} />
          <input
            data-search-input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents by name, username, or email..."
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              backgroundColor: 'rgba(79, 195, 247, 0.04)',
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '8px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '15px',
              color: DARK_THEME.text,
              outline: 'none',
            }}
          />
        </div>

        {hasActiveFilters && (
          <motion.button
            onClick={handleResetFilters}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '12px 18px',
              backgroundColor: 'transparent',
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '8px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              color: DARK_THEME.textMuted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={14} />
            RESET
          </motion.button>
        )}
      </div>

      {/* Users Table */}
      <div style={{ backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ height: '4px', background: `linear-gradient(90deg, ${DARK_THEME.electric} 0%, ${DARK_THEME.electric2} 50%, transparent 100%)` }} />

        {/* Table Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 240px 120px 120px 110px 120px',
          gap: '12px', padding: '16px 28px', backgroundColor: 'rgba(79, 195, 247, 0.04)', borderBottom: `1px solid ${DARK_THEME.border}`,
        }}>
          {['AGENT', 'EMAIL', 'DEPARTMENT', 'ROLE', 'STATUS', 'ACTIONS'].map((h) => (
            <span key={h} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, textAlign: h === 'ACTIONS' ? 'center' : 'left' }}>
              {h}
            </span>
          ))}
        </div>

        {/* Table Body */}
        <div style={{ maxHeight: 'calc(100vh - 540px)', overflowY: 'auto' }}>
          {filteredUsers.length === 0 ? (
            <div style={{ padding: '56px', textAlign: 'center' }}>
              <UserX size={40} style={{ color: DARK_THEME.textMuted, marginBottom: '16px' }} />
              <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '18px', fontWeight: 600, color: DARK_THEME.text, margin: '0 0 6px' }}>NO AGENTS FOUND</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, margin: '0 0 20px' }}>
                {hasActiveFilters ? 'No agents match the current search and filter criteria' : 'No users in the system'}
              </p>
              {hasActiveFilters && (
                <motion.button
                  onClick={handleResetFilters}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                    backgroundColor: `${DARK_THEME.electric}15`, border: `1px solid ${DARK_THEME.electric}40`, borderRadius: '8px',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.1em',
                    color: DARK_THEME.electric, cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={14} /> CLEAR FILTERS
                </motion.button>
              )}
            </div>
          ) : (
            paginatedUsers.map((user, index) => {
              const isSelf = user.id === currentUser?.id;
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 240px 120px 120px 110px 120px',
                    gap: '12px', padding: '16px 28px', alignItems: 'center',
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(79, 195, 247, 0.02)',
                    borderBottom: `1px solid ${DARK_THEME.gridLine}`,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'rgba(79, 195, 247, 0.02)')}
                >
                  {/* Agent */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: user.role === 'owner' ? `${DARK_THEME.gold}15` : user.role === 'admin' ? `${DARK_THEME.danger}15` : `${DARK_THEME.electric}10`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {user.role === 'owner'
                        ? <Crown size={16} style={{ color: DARK_THEME.gold }} />
                        : <Shield size={16} style={{ color: user.role === 'admin' ? DARK_THEME.danger : DARK_THEME.electric }} />
                      }
                    </div>
                    <div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600, color: DARK_THEME.text }}>
                        {user.display_name}{isSelf ? ' (you)' : ''}
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted }}>@{user.username}</div>
                    </div>
                  </div>

                  {/* Email */}
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email || '—'}
                  </span>

                  {/* Department */}
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted }}>
                    {user.department ? user.department.toUpperCase().replace('-', ' ') : '—'}
                  </span>

                  {/* Role — Only OWNER can change admin roles; ADMIN can only change operator/viewer */}
                  {(isSelf || user.role === 'owner' || (!isCurrentOwner && user.role === 'admin')) ? (
                    <RoleBadge role={user.role} />
                  ) : (
                    <RoleDropdown currentRole={user.role} userId={user.id} onChangeRole={handleRoleChange} openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} />
                  )}

                  {/* Status */}
                  <StatusBadge status={user.account_status} />

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    {/* Edit Profile — Role-based permissions:
                        OWNER: can edit anyone
                        ADMIN: can edit self + operator/viewer (not other admins or owner)
                        OPERATOR/VIEWER: cannot edit anyone */}
                    {(() => {
                      const canEdit = isCurrentOwner || (isCurrentAdmin && (isSelf || (user.role !== 'owner' && user.role !== 'admin')));
                      return canEdit && (
                        <ActionButton icon={Edit3} color={DARK_THEME.gold} label="Edit Profile" onClick={() => setEditProfileTarget(user)} />
                      );
                    })()}
                    {user.role !== 'owner' && user.account_status === 'approved' && !isSelf && (
                      <ActionButton icon={UserX} color={DARK_THEME.warning} label="Suspend" onClick={() => handleStatusChange(user.id, 'suspended')} />
                    )}
                    {user.role !== 'owner' && (user.account_status === 'suspended' || user.account_status === 'rejected') && (
                      <ActionButton icon={UserCheck} color={DARK_THEME.success} label="Approve" onClick={() => handleStatusChange(user.id, 'approved')} />
                    )}
                    {user.role !== 'owner' && user.account_status === 'pending' && (
                      <>
                        <ActionButton icon={UserCheck} color={DARK_THEME.success} label="Approve" onClick={() => handleStatusChange(user.id, 'approved')} />
                        <ActionButton icon={UserX} color={DARK_THEME.danger} label="Reject" onClick={() => handleStatusChange(user.id, 'rejected')} />
                      </>
                    )}
                    {!isSelf && user.role !== 'owner' && (
                      (isCurrentOwner || (isCurrentAdmin && user.role !== 'admin'))
                    ) && (
                      <ActionButton icon={Trash2} color={DARK_THEME.danger} label="Delete" onClick={() => handleDelete(user.id)} />
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: `1px solid ${DARK_THEME.border}`, backgroundColor: 'rgba(79, 195, 247, 0.02)', flexShrink: 0 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>
              Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredCount)} of {filteredCount}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <motion.button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }} whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }}>
                <ChevronLeft size={16} style={{ color: DARK_THEME.textMuted }} />
              </motion.button>
              <div style={{ padding: '8px 16px', backgroundColor: DARK_THEME.navy, border: `1px solid ${DARK_THEME.electric}`, borderRadius: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.electric }}>{currentPage} / {totalPages}</div>
              <motion.button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }} whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1 }}>
                <ChevronRight size={16} style={{ color: DARK_THEME.textMuted }} />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Delete User Dialog */}
      <DeleteUserDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        user={deleteTarget}
        currentUser={currentUser}
        users={users}
        onComplete={handleDeleteComplete}
      />

      {/* Edit Profile Dialog (with integrated password change) */}
      <AnimatePresence>
        <EditProfileDialog
          isOpen={!!editProfileTarget}
          onClose={() => setEditProfileTarget(null)}
          targetUser={editProfileTarget}
          currentUser={currentUser}
          onSuccess={(msg) => { fetchUsers(); toast.success(msg); }}
          onUserUpdated={updateUser}
        />
      </AnimatePresence>

    </div>
  );
}

export default AdminPage;
