import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Building2, UserPlus, ArrowUpCircle, CheckCircle, XCircle, FileText, History, MessageSquare, CircleDot, User, UserRound, Send, AlertTriangle, Lock, Paperclip, Timer, Layers, Tag, Wrench, Image, Eye, Download, File } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import { STATUS_OPTIONS } from '@/constants/options';
import { formatSmartTimestamp } from '@/utils/formatters';
import { useCompanyDepartments } from '@/hooks/useCompanyDepartments';

// ═══════════════════════════════════════════════════════════════════════════
// INCIDENT TYPE OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

const INCIDENT_TYPE_OPTIONS = [
  { value: 'hardware', label: 'HARDWARE' },
  { value: 'software', label: 'SOFTWARE' },
  { value: 'network', label: 'NETWORK' },
  { value: 'access', label: 'ACCESS' },
  { value: 'other', label: 'OTHER' },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function formatElapsedTime(timestamp) {
  const elapsed = Date.now() - timestamp;
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

const isElectron = typeof window !== 'undefined' && window.electronAPI?.incidents?.getComments;
const isElectronUsers = typeof window !== 'undefined' && window.electronAPI?.users;

// ═══════════════════════════════════════════════════════════════════════════
// RESOLUTION TYPES
// ═══════════════════════════════════════════════════════════════════════════

const RESOLUTION_TYPES = [
  { value: 'fixed', label: 'FIXED', color: DARK_THEME.success },
  { value: 'workaround', label: 'WORKAROUND', color: DARK_THEME.gold },
  { value: 'known_issue', label: 'KNOWN ISSUE', color: DARK_THEME.warning },
  { value: 'no_action', label: 'NO ACTION', color: DARK_THEME.textMuted },
  { value: 'duplicate', label: 'DUPLICATE', color: DARK_THEME.danger },
  { value: 'partially_resolved', label: 'PARTIAL FIX', color: DARK_THEME.electric },
];

function IncidentDetailModal({ isOpen, onClose, incident, onUpdate, currentUser }) {
  // Company departments from database
  const { allDepartments } = useCompanyDepartments();

  // Role checks
  const userRole = currentUser?.role || 'viewer';
  const isViewer = userRole === 'viewer';
  const canAct = userRole === 'operator' || userRole === 'admin' || userRole === 'owner';

  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [comments, setComments] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Attachments state (lazy loaded)
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoaded, setAttachmentsLoaded] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Resolution enforcement state
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null); // 'resolved' or 'closed'
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionDescription, setResolutionDescription] = useState('');
  const [partialDetails, setPartialDetails] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [duplicateId, setDuplicateId] = useState('');
  const [saving, setSaving] = useState(false);
  const [resolutionError, setResolutionError] = useState('');

  // Resolution validation
  const resolutionMinChars = 5;
  const resolutionCharCount = resolutionDescription.length;
  const isResolutionValid = resolutionType && resolutionCharCount >= resolutionMinChars;

  // Fetch team members for assignment dropdown — refetch each time dropdown opens
  useEffect(() => {
    if (showAssignDropdown && isElectronUsers) {
      window.electronAPI.users.getAll().then((users) => {
        // Filter to approved users who can be assigned tickets
        const assignable = users
          .filter((u) => u.account_status === 'approved')
          .map((u) => ({ id: u.id, name: u.display_name || u.username, role: u.role }));
        setTeamMembers(assignable);
      }).catch(() => setTeamMembers([]));
    }
  }, [showAssignDropdown]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showResolutionForm) {
          handleCancelResolution();
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, showResolutionForm]);

  // Load comments and history when incident changes
  useEffect(() => {
    if (!incident) return;

    // Load comments
    if (isElectron) {
      window.electronAPI.incidents.getComments(incident.id).then((dbComments) => {
        const system = [{ id: 0, author_name: 'System', text: 'Incident created', created_at: incident.created_at, type: 'system' }];
        const mapped = dbComments.map((c) => ({ id: c.id, author_name: c.author_name, text: c.text, created_at: c.created_at, type: 'user' }));
        setComments([...system, ...mapped]);
      }).catch(() => setComments([{ id: 0, author_name: 'System', text: 'Incident created', created_at: incident.created_at, type: 'system' }]));
      // Load history
      window.electronAPI.incidents.getHistory(incident.id).then((history) => {
        setStatusHistory(history.map((h) => ({ status: h.new_value || h.action, timestamp: h.performed_at, by: h.performer_name || h.performed_by })));
      }).catch(() => setStatusHistory([]));
    } else {
      setComments([{ id: 0, author_name: 'System', text: 'Incident created', created_at: incident.created_at, type: 'system' }]);
      setStatusHistory([{ status: incident.status || 'new', timestamp: incident.created_at, by: 'System' }]);
    }

    // Reset resolution form when incident changes
    setShowResolutionForm(false);
    setPendingStatus(null);
    setResolutionType('');
    setResolutionDescription('');
    setPartialDetails('');
    setFollowUpDate('');
    setDuplicateId('');

    // Reset attachments state when incident changes
    setAttachments([]);
    setAttachmentsLoaded(false);
  }, [incident?.id]);

  // Lazy load attachments when tab is clicked
  useEffect(() => {
    if (activeTab === 'attachments' && !attachmentsLoaded && incident?.id) {
      const loadAttachments = async () => {
        try {
          const attachmentsList = await window.electronAPI?.attachments?.getByIncidentId(incident.id);
          if (attachmentsList && attachmentsList.length > 0) {
            const fullAttachments = await Promise.all(
              attachmentsList.map(async (att) => {
                const fullData = await window.electronAPI?.attachments?.getData(att.id);
                if (!fullData) return null;
                const isImage = fullData.mime_type?.startsWith('image/');
                return {
                  id: att.id,
                  name: fullData.filename,
                  type: fullData.mime_type,
                  size: fullData.size,
                  dataUrl: fullData.data_url,
                  isImage,
                };
              })
            );
            setAttachments(fullAttachments.filter(Boolean));
          }
        } catch (err) {
          console.error('Failed to load attachments:', err);
        }
        setAttachmentsLoaded(true);
      };
      loadAttachments();
    }
  }, [activeTab, attachmentsLoaded, incident?.id]);

  if (!incident) return null;

  const priorityColors = {
    critical: DARK_THEME.danger,
    high: DARK_THEME.warning,
    medium: DARK_THEME.electric,
    low: DARK_THEME.textMuted,
  };

  const getStatusInfo = (status) => {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  };

  // Handle status change - for non-resolution statuses
  const handleStatusChange = (newStatus) => {
    const now = Date.now();
    const byName = currentUser?.display_name || currentUser?.username || 'Agent';
    setStatusHistory((prev) => [...prev, { status: newStatus, timestamp: now, by: byName }]);
    onUpdate?.({ ...incident, status: newStatus, performed_by: currentUser?.id });
  };

  // Handle resolve/close click - show resolution form
  const handleResolveOrCloseClick = (status) => {
    setPendingStatus(status);
    setShowResolutionForm(true);
    setResolutionType('');
    setResolutionDescription('');
    setPartialDetails('');
    setFollowUpDate('');
    setDuplicateId('');
  };

  // Cancel resolution form
  const handleCancelResolution = () => {
    setShowResolutionForm(false);
    setPendingStatus(null);
    setResolutionType('');
    setResolutionDescription('');
    setPartialDetails('');
    setFollowUpDate('');
    setDuplicateId('');
    setResolutionError('');
  };

  // Confirm resolution and update status
  const handleConfirmResolution = async () => {
    if (!isResolutionValid || !pendingStatus) return;

    setSaving(true);
    setResolutionError('');
    try {
      const now = Date.now();
      const byName = currentUser?.display_name || currentUser?.username || 'Agent';

      const updates = {
        ...incident,
        status: pendingStatus,
        resolution_type: resolutionType,
        resolution_description: resolutionDescription,
        performed_by: currentUser?.id,
      };

      // Add conditional fields
      if (resolutionType === 'partially_resolved') {
        updates.partial_details = partialDetails;
        updates.follow_up_date = followUpDate || null;
      }
      if (resolutionType === 'duplicate') {
        updates.duplicate_of = duplicateId || null;
      }

      const result = await onUpdate?.(updates);

      // Check for backend validation errors
      if (result && !result.success) {
        setResolutionError(result.error || 'Failed to update incident');
        return;
      }

      // Update local state on success
      setStatusHistory((prev) => [...prev, { status: pendingStatus, timestamp: now, by: byName }]);

      // Reset form after successful save
      setShowResolutionForm(false);
      setPendingStatus(null);
      setResolutionType('');
      setResolutionDescription('');
      setPartialDetails('');
      setFollowUpDate('');
      setDuplicateId('');
    } catch (err) {
      setResolutionError(err.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = (member) => {
    setShowAssignDropdown(false);
    setComments((prev) => [
      ...prev,
      { id: Date.now(), author: 'System', text: `Assigned to ${member.name}`, timestamp: Date.now(), type: 'system' },
    ]);
    onUpdate?.({ ...incident, assigned_to: member.id, performed_by: currentUser?.id });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const authorName = currentUser?.display_name || currentUser?.username || 'Agent';
    const authorId = currentUser?.id || 'user-unknown';

    if (isElectron) {
      const saved = await window.electronAPI.incidents.addComment(incident.id, authorId, authorName, newComment);
      if (saved) {
        setComments((prev) => [...prev, { id: saved.id, author_name: authorName, text: saved.text, created_at: saved.created_at, type: 'user' }]);
      }
    } else {
      setComments((prev) => [...prev, { id: Date.now(), author_name: authorName, text: newComment, created_at: Date.now(), type: 'user' }]);
    }
    setNewComment('');
  };

  const currentStatus = getStatusInfo(incident.status || 'new');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(5, 10, 24, 0.9)',
              backdropFilter: 'blur(6px)',
              zIndex: 500,
            }}
          />

          {/* Modal Container */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 501,
              pointerEvents: 'none',
              padding: '20px',
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                width: '94%',
                maxWidth: '768px',
                maxHeight: '85vh',
                backgroundColor: DARK_THEME.surface,
                border: `1px solid ${DARK_THEME.border}`,
                borderRadius: '14px',
                boxShadow: `0 0 60px ${DARK_THEME.glow}, 0 0 120px rgba(79, 195, 247, 0.1)`,
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Priority Accent Bar */}
              <div
                style={{
                  height: '6px',
                  background: `linear-gradient(90deg, ${priorityColors[incident.priority]} 0%, ${priorityColors[incident.priority]}60 50%, transparent 100%)`,
                }}
              />

              {/* Read-Only Banner for Viewers */}
              {isViewer && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 24px',
                    backgroundColor: `${DARK_THEME.electric}08`,
                    borderBottom: `1px solid ${DARK_THEME.border}`,
                  }}
                >
                  <Lock size={14} style={{ color: DARK_THEME.electric, opacity: 0.6 }} />
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      letterSpacing: '0.05em',
                      color: `${DARK_THEME.electric}99`,
                    }}
                  >
                    READ-ONLY ACCESS — Contact your administrator to make changes
                  </span>
                </div>
              )}

              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '20px 24px',
                  borderBottom: `1px solid ${DARK_THEME.border}`,
                  flexShrink: 0,
                }}
              >
                <div style={{ flex: 1 }}>
                  {/* ID and Priority Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: DARK_THEME.electric,
                      }}
                    >
                      {incident.id}
                    </span>
                    <span
                      style={{
                        padding: '4px 10px',
                        backgroundColor: `${priorityColors[incident.priority]}20`,
                        border: `1px solid ${priorityColors[incident.priority]}`,
                        borderRadius: '4px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '10px',
                        letterSpacing: '0.1em',
                        color: priorityColors[incident.priority],
                      }}
                    >
                      {incident.priority.toUpperCase()}
                    </span>
                    <span
                      style={{
                        padding: '4px 10px',
                        backgroundColor: `${currentStatus.color}20`,
                        border: `1px solid ${currentStatus.color}`,
                        borderRadius: '4px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '10px',
                        letterSpacing: '0.1em',
                        color: currentStatus.color,
                      }}
                    >
                      {currentStatus.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '22px',
                      fontWeight: 600,
                      color: DARK_THEME.text,
                      margin: 0,
                    }}
                  >
                    {incident.title}
                  </h2>

                  {/* Meta info */}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: DARK_THEME.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Clock size={12} />
                      {formatSmartTimestamp(incident.created_at).display}
                    </span>
                    {incident.updated_at && incident.updated_at !== incident.created_at && (
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '11px',
                          color: DARK_THEME.textMuted,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Clock size={12} style={{ opacity: 0.6 }} />
                        Updated {formatSmartTimestamp(incident.updated_at).display}
                      </span>
                    )}
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: DARK_THEME.warning,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Timer size={12} />
                      {formatElapsedTime(new Date(incident.created_at).getTime())}
                    </span>
                    {incident.department && (
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '11px',
                          color: DARK_THEME.textMuted,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Building2 size={12} />
                        {incident.department.toUpperCase().replace('-', ' ')}
                      </span>
                    )}
                  </div>
                </div>

                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    border: `1px solid ${DARK_THEME.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} style={{ color: DARK_THEME.textMuted }} />
                </motion.button>
              </div>

              {/* Action Buttons — hidden for viewers (read-only role) */}
              {canAct && !showResolutionForm && (
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '16px 24px',
                    borderBottom: `1px solid ${DARK_THEME.border}`,
                    flexShrink: 0,
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Assign Button */}
                  <div style={{ position: 'relative' }}>
                    <motion.button
                      onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${DARK_THEME.border}`,
                        borderRadius: '6px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        letterSpacing: '0.05em',
                        color: DARK_THEME.textMuted,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <UserPlus size={14} />
                      ASSIGN
                    </motion.button>

                    {/* Assign Dropdown */}
                    <AnimatePresence>
                      {showAssignDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '4px',
                            backgroundColor: DARK_THEME.surface,
                            border: `1px solid ${DARK_THEME.border}`,
                            borderRadius: '8px',
                            padding: '8px',
                            minWidth: '200px',
                            zIndex: 10,
                            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4)`,
                          }}
                        >
                          {teamMembers.length === 0 ? (
                            <div style={{
                              padding: '12px',
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '11px',
                              color: DARK_THEME.textMuted,
                              textAlign: 'center',
                            }}>
                              {isElectronUsers ? 'No users available' : 'Requires Electron'}
                            </div>
                          ) : (
                            <div
                              className="assign-dropdown-list"
                              style={{
                                maxHeight: '150px',
                                overflowY: teamMembers.length > 3 ? 'auto' : 'hidden',
                              }}
                            >
                              <style>{`
                                .assign-dropdown-list::-webkit-scrollbar {
                                  width: 6px;
                                }
                                .assign-dropdown-list::-webkit-scrollbar-track {
                                  background: rgba(79, 195, 247, 0.05);
                                  border-radius: 3px;
                                }
                                .assign-dropdown-list::-webkit-scrollbar-thumb {
                                  background: rgba(79, 195, 247, 0.3);
                                  border-radius: 3px;
                                }
                                .assign-dropdown-list::-webkit-scrollbar-thumb:hover {
                                  background: rgba(79, 195, 247, 0.5);
                                }
                              `}</style>
                              {teamMembers.map((member) => (
                                <button
                                  key={member.id}
                                  onClick={() => handleAssign(member)}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    height: '50px',
                                    padding: '10px 12px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    boxSizing: 'border-box',
                                  }}
                                  onMouseEnter={(e) => (e.target.style.backgroundColor = 'rgba(79, 195, 247, 0.1)')}
                                  onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                >
                                  <div
                                    style={{
                                      fontFamily: 'DM Sans, sans-serif',
                                      fontSize: '13px',
                                      color: DARK_THEME.text,
                                      lineHeight: '1.2',
                                    }}
                                  >
                                    {member.name}
                                  </div>
                                  <div
                                    style={{
                                      fontFamily: 'JetBrains Mono, monospace',
                                      fontSize: '10px',
                                      color: DARK_THEME.textMuted,
                                      textTransform: 'uppercase',
                                      lineHeight: '1.2',
                                      marginTop: '2px',
                                    }}
                                  >
                                    {member.role}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Escalate Button */}
                  <motion.button
                    onClick={() => handleStatusChange('escalated')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${DARK_THEME.warning}50`,
                      borderRadius: '6px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      letterSpacing: '0.05em',
                      color: DARK_THEME.warning,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <ArrowUpCircle size={14} />
                    ESCALATE
                  </motion.button>

                  {/* Resolve Button - triggers resolution form */}
                  <motion.button
                    onClick={() => handleResolveOrCloseClick('resolved')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${DARK_THEME.success}50`,
                      borderRadius: '6px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      letterSpacing: '0.05em',
                      color: DARK_THEME.success,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <CheckCircle size={14} />
                    RESOLVE
                  </motion.button>

                  {/* Close Button - triggers resolution form */}
                  <motion.button
                    onClick={() => handleResolveOrCloseClick('closed')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${DARK_THEME.border}`,
                      borderRadius: '6px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      letterSpacing: '0.05em',
                      color: DARK_THEME.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <XCircle size={14} />
                    CLOSE
                  </motion.button>
                </div>
              )}

              {/* Tabs - hidden when resolution form is shown */}
              {!showResolutionForm && (
                <div
                  style={{
                    display: 'flex',
                    gap: '0',
                    borderBottom: `1px solid ${DARK_THEME.border}`,
                    padding: '0 24px',
                    flexShrink: 0,
                  }}
                >
                  {[
                    { id: 'details', label: 'DETAILS', icon: FileText },
                    { id: 'timeline', label: 'TIMELINE', icon: History },
                    { id: 'comments', label: 'COMMENTS', icon: MessageSquare, count: comments.length },
                    { id: 'attachments', label: 'ATTACHMENTS', icon: Paperclip, count: attachmentsLoaded ? attachments.length : null },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '14px 20px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === tab.id ? `2px solid ${DARK_THEME.electric}` : '2px solid transparent',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        letterSpacing: '0.1em',
                        color: activeTab === tab.id ? DARK_THEME.electric : DARK_THEME.textMuted,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                      {tab.count && (
                        <span
                          style={{
                            padding: '2px 6px',
                            backgroundColor: `${DARK_THEME.electric}20`,
                            borderRadius: '10px',
                            fontSize: '10px',
                          }}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Tab Content / Resolution Form Area */}
              <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
                {/* Resolution Form - replaces tab content when active */}
                {showResolutionForm ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      <CheckCircle size={24} style={{ color: DARK_THEME.success }} />
                      <span
                        style={{
                          fontFamily: 'Rajdhani, sans-serif',
                          fontSize: '20px',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          color: DARK_THEME.success,
                        }}
                      >
                        {pendingStatus === 'resolved' ? 'RESOLVE INCIDENT' : 'CLOSE INCIDENT'}
                      </span>
                    </div>

                    {/* Resolution Type */}
                    <div style={{ marginBottom: '24px' }}>
                      <label
                        style={{
                          display: 'block',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '11px',
                          fontWeight: 500,
                          letterSpacing: '0.1em',
                          color: DARK_THEME.textMuted,
                          marginBottom: '12px',
                        }}
                      >
                        RESOLUTION TYPE *
                      </label>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {RESOLUTION_TYPES.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setResolutionType(type.value)}
                            style={{
                              padding: '12px 20px',
                              backgroundColor: resolutionType === type.value ? `${type.color}20` : 'transparent',
                              border: `1px solid ${resolutionType === type.value ? type.color : DARK_THEME.border}`,
                              borderRadius: '6px',
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '11px',
                              fontWeight: 500,
                              letterSpacing: '0.05em',
                              color: resolutionType === type.value ? type.color : DARK_THEME.textMuted,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resolution Description */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <label
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '11px',
                            fontWeight: 500,
                            letterSpacing: '0.1em',
                            color: DARK_THEME.textMuted,
                          }}
                        >
                          RESOLUTION DESCRIPTION *
                        </label>
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '11px',
                            color: resolutionCharCount >= resolutionMinChars ? DARK_THEME.success : DARK_THEME.textMuted,
                          }}
                        >
                          {resolutionCharCount}/{resolutionMinChars} MIN
                        </span>
                      </div>
                      <textarea
                        value={resolutionDescription}
                        onChange={(e) => setResolutionDescription(e.target.value)}
                        placeholder="Describe how the incident was resolved..."
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          backgroundColor: 'rgba(79, 195, 247, 0.04)',
                          border: `1px solid ${resolutionCharCount >= resolutionMinChars ? DARK_THEME.success : DARK_THEME.border}`,
                          borderRadius: '6px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          color: DARK_THEME.text,
                          outline: 'none',
                          resize: 'none',
                        }}
                      />
                    </div>

                    {/* Conditional: Partial Details */}
                    <AnimatePresence>
                      {resolutionType === 'partially_resolved' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ marginBottom: '20px', overflow: 'hidden' }}
                        >
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', color: DARK_THEME.warning, marginBottom: '8px' }}>
                                REMAINING WORK
                              </label>
                              <input
                                type="text"
                                value={partialDetails}
                                onChange={(e) => setPartialDetails(e.target.value)}
                                placeholder="What still needs to be done..."
                                style={{ width: '100%', padding: '12px 14px', backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.warning}40`, borderRadius: '6px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.text, outline: 'none' }}
                              />
                            </div>
                            <div style={{ width: '180px' }}>
                              <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', color: DARK_THEME.warning, marginBottom: '8px' }}>
                                FOLLOW-UP DATE
                              </label>
                              <input
                                type="date"
                                value={followUpDate}
                                onChange={(e) => setFollowUpDate(e.target.value)}
                                style={{ width: '100%', padding: '12px 14px', backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.warning}40`, borderRadius: '6px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.text, outline: 'none' }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Conditional: Duplicate Link */}
                    <AnimatePresence>
                      {resolutionType === 'duplicate' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ marginBottom: '20px', overflow: 'hidden' }}
                        >
                          <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', color: DARK_THEME.danger, marginBottom: '8px' }}>
                            DUPLICATE OF INCIDENT
                          </label>
                          <input
                            type="text"
                            value={duplicateId}
                            onChange={(e) => setDuplicateId(e.target.value)}
                            placeholder="INC-XXXX"
                            style={{ width: '240px', padding: '12px 14px', backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.danger}40`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: DARK_THEME.text, outline: 'none' }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Error Message */}
                    {resolutionError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '12px 16px', backgroundColor: `${DARK_THEME.danger}10`, borderRadius: '6px', border: `1px solid ${DARK_THEME.danger}30` }}>
                        <AlertTriangle size={16} style={{ color: DARK_THEME.danger, flexShrink: 0 }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.danger }}>{resolutionError}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                      <motion.button
                        onClick={handleCancelResolution}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ padding: '12px 24px', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.05em', color: DARK_THEME.textMuted, cursor: 'pointer' }}
                      >
                        CANCEL
                      </motion.button>
                      <motion.button
                        onClick={handleConfirmResolution}
                        disabled={!isResolutionValid || saving}
                        whileHover={isResolutionValid && !saving ? { scale: 1.02 } : {}}
                        whileTap={isResolutionValid && !saving ? { scale: 0.98 } : {}}
                        style={{ padding: '12px 24px', backgroundColor: isResolutionValid ? `${DARK_THEME.success}20` : 'transparent', border: `1px solid ${isResolutionValid ? DARK_THEME.success : DARK_THEME.border}`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: isResolutionValid ? DARK_THEME.success : DARK_THEME.textMuted, cursor: isResolutionValid && !saving ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1, boxShadow: isResolutionValid ? `0 0 12px ${DARK_THEME.success}30` : 'none' }}
                      >
                        {saving ? 'SAVING...' : 'CONFIRM'}
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div>
                    <div style={{ marginBottom: '20px' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, display: 'block', marginBottom: '8px' }}>
                        DESCRIPTION
                      </span>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', lineHeight: 1.6, color: DARK_THEME.text, margin: 0, padding: '16px', backgroundColor: 'rgba(79, 195, 247, 0.04)', borderRadius: '8px', border: `1px solid ${DARK_THEME.border}` }}>
                        {incident.description || 'No description provided.'}
                      </p>
                    </div>

                    {incident.assignee_name && (
                      <div style={{ marginBottom: '20px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, display: 'block', marginBottom: '8px' }}>
                          ASSIGNED TO
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'rgba(79, 195, 247, 0.04)', borderRadius: '8px', border: `1px solid ${DARK_THEME.border}` }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: DARK_THEME.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={18} style={{ color: DARK_THEME.electric }} />
                          </div>
                          <div>
                            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.text }}>{incident.assignee_name}</div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted }}>{incident.assignee_role}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reporter Section */}
                    <div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, display: 'block', marginBottom: '8px' }}>
                        REPORTER
                      </span>
                      {incident.reporter_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'rgba(79, 195, 247, 0.04)', borderRadius: '8px', border: `1px solid ${DARK_THEME.border}` }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: `${DARK_THEME.electric}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserRound size={18} style={{ color: DARK_THEME.electric }} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600, color: DARK_THEME.text }}>{incident.reporter_name}</span>
                              {incident.reporter_department && (
                                <span style={{
                                  padding: '2px 8px',
                                  backgroundColor: `${DARK_THEME.electric}15`,
                                  border: `1px solid ${DARK_THEME.electric}40`,
                                  borderRadius: '4px',
                                  fontFamily: 'JetBrains Mono, monospace',
                                  fontSize: '9px',
                                  color: DARK_THEME.electric,
                                }}>
                                  {(allDepartments.find(d => d.id === incident.reporter_department)?.name) || incident.reporter_department?.toUpperCase()}
                                </span>
                              )}
                            </div>
                            {incident.reporter_email && (
                              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, marginTop: '2px' }}>{incident.reporter_email}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(79, 195, 247, 0.02)', borderRadius: '8px', border: `1px solid ${DARK_THEME.border}` }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, fontStyle: 'italic' }}>
                            No reporter recorded
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Incident Type */}
                    <div style={{ marginTop: '20px' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, display: 'block', marginBottom: '8px' }}>
                        INCIDENT TYPE
                      </span>
                      <div style={{ padding: '12px 16px', backgroundColor: 'rgba(79, 195, 247, 0.04)', borderRadius: '8px', border: `1px solid ${DARK_THEME.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Layers size={16} style={{ color: DARK_THEME.electric }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: incident.incident_type ? DARK_THEME.text : DARK_THEME.textMuted }}>
                          {incident.incident_type ? INCIDENT_TYPE_OPTIONS.find(t => t.value === incident.incident_type)?.label || incident.incident_type.toUpperCase() : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div style={{ marginTop: '20px' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, display: 'block', marginBottom: '8px' }}>
                        TAGS
                      </span>
                      {(() => {
                        let parsedTags = [];
                        try {
                          if (incident.tags) {
                            const tagsData = typeof incident.tags === 'string' ? JSON.parse(incident.tags) : incident.tags;
                            parsedTags = Array.isArray(tagsData) ? tagsData : [];
                          }
                        } catch { parsedTags = []; }
                        return parsedTags.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {parsedTags.map((tag, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: `${DARK_THEME.electric}15`,
                                  border: `1px solid ${DARK_THEME.electric}40`,
                                  borderRadius: '4px',
                                  fontFamily: 'JetBrains Mono, monospace',
                                  fontSize: '11px',
                                  color: DARK_THEME.electric,
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(79, 195, 247, 0.02)', borderRadius: '8px', border: `1px solid ${DARK_THEME.border}` }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted }}>—</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Affected Systems */}
                    <div style={{ marginTop: '20px' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, display: 'block', marginBottom: '8px' }}>
                        AFFECTED SYSTEMS
                      </span>
                      {(() => {
                        let parsedSystems = [];
                        try {
                          if (incident.affected_systems) {
                            const systemsData = typeof incident.affected_systems === 'string' ? JSON.parse(incident.affected_systems) : incident.affected_systems;
                            parsedSystems = Array.isArray(systemsData) ? systemsData : [];
                          }
                        } catch { parsedSystems = []; }
                        return parsedSystems.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {parsedSystems.map((system, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: `${DARK_THEME.warning}15`,
                                  border: `1px solid ${DARK_THEME.warning}40`,
                                  borderRadius: '4px',
                                  fontFamily: 'JetBrains Mono, monospace',
                                  fontSize: '11px',
                                  color: DARK_THEME.warning,
                                }}
                              >
                                {system}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(79, 195, 247, 0.02)', borderRadius: '8px', border: `1px solid ${DARK_THEME.border}` }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted }}>—</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Resolution Info — only for resolved/closed incidents */}
                    {(incident.status === 'resolved' || incident.status === 'closed') && incident.resolution_type && (
                      <div style={{ marginTop: '20px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, display: 'block', marginBottom: '8px' }}>
                          RESOLUTION
                        </span>
                        <div style={{ padding: '16px', backgroundColor: `${DARK_THEME.success}08`, borderRadius: '8px', border: `1px solid ${DARK_THEME.success}30` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <Wrench size={16} style={{ color: DARK_THEME.success }} />
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: `${RESOLUTION_TYPES.find(r => r.value === incident.resolution_type)?.color || DARK_THEME.success}20`,
                              border: `1px solid ${RESOLUTION_TYPES.find(r => r.value === incident.resolution_type)?.color || DARK_THEME.success}`,
                              borderRadius: '4px',
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '10px',
                              letterSpacing: '0.08em',
                              color: RESOLUTION_TYPES.find(r => r.value === incident.resolution_type)?.color || DARK_THEME.success,
                            }}>
                              {RESOLUTION_TYPES.find(r => r.value === incident.resolution_type)?.label || incident.resolution_type.toUpperCase()}
                            </span>
                          </div>
                          {incident.resolution_description && (
                            <p style={{
                              fontFamily: 'DM Sans, sans-serif',
                              fontSize: '13px',
                              lineHeight: 1.5,
                              color: DARK_THEME.text,
                              margin: 0,
                            }}>
                              {incident.resolution_description}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                  <div style={{ position: 'relative' }}>
                    {/* Timeline line */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '11px',
                        top: '12px',
                        bottom: '12px',
                        width: '2px',
                        backgroundColor: DARK_THEME.border,
                      }}
                    />

                    {statusHistory.map((entry, index) => {
                      const statusInfo = getStatusInfo(entry.status);
                      return (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            gap: '16px',
                            marginBottom: '20px',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: DARK_THEME.surface,
                              border: `2px solid ${statusInfo.color}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              zIndex: 1,
                            }}
                          >
                            <CircleDot size={12} style={{ color: statusInfo.color }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '12px',
                                color: statusInfo.color,
                                marginBottom: '4px',
                              }}
                            >
                              Status changed to {statusInfo.label}
                            </div>
                            <div
                              style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '10px',
                                color: DARK_THEME.textMuted,
                              }}
                            >
                              {new Date(entry.timestamp).toLocaleString()} • {entry.by}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                  <div>
                    {/* Comment List */}
                    <div style={{ marginBottom: '20px' }}>
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          style={{
                            padding: '14px 16px',
                            marginBottom: '10px',
                            backgroundColor: comment.type === 'system' ? 'transparent' : 'rgba(79, 195, 247, 0.04)',
                            borderRadius: '8px',
                            border: comment.type === 'system' ? 'none' : `1px solid ${DARK_THEME.border}`,
                            borderLeft: comment.type === 'system' ? `2px solid ${DARK_THEME.textMuted}` : `2px solid ${DARK_THEME.electric}`,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: '6px',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '11px',
                                color: comment.type === 'system' ? DARK_THEME.textMuted : DARK_THEME.electric,
                              }}
                            >
                              {comment.author_name}
                            </span>
                            <span
                              style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '10px',
                                color: DARK_THEME.textMuted,
                              }}
                            >
                              {formatSmartTimestamp(comment.created_at).display}
                            </span>
                          </div>
                          <p
                            style={{
                              fontFamily: 'DM Sans, sans-serif',
                              fontSize: '13px',
                              color: comment.type === 'system' ? DARK_THEME.textMuted : DARK_THEME.text,
                              margin: 0,
                              fontStyle: comment.type === 'system' ? 'italic' : 'normal',
                            }}
                          >
                            {comment.text}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment — hidden for viewers (read-only role) */}
                    {canAct && (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                          placeholder="Add a comment..."
                          style={{
                            flex: 1,
                            padding: '12px 16px',
                            backgroundColor: 'rgba(79, 195, 247, 0.04)',
                            border: `1px solid ${DARK_THEME.border}`,
                            borderRadius: '8px',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '14px',
                            color: DARK_THEME.text,
                            outline: 'none',
                          }}
                        />
                        <motion.button
                          onClick={handleAddComment}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            padding: '12px 20px',
                            background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}40)`,
                            border: `1px solid ${DARK_THEME.electric}`,
                            borderRadius: '8px',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '11px',
                            color: DARK_THEME.electric,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <Send size={14} />
                          SEND
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}

                {/* Attachments Tab */}
                {activeTab === 'attachments' && (
                  <div>
                    {!attachmentsLoaded ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          margin: '0 auto 12px',
                          border: `2px solid ${DARK_THEME.border}`,
                          borderTop: `2px solid ${DARK_THEME.electric}`,
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>
                          Loading attachments...
                        </span>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                      </div>
                    ) : attachments.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <Paperclip size={32} style={{ color: DARK_THEME.textMuted, opacity: 0.4, marginBottom: '12px' }} />
                        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, margin: 0 }}>
                          No attachments
                        </p>
                      </div>
                    ) : (
                      <div>
                        {/* Image attachments */}
                        {attachments.filter(f => f.isImage).length > 0 && (
                          <div style={{ marginBottom: '20px' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, display: 'block', marginBottom: '12px' }}>
                              IMAGES ({attachments.filter(f => f.isImage).length})
                            </span>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                              {attachments.filter(f => f.isImage).map((file) => (
                                <motion.div
                                  key={file.id}
                                  whileHover={{ scale: 1.03 }}
                                  onClick={() => setLightboxImage(file)}
                                  style={{
                                    aspectRatio: '1',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: `1px solid ${DARK_THEME.border}`,
                                    cursor: 'pointer',
                                    position: 'relative',
                                  }}
                                >
                                  <img
                                    src={file.dataUrl}
                                    alt={file.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(transparent 60%, rgba(0,0,0,0.6) 100%)',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    padding: '8px',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                                  >
                                    <Eye size={14} style={{ color: '#fff' }} />
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Other attachments */}
                        {attachments.filter(f => !f.isImage).length > 0 && (
                          <div>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, display: 'block', marginBottom: '12px' }}>
                              FILES ({attachments.filter(f => !f.isImage).length})
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {attachments.filter(f => !f.isImage).map((file) => (
                                <div
                                  key={file.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 14px',
                                    backgroundColor: 'rgba(79, 195, 247, 0.04)',
                                    borderRadius: '8px',
                                    border: `1px solid ${DARK_THEME.border}`,
                                  }}
                                >
                                  <File size={18} style={{ color: DARK_THEME.electric, flexShrink: 0 }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {file.name}
                                    </div>
                                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted }}>
                                      {(file.size / 1024).toFixed(1)} KB
                                    </div>
                                  </div>
                                  {file.dataUrl && (
                                    <a
                                      href={file.dataUrl}
                                      download={file.name}
                                      style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        backgroundColor: 'transparent',
                                        border: `1px solid ${DARK_THEME.border}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textDecoration: 'none',
                                      }}
                                    >
                                      <Download size={14} style={{ color: DARK_THEME.textMuted }} />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                  </>
                )}
              </div>

              {/* Lightbox Overlay */}
              <AnimatePresence>
                {lightboxImage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setLightboxImage(null)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      zIndex: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '40px',
                      cursor: 'zoom-out',
                    }}
                  >
                    <motion.img
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                      src={lightboxImage.dataUrl}
                      alt={lightboxImage.name}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
                      style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={20} style={{ color: '#fff' }} />
                    </button>
                    <div style={{
                      position: 'absolute',
                      bottom: '20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}>
                      {lightboxImage.name}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default IncidentDetailModal;
