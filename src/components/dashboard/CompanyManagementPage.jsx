/**
 * GHOST PROTOCOL — Company Management Page
 *
 * Admin page for managing company departments (the departments end users belong to).
 * Full CRUD operations with Ghost Protocol design system.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, Search, RefreshCw,
  Eye, Trash2, UserPlus,
  AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import { useCompanyDepartments } from '@/hooks/useCompanyDepartments';
import { useToast } from '@/hooks/useToast';
import { notifyDataChanged } from '@/hooks/useDataRefresh';
import AddDepartmentModal from './AddDepartmentModal';
import DepartmentModal from './DepartmentModal';

// ═══════════════════════════════════════════════════════════════════════════
// FILTER PILL (matches DateRangeFilter styling)
// ═══════════════════════════════════════════════════════════════════════════

function FilterPill({ label, isActive, onClick }) {
  return (
    <motion.button
      onClick={onClick}
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
        background: isActive ? DARK_THEME.navy : 'transparent',
        color: isActive ? '#FFFFFF' : DARK_THEME.textMuted,
        boxShadow: isActive ? `0 0 12px ${DARK_THEME.glow}` : 'none',
        ...(isActive ? {} : { border: `1px solid ${DARK_THEME.border}` }),
      }}
    >
      {label}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════

function StatusBadge({ isActive }) {
  const color = isActive ? DARK_THEME.success : DARK_THEME.textMuted;
  const label = isActive ? 'ACTIVE' : 'INACTIVE';

  return (
    <span style={{
      padding: '4px 10px',
      backgroundColor: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: '4px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '10px',
      letterSpacing: '0.05em',
      color,
    }}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// USER COUNT BADGE
// ═══════════════════════════════════════════════════════════════════════════

function UserCountBadge({ count }) {
  let color = DARK_THEME.success;
  if (count >= 11) color = DARK_THEME.danger;
  else if (count >= 1) color = DARK_THEME.warning;

  return (
    <span style={{
      padding: '4px 10px',
      backgroundColor: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: '4px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      fontWeight: 600,
      color,
      minWidth: '32px',
      textAlign: 'center',
      display: 'inline-block',
    }}>
      {count}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION BUTTON
// ═══════════════════════════════════════════════════════════════════════════

function ActionButton({ icon: Icon, onClick, color = DARK_THEME.textMuted, disabled, title }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      title={title}
      style={{
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isHovered && !disabled ? `${color}15` : 'transparent',
        border: `1px solid ${isHovered && !disabled ? color : 'transparent'}`,
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
      }}
    >
      <Icon size={16} style={{ color: isHovered && !disabled ? color : DARK_THEME.textMuted }} />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPANY MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════════════════

function CompanyManagementPage({ currentUser }) {
  const toast = useToast();
  const {
    departments,
    allDepartments,
    isLoading,
    refresh,
    createDepartment,
    updateDepartment,
    reactivateDepartment,
    deleteDepartment,
  } = useCompanyDepartments();

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteScenario, setDeleteScenario] = useState(null); // 'safe' | 'blocked' | 'reassign'
  const [isDeleting, setIsDeleting] = useState(false);
  const [reassignTargetId, setReassignTargetId] = useState('');

  // Filter & search state
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Listen for ghost:refresh event (triggered by R shortcut)
  useEffect(() => {
    const handleRefresh = () => refresh();
    window.addEventListener('ghost:refresh', handleRefresh);
    return () => window.removeEventListener('ghost:refresh', handleRefresh);
  }, [refresh]);

  // Check permissions
  const canWrite = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  // Get departments based on status filter
  const baseDepartments = statusFilter === 'all' ? allDepartments :
    statusFilter === 'active' ? departments :
    allDepartments.filter(d => !d.is_active);

  // Filter departments
  const filteredDepartments = useMemo(() => {
    return baseDepartments.filter(dept => {
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchesName = dept.name?.toLowerCase().includes(query);
        const matchesDesc = dept.description?.toLowerCase().includes(query);
        const matchesManager = dept.manager_name?.toLowerCase().includes(query);
        const matchesId = dept.id?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesManager && !matchesId) return false;
      }
      return true;
    });
  }, [baseDepartments, debouncedSearch]);

  // Pagination calculations
  const filteredCount = filteredDepartments.length;
  const totalPages = Math.ceil(filteredCount / pageSize);
  const paginatedDepartments = filteredDepartments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  // Stats
  const totalCount = allDepartments.length;
  const activeCount = departments.length;
  const inactiveCount = totalCount - activeCount;

  // Check if filters are active
  const hasActiveFilters = statusFilter !== 'all' || searchQuery !== '';

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
  };

  // Quick actions
  const handleReactivate = async (dept) => {
    const result = await reactivateDepartment(dept.id, currentUser.id, currentUser.display_name);
    if (result?.success) {
      toast.success(`${dept.name} reactivated`);
    } else {
      toast.error(result?.error || 'Failed to reactivate department');
    }
  };

  const handleDelete = async (dept) => {
    setReassignTargetId('');

    // Fetch fresh counts from backend
    let userCount = dept.end_user_count || 0;
    let incidentCount = 0;
    try {
      const detail = await window.electronAPI.companyDepts.getById(dept.id);
      if (detail?.success && detail.department) {
        userCount = detail.department.end_user_count || 0;
        incidentCount = detail.department.total_incident_count || 0;
      }
    } catch { /* use defaults from list data */ }

    if (userCount > 0) {
      setDeleteTarget({ ...dept, userCount });
      setDeleteScenario('blocked');
    } else if (incidentCount > 0) {
      setDeleteTarget({ ...dept, incidentCount });
      setDeleteScenario('reassign');
    } else {
      setDeleteTarget(dept);
      setDeleteScenario('safe');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteDepartment(deleteTarget.id, currentUser.id, currentUser.display_name);
      if (result?.success) {
        toast.success(`${deleteTarget.name} deleted`);
        notifyDataChanged('departments');
        closeDeleteDialog();
      } else if (result?.reason === 'HAS_USERS') {
        // Race condition: users appeared between check and delete
        setDeleteTarget({ ...deleteTarget, userCount: result.userCount });
        setDeleteScenario('blocked');
      } else if (result?.reason === 'HAS_INCIDENTS') {
        // Race condition: incidents appeared between check and delete
        setDeleteTarget({ ...deleteTarget, incidentCount: result.incidentCount });
        setDeleteScenario('reassign');
      } else {
        toast.error(result?.error || 'Failed to delete department');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReassignAndDelete = async () => {
    if (!deleteTarget || !reassignTargetId || isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await window.electronAPI.companyDepts.reassignAndDelete(
        deleteTarget.id, reassignTargetId, currentUser.id, currentUser.display_name
      );
      if (result?.success) {
        const targetDept = departments.find(d => d.id === reassignTargetId);
        toast.success(`"${deleteTarget.name}" deleted. ${result.reassignedCount} incident(s) reassigned to "${targetDept?.name || reassignTargetId}"`);
        notifyDataChanged('incidents');
        notifyDataChanged('departments');
        refresh();
        setDeleteTarget(null);
        setDeleteScenario(null);
        setReassignTargetId('');
      } else {
        toast.error(result?.error || 'Failed to reassign and delete');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteScenario(null);
    setReassignTargetId('');
  };

  // Create handler
  const handleCreate = async (data) => {
    const result = await createDepartment(data, currentUser.id, currentUser.display_name);
    if (result?.success) {
      toast.success(`${data.name} created`);
    } else {
      toast.error(result?.error || 'Failed to create department');
    }
    return result;
  };

  // Update handler
  const handleUpdate = async (id, updates) => {
    const result = await updateDepartment(id, updates, currentUser.id, currentUser.display_name);
    if (result?.success) {
      toast.success('Department updated');
      // Update selected department with new values
      setSelectedDepartment(prev => prev ? { ...prev, ...updates } : null);
    } else {
      toast.error(result?.error || 'Failed to update department');
    }
    return result;
  };

  // Open department modal
  const handleViewDepartment = (dept) => {
    setSelectedDepartment(dept);
    setIsDepartmentModalOpen(true);
  };

  // Close department modal
  const handleCloseDepartmentModal = () => {
    setIsDepartmentModalOpen(false);
    setSelectedDepartment(null);
  };

  return (
    <div style={{
      flex: 1,
      padding: '32px',
      overflowY: 'auto',
      backgroundColor: 'transparent',
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '30px', fontWeight: 700, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 6px 0' }}>
            COMPANY DEPARTMENTS
          </h1>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.textMuted }}>
            {filteredDepartments.length} OF {totalCount} DEPARTMENTS · {activeCount} ACTIVE · {inactiveCount} INACTIVE
          </span>
        </div>
        {canWrite && (
          <motion.button
            onClick={() => setIsAddModalOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '14px 24px',
              background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}40)`,
              border: `1px solid ${DARK_THEME.electric}`,
              borderRadius: '10px',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600,
              fontSize: '15px',
              letterSpacing: '0.1em',
              color: DARK_THEME.electric,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: `0 0 20px ${DARK_THEME.glow}`,
            }}
          >
            <Plus size={18} />
            NEW DEPARTMENT
          </motion.button>
        )}
      </div>

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
        <FilterPill label="ALL" isActive={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
        <FilterPill label="ACTIVE" isActive={statusFilter === 'active'} onClick={() => setStatusFilter('active')} />
        <FilterPill label="INACTIVE" isActive={statusFilter === 'inactive'} onClick={() => setStatusFilter('inactive')} />
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
            placeholder="Search by name, description, or manager..."
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

      {/* ── Data Table ── */}
      <div style={{
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {/* Accent bar */}
        <div style={{ height: '4px', background: `linear-gradient(90deg, ${DARK_THEME.electric} 0%, ${DARK_THEME.electric2} 50%, transparent 100%)` }} />

        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr 1fr 150px 80px 90px 120px',
          gap: '12px',
          padding: '16px 28px',
          backgroundColor: 'rgba(79, 195, 247, 0.04)',
          borderBottom: `1px solid ${DARK_THEME.border}`,
        }}>
          {['ID', 'NAME', 'DESCRIPTION', 'MANAGER', 'USERS', 'STATUS', 'ACTIONS'].map(header => (
            <span key={header} style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: DARK_THEME.textMuted,
            }}>
              {header}
            </span>
          ))}
        </div>

        {/* Table Body */}
        <div style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
          {/* Loading State */}
          {isLoading && (
            <div style={{ padding: '56px 28px', textAlign: 'center' }}>
              <RefreshCw size={32} style={{ color: DARK_THEME.electric, animation: 'spin 1s linear infinite' }} />
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, marginTop: '16px' }}>
                LOADING DEPARTMENTS...
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredDepartments.length === 0 && (
            <div style={{ padding: '56px 28px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: `${DARK_THEME.textMuted}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={24} style={{ color: DARK_THEME.textMuted }} />
              </div>
              <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '18px', color: DARK_THEME.text, margin: '0 0 6px 0' }}>NO DEPARTMENTS FOUND</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, margin: 0 }}>
                {hasActiveFilters ? 'Try adjusting your search or filter criteria' : 'Add your first department to get started'}
              </p>
            </div>
          )}

          {/* Table Rows */}
          {!isLoading && filteredDepartments.length > 0 && paginatedDepartments.map((dept, index) => (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.015 }}
              onClick={() => handleViewDepartment(dept)}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 1fr 150px 80px 90px 120px',
                gap: '12px',
                padding: '18px 28px',
                borderBottom: `1px solid ${DARK_THEME.gridLine}`,
                cursor: 'pointer',
                backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0)' : 'rgba(79, 195, 247, 0.02)',
                transition: 'background-color 0.15s',
              }}
              whileHover={{ backgroundColor: 'rgba(79, 195, 247, 0.06)' }}
            >
              {/* ID */}
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
                color: DARK_THEME.electric,
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {dept.id}
              </div>

              {/* Name */}
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: DARK_THEME.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {dept.name}
              </div>

              {/* Description */}
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px',
                color: DARK_THEME.textMuted,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {dept.description || '—'}
              </div>

              {/* Manager */}
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px',
                color: DARK_THEME.textMuted,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {dept.manager_name || '—'}
              </div>

              {/* User Count */}
              <div>
                <UserCountBadge count={dept.end_user_count || 0} />
              </div>

              {/* Status */}
              <div>
                <StatusBadge isActive={dept.is_active} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <ActionButton
                  icon={Eye}
                  onClick={() => handleViewDepartment(dept)}
                  color={DARK_THEME.electric}
                  title="View"
                />
                {canWrite && (
                  <>
                    {!dept.is_active && (
                      <ActionButton
                        icon={UserPlus}
                        onClick={() => handleReactivate(dept)}
                        color={DARK_THEME.success}
                        title="Reactivate"
                      />
                    )}
                    <ActionButton
                      icon={Trash2}
                      onClick={() => handleDelete(dept)}
                      color={DARK_THEME.danger}
                      disabled={dept.end_user_count > 0}
                      title={dept.end_user_count > 0 ? 'Cannot delete — has linked users' : 'Delete'}
                    />
                  </>
                )}
              </div>
            </motion.div>
          ))}
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

      {/* Keyframe animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Add Department Modal */}
      <AddDepartmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreate={handleCreate}
      />

      {/* Department View/Edit Modal */}
      <DepartmentModal
        isOpen={isDepartmentModalOpen}
        onClose={handleCloseDepartmentModal}
        department={selectedDepartment}
        onUpdate={handleUpdate}
        onReactivate={handleReactivate}
        canEdit={canWrite}
      />

      {/* Delete / Block / Reassign Dialog */}
      <AnimatePresence>
        {deleteTarget && deleteScenario && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDeleteDialog}
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(5, 10, 24, 0.85)',
                backdropFilter: 'blur(4px)',
                zIndex: 600,
              }}
            />
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 601,
              pointerEvents: 'none',
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '94%',
                  maxWidth: '480px',
                  backgroundColor: DARK_THEME.surface,
                  border: `1px solid ${deleteScenario === 'safe' ? DARK_THEME.danger : DARK_THEME.warning}40`,
                  borderRadius: '14px',
                  boxShadow: `0 0 60px ${deleteScenario === 'safe' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`,
                  pointerEvents: 'auto',
                  overflow: 'hidden',
                }}
              >
                <div style={{ height: '4px', backgroundColor: deleteScenario === 'safe' ? DARK_THEME.danger : DARK_THEME.warning }} />

                <div style={{ padding: '24px 28px', textAlign: 'center' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: `${deleteScenario === 'safe' ? DARK_THEME.danger : DARK_THEME.warning}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    {deleteScenario === 'safe' ? (
                      <Trash2 size={28} style={{ color: DARK_THEME.danger }} />
                    ) : (
                      <AlertTriangle size={28} style={{ color: DARK_THEME.warning }} />
                    )}
                  </div>

                  {/* Scenario A — Safe Delete */}
                  {deleteScenario === 'safe' && (
                    <>
                      <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '22px', fontWeight: 600, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 12px' }}>
                        DELETE DEPARTMENT
                      </h2>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.textMuted, margin: '0 0 16px' }}>
                        Are you sure you want to delete "{deleteTarget.name}"?
                      </p>
                      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: `1px solid ${DARK_THEME.danger}20`, borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.danger }}>
                          {deleteTarget.id}
                        </div>
                      </div>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.danger, margin: 0 }}>
                        This action cannot be undone.
                      </p>
                    </>
                  )}

                  {/* Scenario B — Blocked (has users) */}
                  {deleteScenario === 'blocked' && (
                    <>
                      <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '22px', fontWeight: 600, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 12px' }}>
                        CANNOT DELETE DEPARTMENT
                      </h2>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.textMuted, margin: '0 0 16px' }}>
                        "{deleteTarget.name}" has <span style={{ color: DARK_THEME.warning, fontWeight: 600 }}>{deleteTarget.userCount || deleteTarget.end_user_count || 0}</span> active user(s) assigned.
                      </p>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.textMuted, margin: 0 }}>
                        Reassign or deactivate all users before deleting this department.
                      </p>
                    </>
                  )}

                  {/* Scenario C — Reassign incidents */}
                  {deleteScenario === 'reassign' && (
                    <>
                      <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '22px', fontWeight: 600, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 12px' }}>
                        DEPARTMENT HAS INCIDENTS
                      </h2>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.textMuted, margin: '0 0 16px' }}>
                        "{deleteTarget.name}" has <span style={{ color: DARK_THEME.warning, fontWeight: 600 }}>{deleteTarget.incidentCount}</span> incident(s) linked to it.
                      </p>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.textMuted, margin: '0 0 16px' }}>
                        Select a department to reassign all incidents before deleting:
                      </p>
                      <select
                        value={reassignTargetId}
                        onChange={(e) => setReassignTargetId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          backgroundColor: DARK_THEME.bg,
                          border: `1px solid ${DARK_THEME.border}`,
                          borderRadius: '8px',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '12px',
                          color: DARK_THEME.text,
                          cursor: 'pointer',
                          outline: 'none',
                          marginBottom: '12px',
                          appearance: 'none',
                        }}
                      >
                        <option value="" style={{ color: DARK_THEME.textMuted }}>Select target department...</option>
                        {departments
                          .filter(d => d.id !== deleteTarget.id && d.is_active)
                          .map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))
                        }
                      </select>
                      {reassignTargetId && (
                        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, margin: 0 }}>
                          All {deleteTarget.incidentCount} incident(s) will be moved to the selected department.
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '20px 28px',
                  borderTop: `1px solid ${DARK_THEME.border}`,
                }}>
                  {/* Scenario B — only CLOSE */}
                  {deleteScenario === 'blocked' && (
                    <motion.button
                      onClick={closeDeleteDialog}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        padding: '12px 28px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${DARK_THEME.border}`,
                        borderRadius: '6px',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: 600,
                        fontSize: '14px',
                        letterSpacing: '0.1em',
                        color: DARK_THEME.textMuted,
                        cursor: 'pointer',
                      }}
                    >
                      CLOSE
                    </motion.button>
                  )}

                  {/* Scenario A — CANCEL + DELETE */}
                  {deleteScenario === 'safe' && (
                    <>
                      <motion.button
                        onClick={closeDeleteDialog}
                        disabled={isDeleting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          padding: '12px 28px',
                          backgroundColor: 'transparent',
                          border: `1px solid ${DARK_THEME.border}`,
                          borderRadius: '6px',
                          fontFamily: 'Rajdhani, sans-serif',
                          fontWeight: 600,
                          fontSize: '14px',
                          letterSpacing: '0.1em',
                          color: DARK_THEME.textMuted,
                          cursor: isDeleting ? 'not-allowed' : 'pointer',
                          opacity: isDeleting ? 0.5 : 1,
                        }}
                      >
                        CANCEL
                      </motion.button>
                      <motion.button
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                        whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                        whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                        style={{
                          padding: '12px 28px',
                          backgroundColor: DARK_THEME.danger,
                          border: `1px solid ${DARK_THEME.danger}`,
                          borderRadius: '6px',
                          fontFamily: 'Rajdhani, sans-serif',
                          fontWeight: 600,
                          fontSize: '14px',
                          letterSpacing: '0.1em',
                          color: '#fff',
                          cursor: isDeleting ? 'not-allowed' : 'pointer',
                          opacity: isDeleting ? 0.7 : 1,
                        }}
                      >
                        {isDeleting ? 'DELETING...' : 'DELETE'}
                      </motion.button>
                    </>
                  )}

                  {/* Scenario C — CANCEL + REASSIGN & DELETE */}
                  {deleteScenario === 'reassign' && (
                    <>
                      <motion.button
                        onClick={closeDeleteDialog}
                        disabled={isDeleting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          padding: '12px 28px',
                          backgroundColor: 'transparent',
                          border: `1px solid ${DARK_THEME.border}`,
                          borderRadius: '6px',
                          fontFamily: 'Rajdhani, sans-serif',
                          fontWeight: 600,
                          fontSize: '14px',
                          letterSpacing: '0.1em',
                          color: DARK_THEME.textMuted,
                          cursor: isDeleting ? 'not-allowed' : 'pointer',
                          opacity: isDeleting ? 0.5 : 1,
                        }}
                      >
                        CANCEL
                      </motion.button>
                      <motion.button
                        onClick={handleReassignAndDelete}
                        disabled={isDeleting || !reassignTargetId}
                        whileHover={{ scale: (isDeleting || !reassignTargetId) ? 1 : 1.02 }}
                        whileTap={{ scale: (isDeleting || !reassignTargetId) ? 1 : 0.98 }}
                        style={{
                          padding: '12px 28px',
                          backgroundColor: (!reassignTargetId || isDeleting) ? `${DARK_THEME.danger}40` : DARK_THEME.danger,
                          border: `1px solid ${DARK_THEME.danger}`,
                          borderRadius: '6px',
                          fontFamily: 'Rajdhani, sans-serif',
                          fontWeight: 600,
                          fontSize: '14px',
                          letterSpacing: '0.1em',
                          color: '#fff',
                          cursor: (isDeleting || !reassignTargetId) ? 'not-allowed' : 'pointer',
                          opacity: (isDeleting || !reassignTargetId) ? 0.7 : 1,
                        }}
                      >
                        {isDeleting ? 'REASSIGNING...' : 'REASSIGN & DELETE'}
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CompanyManagementPage;
