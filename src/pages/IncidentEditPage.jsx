/**
 * GHOST PROTOCOL — Incident Edit Page
 *
 * TopDesk-inspired three-column layout with tabbed center panel:
 *
 * - LEFT (280px): Metadata panel
 *   → Reporter, Assigned To, IT Department, Priority, Incident Type, Tags
 *
 * - CENTER (flex): Tabbed content area
 *   → Tab 1 DETAILS: Title, Description, Affected Systems
 *   → Tab 2 RESOLUTION: Resolution Type & Description
 *   → Tab 3 TIMELINE: Activity History & Comments
 *   → Tab 4 RELATED: Related Incidents
 *
 * - RIGHT (300px): Quick actions
 *   → Status Actions, Attachments, Save/Discard
 *
 * IT departments loaded dynamically from database.
 */

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Building2,
  User,
  UserRound,
  AlertTriangle,
  Timer,
  FileText,
  History,
  MessageSquare,
  ChevronDown,
  X,
  Shield,
  PlayCircle,
  ArrowUpCircle,
  CheckCircle,
  XCircle,
  Send,
  Save,
  RotateCcw,
  Plus,
  Loader2,
  Minus,
  Square,
  Copy,
  Layers,
  Tag,
  Paperclip,
  Upload,
  Link2,
  Search,
  Wrench,
  Image,
  Download,
  Eye,
  File,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { notifyDataChanged } from '@/hooks/useDataRefresh';
import { useCompanyDepartments } from '@/hooks/useCompanyDepartments';
import { DARK_THEME } from '@/constants/theme';
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '@/constants/options';
import { formatSmartTimestamp } from '@/utils/formatters';
import ReporterSelector from '@/components/ui/ReporterSelector';

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

const INCIDENT_TYPE_OPTIONS = [
  { value: 'hardware', label: 'HARDWARE' },
  { value: 'software', label: 'SOFTWARE' },
  { value: 'network', label: 'NETWORK' },
  { value: 'access', label: 'ACCESS' },
  { value: 'other', label: 'OTHER' },
];

// Center column tabs
const CENTER_TABS = [
  { key: 'details', label: 'DETAILS', icon: FileText },
  { key: 'resolution', label: 'RESOLUTION', icon: Wrench },
  { key: 'timeline', label: 'TIMELINE', icon: History },
  { key: 'attachments', label: 'ATTACHMENTS', icon: Paperclip },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════��══════

function formatElapsedTime(timestamp) {
  const elapsed = Date.now() - timestamp;
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function Badge({ children, color, style = {} }) {
  return (
    <span
      style={{
        padding: '4px 10px',
        backgroundColor: `${color}20`,
        border: `1px solid ${color}`,
        borderRadius: '4px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        letterSpacing: '0.06em',
        color: color,
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        background: `linear-gradient(135deg, ${DARK_THEME.surface} 0%, rgba(27, 42, 107, 0.15) 100%)`,
        borderRadius: '8px',
        border: `1px solid ${DARK_THEME.border}`,
        marginBottom: '14px',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;
        return (
          <motion.button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
              letterSpacing: '0.08em',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: isActive ? DARK_THEME.navy : 'transparent',
              color: isActive ? '#FFFFFF' : DARK_THEME.textMuted,
              boxShadow: isActive ? `0 0 12px ${DARK_THEME.glow}` : 'none',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: isActive ? DARK_THEME.electric : DARK_THEME.border,
            }}
          >
            <Icon size={14} />
            {tab.label}
          </motion.button>
        );
      })}
    </div>
  );
}

function Panel({ title, children, icon: Icon, accentColor = DARK_THEME.electric, locked = false, lockedMessage = '', style = {}, contentStyle = {} }) {
  return (
    <div
      style={{
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '14px',
        opacity: locked ? 0.6 : 1,
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          height: '2px',
          background: locked
            ? `linear-gradient(90deg, ${DARK_THEME.textMuted}40 0%, transparent 100%)`
            : `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}40 50%, transparent 100%)`,
        }}
      />
      {title && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderBottom: `1px solid ${DARK_THEME.border}`,
            backgroundColor: 'rgba(79, 195, 247, 0.02)',
          }}
        >
          {Icon && <Icon size={16} style={{ color: locked ? DARK_THEME.textMuted : accentColor }} />}
          <span
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: locked ? DARK_THEME.textMuted : DARK_THEME.text,
            }}
          >
            {title}
          </span>
        </div>
      )}
      <div style={{ padding: '14px 16px', pointerEvents: locked ? 'none' : 'auto', ...contentStyle }}>
        {locked && lockedMessage ? (
          <p
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              color: DARK_THEME.textMuted,
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            {lockedMessage}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function StatusActionButton({ label, icon: Icon, color, onClick, active, disabled }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      style={{
        flex: 1,
        padding: '16px 12px',
        backgroundColor: active ? `${color}25` : 'transparent',
        border: `1px solid ${active ? color : `${color}50`}`,
        borderRadius: '6px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        letterSpacing: '0.08em',
        color: color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s',
        boxShadow: active ? `0 0 12px ${color}30` : 'none',
      }}
    >
      <Icon size={18} />
      {label}
    </motion.button>
  );
}

// Fixed position dropdown to avoid z-index issues
function FixedDropdown({ isOpen, onClose, triggerRef, children, width = 'auto' }) {
  const [position, setPosition] = useState(null);
  const dropdownRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = width === 'auto' ? rect.width : width;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate left position, ensuring dropdown stays within viewport
      let left = rect.left;
      if (left + dropdownWidth > viewportWidth - 16) {
        left = viewportWidth - dropdownWidth - 16;
      }
      if (left < 16) left = 16;

      // Calculate available space below and above
      const spaceBelow = viewportHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;
      const estimatedHeight = 180; // Reasonable estimate for dropdown content

      let top;
      let maxHeightStyle;

      // Prefer showing below, flip only if necessary and more space above
      if (spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove) {
        // Show below
        top = rect.bottom + 4;
        maxHeightStyle = Math.min(250, spaceBelow);
      } else {
        // Show above - position so dropdown bottom aligns just above trigger
        maxHeightStyle = Math.min(250, spaceAbove);
        top = rect.top - maxHeightStyle - 4;
        if (top < 16) top = 16;
      }

      setPosition({
        top,
        left,
        width: dropdownWidth,
        maxHeight: maxHeightStyle,
      });
    }
  }, [triggerRef, width]);

  // Use layout effect for synchronous DOM measurement before paint
  useLayoutEffect(() => {
    if (isOpen) {
      // Calculate immediately, then again after a frame for accurate measurement
      calculatePosition();
      const frameId = requestAnimationFrame(() => {
        calculatePosition();
      });
      return () => cancelAnimationFrame(frameId);
    } else {
      setPosition(null);
    }
  }, [isOpen, calculatePosition]);

  // Recalculate on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => calculatePosition();
    const handleResize = () => calculatePosition();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, calculatePosition]);

  if (!isOpen || !position) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
        }}
      />
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: position.maxHeight || 250,
          overflowY: 'auto',
          backgroundColor: DARK_THEME.surface,
          border: `1px solid ${DARK_THEME.electric}`,
          borderRadius: '8px',
          padding: '8px',
          zIndex: 1000,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px ${DARK_THEME.glow}`,
        }}
      >
        {children}
      </motion.div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRM DIALOG COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function ConfirmDialog({ isOpen, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, confirmDanger = false }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blurred overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 2000,
            }}
          />
          {/* Centering wrapper */}
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
              zIndex: 2001,
              pointerEvents: 'none',
            }}
          >
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                width: '420px',
                backgroundColor: DARK_THEME.surface,
                border: `1px solid ${DARK_THEME.electric}`,
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: `0 0 40px ${DARK_THEME.glow}, 0 20px 60px rgba(0, 0, 0, 0.6)`,
                pointerEvents: 'auto',
              }}
            >
            {/* Top accent bar */}
            <div
              style={{
                height: '3px',
                background: `linear-gradient(90deg, ${DARK_THEME.electric} 0%, ${DARK_THEME.electric}40 50%, transparent 100%)`,
              }}
            />
            {/* Content */}
            <div style={{ padding: '24px' }}>
              <h3
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: DARK_THEME.text,
                  margin: '0 0 12px 0',
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  lineHeight: 1.6,
                  color: DARK_THEME.textMuted,
                  margin: '0 0 24px 0',
                }}
              >
                {message}
              </p>
              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                {cancelLabel && (
                  <motion.button
                    onClick={onCancel}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${DARK_THEME.border}`,
                      borderRadius: '6px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      letterSpacing: '0.05em',
                      color: DARK_THEME.textMuted,
                      cursor: 'pointer',
                    }}
                  >
                    {cancelLabel}
                  </motion.button>
                )}
                <motion.button
                  onClick={onConfirm}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: confirmDanger ? `${DARK_THEME.danger}20` : `${DARK_THEME.electric}20`,
                    border: `1px solid ${confirmDanger ? DARK_THEME.danger : DARK_THEME.electric}`,
                    borderRadius: '6px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    color: confirmDanger ? DARK_THEME.danger : DARK_THEME.electric,
                    cursor: 'pointer',
                    boxShadow: confirmDanger ? `0 0 12px ${DARK_THEME.danger}30` : `0 0 12px ${DARK_THEME.glow}`,
                  }}
                >
                  {confirmLabel || 'CONFIRM'}
                </motion.button>
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WINDOW TITLE BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function WindowTitleBar({ incidentId }) {
  const [isMaximized, setIsMaximized] = useState(false);
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.window;

  useEffect(() => {
    if (!isElectron) return;

    const checkMaximized = async () => {
      try {
        const maximized = await window.electronAPI.window.isMaximized();
        setIsMaximized(maximized);
      } catch (e) {
        // Ignore errors
      }
    };
    checkMaximized();
    const interval = setInterval(checkMaximized, 500);
    return () => clearInterval(interval);
  }, [isElectron]);

  const handleMinimize = () => window.electronAPI?.window?.minimize();
  const handleMaximize = async () => {
    await window.electronAPI?.window?.maximize();
    const maximized = await window.electronAPI?.window?.isMaximized();
    setIsMaximized(maximized);
  };
  const handleClose = () => window.electronAPI?.window?.close();

  const controlBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '42px',
    height: '32px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    WebkitAppRegion: 'no-drag',
  };

  return (
    <div
      style={{
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px 0 16px',
        backgroundColor: DARK_THEME.bg,
        borderBottom: `1px solid ${DARK_THEME.border}`,
        flexShrink: 0,
        WebkitAppRegion: 'drag',
      }}
    >
      {/* Left: App name and incident subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.15em',
            color: DARK_THEME.electric,
          }}
        >
          GHOST PROTOCOL
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            color: DARK_THEME.textMuted,
          }}
        >
          — {incidentId}
        </span>
      </div>

      {/* Right: Window controls */}
      {isElectron && (
        <div style={{ display: 'flex', alignItems: 'center', WebkitAppRegion: 'no-drag' }}>
          <button
            onClick={handleMinimize}
            style={controlBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            title="Minimize"
          >
            <Minus size={15} style={{ color: DARK_THEME.textMuted }} />
          </button>
          <button
            onClick={handleMaximize}
            style={controlBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Copy size={13} style={{ color: DARK_THEME.textMuted, transform: 'rotate(180deg)' }} />
            ) : (
              <Square size={12} style={{ color: DARK_THEME.textMuted }} />
            )}
          </button>
          <button
            onClick={handleClose}
            style={controlBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)';
              e.currentTarget.querySelector('svg').style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.querySelector('svg').style.color = DARK_THEME.textMuted;
            }}
            title="Close"
          >
            <X size={15} style={{ color: DARK_THEME.textMuted, transition: 'color 0.15s ease' }} />
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function IncidentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data loading state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [incident, setIncident] = useState(null);
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [itDepartments, setItDepartments] = useState([]);

  // Company departments from shared hook
  const { allDepartments: companyDepartments } = useCompanyDepartments();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'new',
    department: '',
    assigned_to: null,
  });
  const [affectedSystems, setAffectedSystems] = useState([]);
  const [newSystem, setNewSystem] = useState('');
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionDescription, setResolutionDescription] = useState('');
  const [partialDetails, setPartialDetails] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [duplicateId, setDuplicateId] = useState('');
  const [selectedReporter, setSelectedReporter] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null); // Store original values for comparison
  const [titleError, setTitleError] = useState(null); // Title validation error

  // New metadata fields
  const [incidentType, setIncidentType] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [relatedIncidents, setRelatedIncidents] = useState([]);
  const [relatedSearch, setRelatedSearch] = useState('');

  // Center column tab state
  const [activeTab, setActiveTab] = useState('details');

  // Dropdown states
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showIncidentTypeDropdown, setShowIncidentTypeDropdown] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '',
    cancelLabel: '',
    onConfirm: null,
    confirmDanger: false,
  });

  // Lightbox state for image preview
  const [lightboxImage, setLightboxImage] = useState(null);
  // Text/PDF preview modal state
  const [previewFile, setPreviewFile] = useState(null);

  // Refs for dropdown positioning
  const priorityRef = useRef(null);
  const departmentRef = useRef(null);
  const assignRef = useRef(null);
  const resolutionPanelRef = useRef(null);
  const incidentTypeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Helper function to process uploaded files and convert images to base64
  const processUploadedFiles = useCallback(async (files) => {
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];

    const processedFiles = await Promise.all(
      files.map(async (f) => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        const isImage = imageExts.includes(ext);

        // Convert ALL files to base64 data URL for database persistence
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              name: f.name,
              size: f.size,
              file: f,
              dataUrl: e.target.result, // base64 data URL
              isImage,
            });
          };
          reader.onerror = () => {
            // Fallback if reading fails
            resolve({ name: f.name, size: f.size, file: f, isImage });
          };
          reader.readAsDataURL(f);
        });
      })
    );

    return processedFiles;
  }, []);

  // Handle attachment deletion - deferred for persisted, immediate for new uploads
  const handleDeleteAttachment = useCallback((file) => {
    if (file.id) {
      // Persisted attachment: mark as pendingDelete (will be deleted on SAVE)
      // This allows the user to cancel by leaving without saving
      setAttachments(prev => prev.map(att =>
        att === file ? { ...att, pendingDelete: true } : att
      ));
    } else {
      // New attachment (not yet saved): remove from state immediately
      setAttachments(prev => prev.filter(att => att !== file));
    }
  }, []);

  // Derived state
  const isResolutionRequired = formData.status === 'resolved' || formData.status === 'closed';
  const resolutionCharCount = resolutionDescription.length;
  const resolutionMinChars = 5;
  const isResolutionValid = resolutionCharCount >= resolutionMinChars;

  const priorityColors = { critical: DARK_THEME.danger, high: DARK_THEME.warning, medium: DARK_THEME.electric, low: DARK_THEME.success };
  const statusColors = { new: DARK_THEME.electric, in_progress: DARK_THEME.gold, escalated: DARK_THEME.danger, resolved: DARK_THEME.success, closed: DARK_THEME.textMuted };

  // Load incident data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('No incident ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load incident, history, comments, users, and IT departments in parallel
        const [incidentData, historyData, commentsData, usersData, departmentsData] = await Promise.all([
          window.electronAPI?.incidents?.getById(id),
          window.electronAPI?.incidents?.getHistory(id),
          window.electronAPI?.incidents?.getComments(id),
          window.electronAPI?.users?.getAll(),
          window.electronAPI?.departments?.getAll(),
        ]);

        if (!incidentData) {
          setError(`Incident ${id} not found`);
          setLoading(false);
          return;
        }

        setIncident(incidentData);
        setHistory(historyData || []);
        setComments(commentsData || []);
        setUsers(usersData || []);
        setItDepartments(departmentsData || []);

        // Initialize form with incident data
        setFormData({
          title: incidentData.title || '',
          description: incidentData.description || '',
          priority: incidentData.priority || 'medium',
          status: incidentData.status || 'new',
          department: incidentData.department || '',
          assigned_to: incidentData.assigned_to || null,
        });

        // Parse affected systems from JSON string if stored
        let parsedSystems = [];
        if (incidentData.affected_systems) {
          try {
            const systems = JSON.parse(incidentData.affected_systems);
            parsedSystems = Array.isArray(systems) ? systems : [];
            setAffectedSystems(parsedSystems);
          } catch {
            setAffectedSystems([]);
          }
        }

        // Parse related incidents from JSON string if stored
        let parsedRelated = [];
        if (incidentData.related_incidents) {
          try {
            const related = JSON.parse(incidentData.related_incidents);
            parsedRelated = Array.isArray(related) ? related : [];
            setRelatedIncidents(parsedRelated);
          } catch {
            setRelatedIncidents([]);
          }
        }

        // Initialize resolution fields if incident has resolution data
        const initialResolutionType = incidentData.resolution_type || '';
        const initialResolutionDescription = incidentData.resolution_description || '';
        const initialPartialDetails = incidentData.partial_details || '';
        const initialFollowUpDate = incidentData.follow_up_date || '';
        const initialDuplicateId = incidentData.duplicate_of || '';

        setResolutionType(initialResolutionType);
        setResolutionDescription(initialResolutionDescription);
        setPartialDetails(initialPartialDetails);
        setFollowUpDate(initialFollowUpDate);
        setDuplicateId(initialDuplicateId);

        // Initialize reporter if incident has reporter data
        const initialReporter = incidentData.reporter_id ? {
          id: incidentData.reporter_id,
          full_name: incidentData.reporter_name || '',
          email: incidentData.reporter_email || '',
          department: incidentData.reporter_department || '',
        } : null;
        setSelectedReporter(initialReporter);

        // Initialize new metadata fields
        const initialIncidentType = incidentData.incident_type || '';
        let parsedTags = [];
        if (incidentData.tags) {
          try {
            const tagsData = JSON.parse(incidentData.tags);
            parsedTags = Array.isArray(tagsData) ? tagsData : [];
          } catch {
            parsedTags = [];
          }
        }
        setIncidentType(initialIncidentType);
        setTags(parsedTags);

        // Load attachments from database
        let loadedAttachments = [];
        try {
          const attachmentsList = await window.electronAPI?.attachments?.getByIncidentId(id);
          if (attachmentsList && attachmentsList.length > 0) {
            // Load full data (including dataUrl) for each attachment
            const fullAttachments = await Promise.all(
              attachmentsList.map(async (att) => {
                const fullData = await window.electronAPI?.attachments?.getData(att.id);
                if (fullData) {
                  const ext = att.filename.split('.').pop()?.toLowerCase();
                  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
                  return {
                    id: att.id, // DB ID for persisted attachments
                    name: att.filename,
                    size: att.file_size,
                    dataUrl: fullData.dataUrl,
                    isImage: imageExts.includes(ext),
                    fileType: att.file_type,
                    createdAt: att.created_at,
                  };
                }
                return null;
              })
            );
            loadedAttachments = fullAttachments.filter(Boolean);
            setAttachments(loadedAttachments);
          }
        } catch (err) {
          console.error('Failed to load attachments:', err);
        }

        // Store original data for change comparison
        setOriginalData({
          title: incidentData.title || '',
          description: incidentData.description || '',
          priority: incidentData.priority || 'medium',
          status: incidentData.status || 'new',
          department: incidentData.department || '',
          assigned_to: incidentData.assigned_to || null,
          affectedSystems: parsedSystems,
          relatedIncidents: parsedRelated,
          resolutionType: initialResolutionType,
          resolutionDescription: initialResolutionDescription,
          partialDetails: initialPartialDetails,
          followUpDate: initialFollowUpDate,
          duplicateId: initialDuplicateId,
          reporterId: incidentData.reporter_id || null,
          incidentType: initialIncidentType,
          tags: parsedTags,
          attachmentsCount: loadedAttachments.length,
          attachmentIds: loadedAttachments.map(a => a.id),
        });

        setHasUnsavedChanges(false);
      } catch (err) {
        setError('Failed to load incident data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Track changes by comparing against original data
  useEffect(() => {
    if (!loading && incident && originalData) {
      const hasChanges =
        formData.title !== originalData.title ||
        formData.description !== originalData.description ||
        formData.priority !== originalData.priority ||
        formData.status !== originalData.status ||
        formData.department !== originalData.department ||
        formData.assigned_to !== originalData.assigned_to ||
        JSON.stringify(affectedSystems) !== JSON.stringify(originalData.affectedSystems) ||
        JSON.stringify(relatedIncidents) !== JSON.stringify(originalData.relatedIncidents) ||
        resolutionType !== originalData.resolutionType ||
        resolutionDescription !== originalData.resolutionDescription ||
        partialDetails !== originalData.partialDetails ||
        followUpDate !== originalData.followUpDate ||
        duplicateId !== originalData.duplicateId ||
        (selectedReporter?.id || null) !== originalData.reporterId ||
        incidentType !== originalData.incidentType ||
        JSON.stringify(tags) !== JSON.stringify(originalData.tags) ||
        // Check for attachment changes: new uploads, pending deletes, or different persisted set
        attachments.some(att => !att.id) || // Has new (unsaved) attachments
        attachments.some(att => att.pendingDelete) || // Has attachments marked for deletion
        attachments.filter(a => !a.pendingDelete).length !== originalData.attachmentsCount ||
        JSON.stringify(attachments.filter(a => a.id && !a.pendingDelete).map(a => a.id).sort()) !== JSON.stringify((originalData.attachmentIds || []).sort());

      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, affectedSystems, relatedIncidents, resolutionType, resolutionDescription, partialDetails, followUpDate, duplicateId, selectedReporter, incidentType, tags, attachments, loading, incident, originalData]);

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Keyboard shortcuts for IncidentEditPage
  useEffect(() => {
    const handleKeyboard = (e) => {
      const isInInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;

      // Ctrl/Cmd + S — Save
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        // Trigger save via the save button click to use existing validation
        const saveBtn = document.querySelector('[data-save-button]');
        if (saveBtn && !saveBtn.disabled) {
          saveBtn.click();
        }
        return;
      }

      // Ctrl/Cmd + Shift + Number — Switch tabs
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key) {
          case '1': case '!':
            e.preventDefault();
            setActiveTab('details');
            break;
          case '2': case '@':
            e.preventDefault();
            setActiveTab('resolution');
            break;
          case '3': case '#':
            e.preventDefault();
            setActiveTab('timeline');
            break;
          case '4': case '$':
            e.preventDefault();
            setActiveTab('attachments');
            break;
        }
        return;
      }

      // Esc — Go back (if not in input and no unsaved changes, or prompt)
      if (e.key === 'Escape' && !isInInput) {
        // Close any open lightbox/preview first
        if (lightboxImage) {
          setLightboxImage(null);
          return;
        }
        if (previewFile) {
          setPreviewFile(null);
          return;
        }
        // Navigation back is handled by the back button with unsaved changes prompt
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [lightboxImage, previewFile]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle reporter selection with department auto-fill
  const handleReporterChange = useCallback((reporter) => {
    setSelectedReporter(reporter);

    // Auto-fill department when reporter is selected (not cleared)
    if (reporter && reporter.department) {
      // Check if reporter's department matches a company department
      const matchingDept = companyDepartments.find(
        (dept) => dept.id === reporter.department
      );
      if (matchingDept) {
        handleFieldChange('department', matchingDept.id);
      }
    }
    // When reporter is cleared (null), department is NOT reset per requirements
  }, [companyDepartments]);

  const handleStatusAction = (newStatus) => {
    handleFieldChange('status', newStatus);
    if (newStatus === 'resolved' || newStatus === 'closed') {
      setActiveTab('resolution');
      // Scroll to resolution panel after tab switch renders
      setTimeout(() => {
        resolutionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const handleAddSystem = () => {
    if (newSystem.trim() && !affectedSystems.includes(newSystem.trim().toUpperCase())) {
      setAffectedSystems([...affectedSystems, newSystem.trim().toUpperCase()]);
      setNewSystem('');
    }
  };

  const handleRemoveSystem = (system) => {
    setAffectedSystems(affectedSystems.filter((s) => s !== system));
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const result = await window.electronAPI?.incidents?.addComment(
        id,
        user?.id || 'unknown',
        user?.display_name || user?.username || 'Agent',
        newComment.trim()
      );

      if (result) {
        // Refresh comments
        const updatedComments = await window.electronAPI?.incidents?.getComments(id);
        setComments(updatedComments || []);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleSave = async () => {
    // Validate title is not empty
    if (!formData.title || !formData.title.trim()) {
      setTitleError('Title is required');
      setActiveTab('details'); // Switch to details tab to show error
      return;
    }
    setTitleError(null);

    try {
      setSaving(true);

      // Build update payload with all fields
      const updates = {
        ...formData,
        performed_by: user?.id || 'unknown',
        // Store arrays as JSON strings
        affected_systems: JSON.stringify(affectedSystems),
        related_incidents: JSON.stringify(relatedIncidents),
        // Reporter
        reported_by: selectedReporter?.id || null,
        // New metadata fields
        incident_type: incidentType || null,
        tags: JSON.stringify(tags),
        // Note: attachments would need separate file upload handling
      };

      // Add resolution fields if status is resolved/closed
      if (isResolutionRequired) {
        updates.resolution_type = resolutionType;
        updates.resolution_description = resolutionDescription;

        // Add conditional resolution sub-fields
        if (resolutionType === 'partially_resolved') {
          updates.partial_details = partialDetails;
          updates.follow_up_date = followUpDate || null;
        }
        if (resolutionType === 'duplicate') {
          updates.duplicate_of = duplicateId || null;
        }
      } else {
        // Clear resolution fields if not resolved/closed
        updates.resolution_type = null;
        updates.resolution_description = null;
        updates.partial_details = null;
        updates.follow_up_date = null;
        updates.duplicate_of = null;
      }

      if (!window.electronAPI?.incidents?.update) {
        setConfirmDialog({
          isOpen: true,
          title: 'SAVE FAILED',
          message: 'The save API is not available. Please restart the application.',
          confirmLabel: 'OK',
          cancelLabel: null,
          confirmDanger: true,
          onConfirm: () => setConfirmDialog((prev) => ({ ...prev, isOpen: false })),
        });
        return;
      }

      const result = await window.electronAPI.incidents.update(id, updates, user?.id);

      // Process attachment changes:
      // 1. Delete attachments marked as pendingDelete
      // 2. Save new attachments (ones without an id)
      // 3. Reload final state from DB

      // Delete pendingDelete attachments from DB
      const pendingDeletes = attachments.filter(att => att.id && att.pendingDelete);
      if (pendingDeletes.length > 0 && window.electronAPI?.attachments?.delete) {
        for (const att of pendingDeletes) {
          try {
            await window.electronAPI.attachments.delete(
              att.id,
              user?.id || 'unknown',
              user?.display_name || 'Unknown User'
            );
          } catch (err) {
            console.error('Failed to delete attachment:', att.id, err);
          }
        }
      }

      // Save new attachments (ones without an id property are not yet persisted)
      const newAttachments = attachments.filter(att => !att.id && att.dataUrl);
      if (newAttachments.length > 0 && window.electronAPI?.attachments?.saveBulk) {
        const attachmentsToSave = newAttachments.map(att => ({
          filename: att.name,
          fileType: att.fileType || att.dataUrl?.split(';')[0]?.split(':')[1] || 'application/octet-stream',
          fileSize: att.size,
          dataUrl: att.dataUrl,
        }));
        await window.electronAPI.attachments.saveBulk(
          id,
          attachmentsToSave,
          user?.id || 'unknown',
          user?.display_name || 'Unknown User'
        );
      }

      // Reload attachments from DB to get the final saved state
      let savedAttachments = [];
      if (pendingDeletes.length > 0 || newAttachments.length > 0) {
        const attachmentsList = await window.electronAPI?.attachments?.getByIncidentId(id);
        if (attachmentsList && attachmentsList.length > 0) {
          const fullAttachments = await Promise.all(
            attachmentsList.map(async (att) => {
              const fullData = await window.electronAPI?.attachments?.getData(att.id);
              if (fullData) {
                const ext = att.filename.split('.').pop()?.toLowerCase();
                const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
                return {
                  id: att.id,
                  name: att.filename,
                  size: att.file_size,
                  dataUrl: fullData.dataUrl,
                  isImage: imageExts.includes(ext),
                  fileType: att.file_type,
                  createdAt: att.created_at,
                };
              }
              return null;
            })
          );
          savedAttachments = fullAttachments.filter(Boolean);
        }
        setAttachments(savedAttachments);
      } else {
        // No attachment changes - keep current persisted attachments (excluding any pendingDelete)
        savedAttachments = attachments.filter(att => att.id && !att.pendingDelete);
      }

      // Handle new response format with backend validation
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success && result.data) {
          setIncident(result.data);

          // Update original data to match saved state using the local savedAttachments variable
          // (not the async state which may not be updated yet)
          setOriginalData({
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            status: formData.status,
            department: formData.department,
            assigned_to: formData.assigned_to,
            affectedSystems: [...affectedSystems],
            relatedIncidents: [...relatedIncidents],
            resolutionType: resolutionType,
            resolutionDescription: resolutionDescription,
            partialDetails: partialDetails,
            followUpDate: followUpDate,
            duplicateId: duplicateId,
            reporterId: selectedReporter?.id || null,
            incidentType: incidentType,
            tags: [...tags],
            attachmentsCount: savedAttachments.length,
            attachmentIds: savedAttachments.map(a => a.id),
          });

          setHasUnsavedChanges(false);
          notifyDataChanged('incidents');

          // Refresh history
          const updatedHistory = await window.electronAPI?.incidents?.getHistory(id);
          setHistory(updatedHistory || []);

          // Show success feedback
          setConfirmDialog({
            isOpen: true,
            title: 'CHANGES SAVED',
            message: 'Your changes have been saved successfully.',
            confirmLabel: 'OK',
            cancelLabel: null,
            confirmDanger: false,
            onConfirm: () => setConfirmDialog((prev) => ({ ...prev, isOpen: false })),
          });
        } else {
          // Backend validation error
          setConfirmDialog({
            isOpen: true,
            title: 'VALIDATION ERROR',
            message: result.error || 'Failed to save changes. Please check your input.',
            confirmLabel: 'OK',
            cancelLabel: null,
            confirmDanger: true,
            onConfirm: () => setConfirmDialog((prev) => ({ ...prev, isOpen: false })),
          });
        }
      } else if (result) {
        // Legacy format support (direct object return)
        setIncident(result);

        setHasUnsavedChanges(false);
        notifyDataChanged('incidents');

        // Refresh history
        const updatedHistory = await window.electronAPI?.incidents?.getHistory(id);
        setHistory(updatedHistory || []);

        // Show success feedback
        setConfirmDialog({
          isOpen: true,
          title: 'CHANGES SAVED',
          message: 'Your changes have been saved successfully.',
          confirmLabel: 'OK',
          cancelLabel: null,
          confirmDanger: false,
          onConfirm: () => setConfirmDialog((prev) => ({ ...prev, isOpen: false })),
        });
      } else {
        setConfirmDialog({
          isOpen: true,
          title: 'SAVE FAILED',
          message: 'Failed to save changes. Please try again.',
          confirmLabel: 'OK',
          cancelLabel: null,
          confirmDanger: true,
          onConfirm: () => setConfirmDialog((prev) => ({ ...prev, isOpen: false })),
        });
      }
    } catch (err) {
      setConfirmDialog({
        isOpen: true,
        title: 'SAVE FAILED',
        message: `An error occurred while saving: ${err.message}`,
        confirmLabel: 'OK',
        cancelLabel: null,
        confirmDanger: true,
        onConfirm: () => setConfirmDialog((prev) => ({ ...prev, isOpen: false })),
      });
    } finally {
      setSaving(false);
    }
  };


  const showLeaveConfirmation = (title, message) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmLabel: 'LEAVE PAGE',
      cancelLabel: 'STAY ON PAGE',
      confirmDanger: true,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        navigate('/', { state: { activeNav: 'incidents' } });
      },
    });
  };

  const handleDiscard = () => {
    showLeaveConfirmation(
      'DISCARD CHANGES',
      'All unsaved changes will be lost. Are you sure you want to discard your changes and return to the incidents page?'
    );
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      showLeaveConfirmation(
        'UNSAVED CHANGES',
        'You have unsaved changes that will be lost if you leave this page. Are you sure you want to leave?'
      );
    } else {
      navigate('/', { state: { activeNav: 'incidents' } });
    }
  };

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const currentPriority = PRIORITY_OPTIONS.find((p) => p.value === formData.priority);
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === formData.status);
  const currentDepartment = companyDepartments.find((d) => d.id === formData.department);
  const currentAssignee = users.find((u) => u.id === formData.assigned_to);

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: DARK_THEME.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <Loader2 size={40} style={{ color: DARK_THEME.electric, animation: 'spin 1s linear infinite' }} />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: DARK_THEME.textMuted }}>
          Loading incident {id}...
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: DARK_THEME.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <AlertTriangle size={40} style={{ color: DARK_THEME.danger }} />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: DARK_THEME.danger }}>
          {error}
        </span>
        <motion.button
          onClick={() => navigate('/', { state: { activeNav: 'incidents' } })}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: `1px solid ${DARK_THEME.border}`,
            borderRadius: '6px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            color: DARK_THEME.textMuted,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Return to Incidents
        </motion.button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#303644',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          BAR 1 — ELECTRON WINDOW TITLE BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <WindowTitleBar incidentId={id} />

      {/* ═══════════════════════════════════════════════════════════════════
          BAR 2 — PAGE NAVIGATION BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          height: '46px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          borderBottom: `1px solid ${DARK_THEME.border}`,
          backgroundColor: DARK_THEME.surface,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <motion.button
            onClick={handleBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              backgroundColor: 'transparent',
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '5px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              color: DARK_THEME.textMuted,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} />
            BACK
          </motion.button>
          <div style={{ height: '22px', width: '1px', backgroundColor: DARK_THEME.border }} />
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13px',
              fontWeight: 600,
              color: DARK_THEME.electric,
            }}
          >
            {id}
          </span>
          <Badge color={priorityColors[formData.priority]}>{formData.priority.toUpperCase()}</Badge>
          <Badge color={statusColors[formData.status]}>{currentStatus?.label || formData.status.toUpperCase()}</Badge>

          {/* SLA Timer */}
          <div style={{ height: '22px', width: '1px', backgroundColor: DARK_THEME.border, marginLeft: '6px' }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: 'rgba(79, 195, 247, 0.04)',
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '5px',
            }}
          >
            <Timer size={13} style={{ color: DARK_THEME.electric }} />
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                color: DARK_THEME.textMuted,
              }}
            >
              ELAPSED:
            </span>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px',
                fontWeight: 600,
                color: DARK_THEME.text,
              }}
            >
              {incident?.created_at ? formatElapsedTime(new Date(incident.created_at).getTime()) : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT - THREE COLUMN LAYOUT
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '280px 1fr 300px',
          gap: '14px',
          padding: '14px',
          overflow: 'hidden',
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════
            LEFT COLUMN (280px) - Metadata
        ═══════════════════════════════════════════════════════════════ */}
        <div style={{
          height: '100%',
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          direction: 'rtl',
          background: 'linear-gradient(90deg, rgba(10, 18, 35, 0.6) 0%, rgba(10, 18, 35, 0.4) 100%)',
          borderRadius: '12px',
          padding: '10px',
        }}>
          <div style={{ direction: 'ltr', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Reporter */}
          <Panel title="REPORTER" icon={UserRound} accentColor={DARK_THEME.electric} style={{ marginBottom: '8px' }} contentStyle={{ padding: '10px 14px' }}>
            <ReporterSelector
              value={selectedReporter}
              onChange={handleReporterChange}
            />
          </Panel>

          {/* Assigned To */}
          <Panel title="ASSIGNED TO" icon={User} style={{ marginBottom: '8px' }} contentStyle={{ padding: '10px 14px' }}>
            <div ref={assignRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(79, 195, 247, 0.04)',
                  border: `1px solid ${DARK_THEME.border}`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: currentAssignee ? DARK_THEME.navy : `${DARK_THEME.textMuted}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User size={15} style={{ color: currentAssignee ? DARK_THEME.electric : DARK_THEME.textMuted }} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '12px',
                        color: currentAssignee ? DARK_THEME.text : DARK_THEME.textMuted,
                        fontStyle: currentAssignee ? 'normal' : 'italic',
                      }}
                    >
                      {currentAssignee?.display_name || currentAssignee?.username || 'Unassigned'}
                    </div>
                    {currentAssignee && (
                      <div
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '10px',
                          color: DARK_THEME.textMuted,
                          textTransform: 'uppercase',
                        }}
                      >
                        {currentAssignee.role}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronDown size={16} style={{ color: DARK_THEME.textMuted }} />
              </button>
            </div>
            <AnimatePresence>
              <FixedDropdown
                isOpen={showAssignDropdown}
                onClose={() => setShowAssignDropdown(false)}
                triggerRef={assignRef}
              >
                {/* Unassign option */}
                {formData.assigned_to && (
                  <button
                    key="unassign"
                    onClick={() => {
                      handleFieldChange('assigned_to', null);
                      setShowAssignDropdown(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '11px 14px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '5px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      borderBottom: `1px solid ${DARK_THEME.border}`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: DARK_THEME.danger,
                      }}
                    >
                      UNASSIGN
                    </span>
                  </button>
                )}
                {users.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      handleFieldChange('assigned_to', member.id);
                      setShowAssignDropdown(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '11px 14px',
                      backgroundColor: formData.assigned_to === member.id ? 'rgba(79, 195, 247, 0.1)' : 'transparent',
                      border: 'none',
                      borderRadius: '5px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: DARK_THEME.text,
                      }}
                    >
                      {member.display_name || member.username}
                    </div>
                    <div
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: DARK_THEME.textMuted,
                        textTransform: 'uppercase',
                      }}
                    >
                      {member.role}
                    </div>
                  </button>
                ))}
              </FixedDropdown>
            </AnimatePresence>
          </Panel>

          {/* Department */}
          <Panel title="DEPARTMENT" icon={Building2} style={{ marginBottom: '8px' }} contentStyle={{ padding: '10px 14px' }}>
            <div ref={departmentRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: 'rgba(79, 195, 247, 0.04)',
                  border: `1px solid ${DARK_THEME.border}`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
                  <Building2 size={16} style={{ color: DARK_THEME.electric, flexShrink: 0 }} />
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: DARK_THEME.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={currentDepartment?.name || formData.department || ''}
                  >
                    {currentDepartment?.name || formData.department?.toUpperCase() || 'SELECT'}
                  </span>
                </div>
                <ChevronDown size={16} style={{ color: DARK_THEME.textMuted }} />
              </button>
            </div>
            <AnimatePresence>
              <FixedDropdown
                isOpen={showDepartmentDropdown}
                onClose={() => setShowDepartmentDropdown(false)}
                triggerRef={departmentRef}
              >
                {companyDepartments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => {
                      handleFieldChange('department', dept.id);
                      setShowDepartmentDropdown(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '11px 14px',
                      backgroundColor: formData.department === dept.id ? 'rgba(79, 195, 247, 0.1)' : 'transparent',
                      border: 'none',
                      borderRadius: '5px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        color: formData.department === dept.id ? DARK_THEME.electric : DARK_THEME.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                      }}
                      title={dept.name}
                    >
                      {dept.name}
                    </span>
                  </button>
                ))}
              </FixedDropdown>
            </AnimatePresence>
          </Panel>

          {/* Incident Type */}
          <Panel title="INCIDENT TYPE" icon={Layers} style={{ marginBottom: '8px' }} contentStyle={{ padding: '10px 14px' }}>
            <div ref={incidentTypeRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowIncidentTypeDropdown(!showIncidentTypeDropdown)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: 'rgba(79, 195, 247, 0.04)',
                  border: `1px solid ${DARK_THEME.border}`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={16} style={{ color: DARK_THEME.electric }} />
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: incidentType ? DARK_THEME.text : DARK_THEME.textMuted,
                    }}
                  >
                    {INCIDENT_TYPE_OPTIONS.find(t => t.value === incidentType)?.label || 'SELECT TYPE'}
                  </span>
                </div>
                <ChevronDown size={16} style={{ color: DARK_THEME.textMuted }} />
              </button>
            </div>
            <AnimatePresence>
              <FixedDropdown
                isOpen={showIncidentTypeDropdown}
                onClose={() => setShowIncidentTypeDropdown(false)}
                triggerRef={incidentTypeRef}
              >
                {INCIDENT_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setIncidentType(option.value);
                      setShowIncidentTypeDropdown(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '11px 14px',
                      backgroundColor: incidentType === option.value ? 'rgba(79, 195, 247, 0.1)' : 'transparent',
                      border: 'none',
                      borderRadius: '5px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        color: incidentType === option.value ? DARK_THEME.electric : DARK_THEME.text,
                      }}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </FixedDropdown>
            </AnimatePresence>
          </Panel>

          {/* Tags */}
          <Panel title="TAGS" icon={Tag} style={{ marginBottom: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }} contentStyle={{ padding: '10px 14px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Scrollable tags container */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', minHeight: 0 }}>
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignContent: 'flex-start' }}>
                  {tags.map((tag) => (
                  <div
                    key={tag}
                    title={tag.toUpperCase()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 10px',
                      backgroundColor: `${DARK_THEME.electric}15`,
                      border: `1px solid ${DARK_THEME.electric}40`,
                      borderRadius: '4px',
                      maxWidth: '150px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '10px',
                        color: DARK_THEME.electric,
                        textTransform: 'uppercase',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tag}
                    </span>
                    <button
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={10} style={{ color: DARK_THEME.electric }} />
                    </button>
                  </div>
                  ))}
                </div>
              )}
            </div>
            {/* Input stays fixed at bottom */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ',') && newTag.trim()) {
                    e.preventDefault();
                    const tagValue = newTag.trim().toLowerCase();
                    if (!tags.includes(tagValue) && tagValue.length <= 20) {
                      setTags([...tags, tagValue]);
                    }
                    setNewTag('');
                  }
                }}
                placeholder="Add tag..."
                maxLength={20}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  backgroundColor: 'rgba(79, 195, 247, 0.04)',
                  border: `1px solid ${DARK_THEME.border}`,
                  borderRadius: '5px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  color: DARK_THEME.text,
                  outline: 'none',
                }}
              />
              <motion.button
                onClick={() => {
                  if (newTag.trim()) {
                    const tagValue = newTag.trim().toLowerCase();
                    if (!tags.includes(tagValue) && tagValue.length <= 20) {
                      setTags([...tags, tagValue]);
                    }
                    setNewTag('');
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${DARK_THEME.electric}`,
                  borderRadius: '5px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  color: DARK_THEME.electric,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Plus size={14} />
              </motion.button>
            </div>
          </Panel>

          {/* Ghost Protocol Branding */}
          <div style={{
            padding: '16px 12px',
            textAlign: 'center',
            borderTop: `1px solid ${DARK_THEME.border}`,
            marginTop: '12px',
          }}>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.2em',
              color: DARK_THEME.electric,
              opacity: 0.6,
              marginBottom: '4px',
            }}>
              GHOST PROTOCOL
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '9px',
              letterSpacing: '0.1em',
              color: DARK_THEME.textMuted,
              opacity: 0.5,
            }}>
              INCIDENT MANAGEMENT SYSTEM
            </div>
          </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            CENTER COLUMN (flex) - Main Content with Tabs
        ═══════════════════════════════════════════════════════════════ */}
        <div style={{ overflow: 'auto', paddingRight: '8px' }}>
          {/* Tab Navigation */}
          <TabBar tabs={CENTER_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* ─────────────────────────────────────────────────────────────
              TAB 1: DETAILS — Title, Description, Affected Systems
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'details' && (
            <>
          {/* Panel 1: Incident Title */}
          <Panel title="INCIDENT TITLE" icon={FileText}>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                handleFieldChange('title', e.target.value);
                if (titleError) setTitleError(null);
              }}
              style={{
                width: '100%',
                padding: '13px 14px',
                backgroundColor: 'rgba(79, 195, 247, 0.04)',
                border: `1px solid ${titleError ? '#EF4444' : DARK_THEME.border}`,
                borderRadius: '6px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '15px',
                fontWeight: 500,
                color: DARK_THEME.text,
                outline: 'none',
                marginBottom: titleError ? '6px' : '12px',
              }}
            />
            {titleError && (
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                color: '#EF4444',
                marginBottom: '12px',
              }}>
                {titleError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px',
                  color: DARK_THEME.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Clock size={12} />
                Created {incident?.created_at ? formatSmartTimestamp(incident.created_at).display : '--'}
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px',
                  color: DARK_THEME.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Clock size={12} />
                Updated {incident?.updated_at ? formatSmartTimestamp(incident.updated_at).display : '--'}
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px',
                  color: DARK_THEME.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <User size={12} />
                Created by {incident?.creator_name || incident?.created_by || 'Unknown'}
              </span>
            </div>
          </Panel>

          {/* Panel 2: Description */}
          <Panel title="DESCRIPTION" icon={FileText}>
            <textarea
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Enter incident description..."
              style={{
                width: '100%',
                minHeight: '280px',
                padding: '12px 14px',
                backgroundColor: 'rgba(79, 195, 247, 0.04)',
                border: `1px solid ${DARK_THEME.border}`,
                borderRadius: '6px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '15px',
                lineHeight: 1.5,
                color: DARK_THEME.text,
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </Panel>

          {/* Affected Systems */}
          <Panel title="AFFECTED SYSTEMS" icon={AlertTriangle} accentColor={DARK_THEME.warning}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {affectedSystems.map((system) => (
                <div
                  key={system}
                  title={system}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 10px',
                    backgroundColor: `${DARK_THEME.warning}15`,
                    border: `1px solid ${DARK_THEME.warning}40`,
                    borderRadius: '4px',
                    maxWidth: '180px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '10px',
                      color: DARK_THEME.warning,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {system}
                  </span>
                  <button
                    onClick={() => handleRemoveSystem(system)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={10} style={{ color: DARK_THEME.warning }} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newSystem}
                onChange={(e) => setNewSystem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddSystem();
                  }
                }}
                placeholder="Add system..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  backgroundColor: 'rgba(79, 195, 247, 0.04)',
                  border: `1px solid ${DARK_THEME.border}`,
                  borderRadius: '5px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  color: DARK_THEME.text,
                  outline: 'none',
                }}
              />
              <motion.button
                onClick={handleAddSystem}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${DARK_THEME.warning}`,
                  borderRadius: '5px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  color: DARK_THEME.warning,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Plus size={14} />
              </motion.button>
            </div>
          </Panel>

          {/* Related Incidents */}
          <Panel title="RELATED INCIDENTS" icon={Link2}>
            {relatedIncidents.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {relatedIncidents.map((inc) => (
                  <div
                    key={inc}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      backgroundColor: `${DARK_THEME.electric}15`,
                      border: `1px solid ${DARK_THEME.electric}40`,
                      borderRadius: '5px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: DARK_THEME.electric,
                      }}
                    >
                      {inc}
                    </span>
                    <button
                      onClick={() => setRelatedIncidents(relatedIncidents.filter((i) => i !== inc))}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={12} style={{ color: DARK_THEME.electric }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: DARK_THEME.textMuted,
                  }}
                />
                <input
                  type="text"
                  value={relatedSearch}
                  onChange={(e) => setRelatedSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && relatedSearch.trim()) {
                      if (!relatedIncidents.includes(relatedSearch.trim().toUpperCase())) {
                        setRelatedIncidents([...relatedIncidents, relatedSearch.trim().toUpperCase()]);
                      }
                      setRelatedSearch('');
                    }
                  }}
                  placeholder="Search by ID..."
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 32px',
                    backgroundColor: 'rgba(79, 195, 247, 0.04)',
                    border: `1px solid ${DARK_THEME.border}`,
                    borderRadius: '5px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    color: DARK_THEME.text,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </Panel>
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 2: RESOLUTION — Resolution Type & Description
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'resolution' && (
          <div ref={resolutionPanelRef}>
            <Panel
              title="RESOLUTION DETAILS"
              icon={CheckCircle}
              accentColor={DARK_THEME.success}
              locked={!isResolutionRequired}
              lockedMessage="Resolution details required when changing status to RESOLVED or CLOSED."
            >
              {/* Resolution Type Button Group */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    color: DARK_THEME.textMuted,
                    marginBottom: '10px',
                  }}
                >
                  RESOLUTION TYPE *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {RESOLUTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setResolutionType(type.value)}
                      style={{
                        padding: '16px 12px',
                        backgroundColor: resolutionType === type.value ? `${type.color}20` : 'transparent',
                        border: `1px solid ${resolutionType === type.value ? type.color : DARK_THEME.border}`,
                        borderRadius: '6px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        fontWeight: 500,
                        letterSpacing: '0.03em',
                        color: resolutionType === type.value ? type.color : DARK_THEME.textMuted,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center',
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Description */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
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
                      color: isResolutionValid ? DARK_THEME.success : DARK_THEME.textMuted,
                    }}
                  >
                    {resolutionCharCount}/{resolutionMinChars} MIN
                  </span>
                </div>
                <textarea
                  value={resolutionDescription}
                  onChange={(e) => setResolutionDescription(e.target.value)}
                  placeholder="Describe how the incident was resolved..."
                  style={{
                    width: '100%',
                    minHeight: '300px',
                    padding: '14px 16px',
                    backgroundColor: 'rgba(79, 195, 247, 0.04)',
                    border: `1px solid ${isResolutionValid ? DARK_THEME.success : DARK_THEME.border}`,
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
                    style={{ marginBottom: '12px', overflow: 'hidden' }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        letterSpacing: '0.1em',
                        color: DARK_THEME.warning,
                        marginBottom: '8px',
                      }}
                    >
                      WHAT STILL NEEDS TO BE DONE?
                    </label>
                    <textarea
                      value={partialDetails}
                      onChange={(e) => setPartialDetails(e.target.value)}
                      placeholder="Describe remaining work..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        backgroundColor: 'rgba(79, 195, 247, 0.04)',
                        border: `1px solid ${DARK_THEME.warning}40`,
                        borderRadius: '6px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: DARK_THEME.text,
                        outline: 'none',
                        resize: 'vertical',
                        marginBottom: '10px',
                      }}
                    />
                    <label
                      style={{
                        display: 'block',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        letterSpacing: '0.1em',
                        color: DARK_THEME.warning,
                        marginBottom: '8px',
                      }}
                    >
                      FOLLOW-UP DATE
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'rgba(79, 195, 247, 0.04)',
                        border: `1px solid ${DARK_THEME.warning}40`,
                        borderRadius: '6px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: DARK_THEME.text,
                        outline: 'none',
                      }}
                    />
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
                    style={{ overflow: 'hidden' }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        letterSpacing: '0.1em',
                        color: DARK_THEME.danger,
                        marginBottom: '8px',
                      }}
                    >
                      DUPLICATE OF INCIDENT
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={duplicateId}
                        onChange={(e) => setDuplicateId(e.target.value)}
                        placeholder="INC-XXXX"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          backgroundColor: 'rgba(79, 195, 247, 0.04)',
                          border: `1px solid ${DARK_THEME.danger}40`,
                          borderRadius: '6px',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '13px',
                          color: DARK_THEME.text,
                          outline: 'none',
                        }}
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          padding: '10px 14px',
                          backgroundColor: 'transparent',
                          border: `1px solid ${DARK_THEME.danger}`,
                          borderRadius: '6px',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '11px',
                          color: DARK_THEME.danger,
                          cursor: 'pointer',
                        }}
                      >
                        VERIFY
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Panel>
          </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 3: TIMELINE — Activity History & Comments
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'timeline' && (
            <>
          {/* Panel 5: Activity Timeline */}
          <Panel title="ACTIVITY TIMELINE" icon={History}>
            <div style={{ position: 'relative' }}>
              {/* Timeline line */}
              <div
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '10px',
                  bottom: '10px',
                  width: '2px',
                  backgroundColor: DARK_THEME.border,
                }}
              />

              {[...history].reverse().map((entry, index) => {
                const actionColors = {
                  created: DARK_THEME.electric,
                  assigned: DARK_THEME.gold,
                  status_change: DARK_THEME.success,
                  updated: DARK_THEME.textMuted,
                };
                const color = actionColors[entry.action] || DARK_THEME.textMuted;

                return (
                  <div
                    key={entry.id || index}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      marginBottom: index === history.length - 1 ? 0 : '12px',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: DARK_THEME.surface,
                        border: `2px solid ${color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        zIndex: 1,
                      }}
                    >
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '14px',
                          color: DARK_THEME.text,
                          marginBottom: '3px',
                        }}
                      >
                        {entry.action === 'created' && 'Incident created'}
                        {entry.action === 'assigned' && `Assigned to ${entry.new_value}`}
                        {entry.action === 'status_change' && `Status changed to ${entry.new_value}`}
                        {entry.action === 'updated' && `Priority changed from ${entry.old_value} to ${entry.new_value}`}
                      </div>
                      <div
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '10px',
                          color: DARK_THEME.textMuted,
                        }}
                      >
                        {new Date(entry.performed_at).toLocaleString()} by {entry.performer_name || entry.performed_by || 'System'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Panel 6: Comments */}
          <Panel title={`COMMENTS (${comments.length})`} icon={MessageSquare}>
            {comments.length > 0 ? (
              <div style={{ marginBottom: '12px' }}>
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '10px 0',
                      borderBottom: `1px solid ${DARK_THEME.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: DARK_THEME.navy,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'Rajdhani, sans-serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: DARK_THEME.electric,
                        }}
                      >
                        {comment.author_name.charAt(0)}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '13px',
                            color: DARK_THEME.electric,
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
                          color: DARK_THEME.text,
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: DARK_THEME.textMuted,
                  margin: '0 0 12px 0',
                }}
              >
                No comments yet.
              </p>
            )}

            {/* Add Comment */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Add a comment..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  backgroundColor: 'rgba(79, 195, 247, 0.04)',
                  border: `1px solid ${DARK_THEME.border}`,
                  borderRadius: '6px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: DARK_THEME.text,
                  outline: 'none',
                }}
              />
              <motion.button
                onClick={handleAddComment}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '10px 16px',
                  background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}40)`,
                  border: `1px solid ${DARK_THEME.electric}`,
                  borderRadius: '6px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  color: DARK_THEME.electric,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Send size={13} />
                SEND
              </motion.button>
            </div>
          </Panel>
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 4: ATTACHMENTS — File Uploads & Previews
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'attachments' && (
            <>
          {/* Upload Panel */}
          <Panel title="UPLOAD FILES" icon={Upload}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                const processed = await processUploadedFiles(files);
                setAttachments([...attachments, ...processed]);
                e.target.value = '';
              }}
              style={{ display: 'none' }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = DARK_THEME.electric; e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.08)'; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = DARK_THEME.border; e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.02)'; }}
              onDrop={async (e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = DARK_THEME.border;
                e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.02)';
                const files = Array.from(e.dataTransfer.files);
                const processed = await processUploadedFiles(files);
                setAttachments([...attachments, ...processed]);
              }}
              style={{
                padding: '32px 20px',
                backgroundColor: 'rgba(79, 195, 247, 0.02)',
                border: `2px dashed ${DARK_THEME.border}`,
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <Upload size={32} style={{ color: DARK_THEME.electric }} />
              </div>
              <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '16px', fontWeight: 600, color: DARK_THEME.text, margin: '0 0 4px 0' }}>
                Drop files here or click to browse
              </p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, margin: 0 }}>
                Images, documents, and other files
              </p>
            </div>
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '12px',
                background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}40)`,
                border: `1px solid ${DARK_THEME.electric}`,
                borderRadius: '6px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: DARK_THEME.electric,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Plus size={14} />
              ADD FILE
            </motion.button>
          </Panel>

          {/* Attached Files Panel */}
          {(() => {
            // Filter out pendingDelete attachments for display
            const visibleAttachments = attachments.filter(a => !a.pendingDelete);
            if (visibleAttachments.length === 0) return null;
            return (
            <Panel title={`ATTACHED FILES (${visibleAttachments.length})`} icon={Paperclip}>
              {/* Images Grid */}
              {(() => {
                const images = visibleAttachments.filter(f => f.isImage || (() => {
                  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
                  const ext = f.name.split('.').pop()?.toLowerCase();
                  return imageExts.includes(ext);
                })());
                if (images.length === 0) return null;
                return (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Image size={14} />
                      IMAGES ({images.length})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px' }}>
                      {images.map((file, idx) => {
                        // Use base64 dataUrl if available, otherwise fallback
                        const imageUrl = file.dataUrl || file.url;
                        if (!imageUrl) return null; // Skip if no valid URL
                        return (
                          <div
                            key={`img-${idx}`}
                            onClick={() => setLightboxImage({ url: imageUrl, name: file.name })}
                            style={{
                              position: 'relative',
                              aspectRatio: '1',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: `1px solid ${DARK_THEME.border}`,
                              backgroundColor: DARK_THEME.navy,
                            }}
                          >
                            <img
                              src={imageUrl}
                              alt={file.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                            }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                            >
                              <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px' }}>
                                <Eye size={16} style={{ color: '#fff' }} />
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAttachment(file);
                              }}
                              style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <X size={12} style={{ color: '#fff' }} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Text/PDF Files */}
              {(() => {
                const textExts = ['txt', 'md', 'json', 'xml', 'csv', 'log', 'pdf'];
                const textFiles = visibleAttachments.filter(f => {
                  const ext = f.name.split('.').pop()?.toLowerCase();
                  return textExts.includes(ext);
                });
                if (textFiles.length === 0) return null;
                return (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={14} />
                      DOCUMENTS ({textFiles.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {textFiles.map((file, idx) => {
                        const ext = file.name.split('.').pop()?.toLowerCase();
                        const isPdf = ext === 'pdf';
                        return (
                          <div
                            key={`doc-${idx}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '14px 16px',
                              backgroundColor: 'rgba(79, 195, 247, 0.04)',
                              border: `1px solid ${DARK_THEME.border}`,
                              borderRadius: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                              <FileText size={22} style={{ color: isPdf ? DARK_THEME.danger : DARK_THEME.electric, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: DARK_THEME.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {file.name}
                                </div>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, marginTop: '2px' }}>
                                  {(file.size / 1024).toFixed(1)} KB
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <motion.button
                                onClick={() => setPreviewFile(file)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                  padding: '8px 12px',
                                  backgroundColor: 'transparent',
                                  border: `1px solid ${DARK_THEME.electric}`,
                                  borderRadius: '6px',
                                  fontFamily: 'JetBrains Mono, monospace',
                                  fontSize: '10px',
                                  color: DARK_THEME.electric,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <Eye size={12} />
                                PREVIEW
                              </motion.button>
                              <button
                                onClick={() => handleDeleteAttachment(file)}
                                style={{
                                  padding: '8px',
                                  backgroundColor: 'transparent',
                                  border: `1px solid ${DARK_THEME.danger}50`,
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <X size={14} style={{ color: DARK_THEME.danger }} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Other Files */}
              {(() => {
                const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
                const textExts = ['txt', 'md', 'json', 'xml', 'csv', 'log', 'pdf'];
                const otherFiles = visibleAttachments.filter(f => {
                  const ext = f.name.split('.').pop()?.toLowerCase();
                  return !imageExts.includes(ext) && !textExts.includes(ext);
                });
                if (otherFiles.length === 0) return null;
                return (
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <File size={14} />
                      OTHER FILES ({otherFiles.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {otherFiles.map((file, idx) => (
                        <div
                          key={`other-${idx}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 16px',
                            backgroundColor: 'rgba(79, 195, 247, 0.04)',
                            border: `1px solid ${DARK_THEME.border}`,
                            borderRadius: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                            <File size={22} style={{ color: DARK_THEME.textMuted, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: DARK_THEME.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.name}
                              </div>
                              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, marginTop: '2px' }}>
                                {(file.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {file.file && (
                              <motion.button
                                onClick={() => {
                                  const url = URL.createObjectURL(file.file);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = file.name;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                  padding: '8px 12px',
                                  backgroundColor: 'transparent',
                                  border: `1px solid ${DARK_THEME.electric}`,
                                  borderRadius: '6px',
                                  fontFamily: 'JetBrains Mono, monospace',
                                  fontSize: '10px',
                                  color: DARK_THEME.electric,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <Download size={12} />
                                DOWNLOAD
                              </motion.button>
                            )}
                            <button
                              onClick={() => handleDeleteAttachment(file)}
                              style={{
                                padding: '8px',
                                backgroundColor: 'transparent',
                                border: `1px solid ${DARK_THEME.danger}50`,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <X size={14} style={{ color: DARK_THEME.danger }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </Panel>
            );
          })()}

          {/* Empty State */}
          {attachments.filter(a => !a.pendingDelete).length === 0 && (
            <Panel title="NO ATTACHMENTS" icon={Paperclip}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Paperclip size={32} style={{ color: DARK_THEME.textMuted, marginBottom: '12px' }} />
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, margin: 0 }}>
                  No files attached to this incident yet.
                </p>
              </div>
            </Panel>
          )}
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT COLUMN (300px) - Actions Only
        ═══════════════════════════════════════════════════════════════ */}
        <div style={{
          overflowY: 'auto',
          overflowX: 'visible',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(90deg, rgba(10, 18, 35, 0.4) 0%, rgba(10, 18, 35, 0.6) 100%)',
          borderRadius: '12px',
          padding: '12px',
        }}>
          {/* Priority */}
          <Panel title="PRIORITY" icon={AlertTriangle} accentColor={priorityColors[formData.priority]} contentStyle={{ padding: '10px 14px' }}>
            <div ref={priorityRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: `${priorityColors[formData.priority]}10`,
                  border: `1px solid ${priorityColors[formData.priority]}`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: priorityColors[formData.priority],
                      boxShadow: `0 0 8px ${priorityColors[formData.priority]}`,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: priorityColors[formData.priority],
                    }}
                  >
                    {formData.priority.toUpperCase()}
                  </span>
                </div>
                <ChevronDown size={16} style={{ color: DARK_THEME.textMuted }} />
              </button>
            </div>
            <AnimatePresence>
              <FixedDropdown
                isOpen={showPriorityDropdown}
                onClose={() => setShowPriorityDropdown(false)}
                triggerRef={priorityRef}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleFieldChange('priority', option.value);
                      setShowPriorityDropdown(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '11px 14px',
                      backgroundColor: formData.priority === option.value ? `${option.color}15` : 'transparent',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: option.color,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        color: option.color,
                      }}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </FixedDropdown>
            </AnimatePresence>
          </Panel>

          {/* Status Actions */}
          <Panel title="STATUS ACTIONS" icon={Shield}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <StatusActionButton
                label="IN PROGRESS"
                icon={PlayCircle}
                color={DARK_THEME.gold}
                onClick={() => handleStatusAction('in_progress')}
                active={formData.status === 'in_progress'}
              />
              <StatusActionButton
                label="ESCALATE"
                icon={ArrowUpCircle}
                color={DARK_THEME.warning}
                onClick={() => handleStatusAction('escalated')}
                active={formData.status === 'escalated'}
              />
              <StatusActionButton
                label="RESOLVE"
                icon={CheckCircle}
                color={DARK_THEME.success}
                onClick={() => handleStatusAction('resolved')}
                active={formData.status === 'resolved'}
              />
              <StatusActionButton
                label="CLOSE"
                icon={XCircle}
                color={DARK_THEME.textMuted}
                onClick={() => handleStatusAction('closed')}
                active={formData.status === 'closed'}
              />
            </div>
            <p
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                color: DARK_THEME.textMuted,
                margin: 0,
                fontStyle: 'italic',
              }}
            >
              Resolving requires completing resolution details.
            </p>
          </Panel>

          {/* Attachments Summary */}
          <Panel title="ATTACHMENTS" icon={Paperclip} contentStyle={{ padding: '10px 14px' }}>
            <motion.div
              onClick={() => setActiveTab('attachments')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '16px',
                backgroundColor: attachments.filter(a => !a.pendingDelete).length > 0 ? `${DARK_THEME.electric}10` : 'rgba(79, 195, 247, 0.02)',
                border: `1px solid ${attachments.filter(a => !a.pendingDelete).length > 0 ? DARK_THEME.electric : DARK_THEME.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Paperclip size={18} style={{ color: attachments.filter(a => !a.pendingDelete).length > 0 ? DARK_THEME.electric : DARK_THEME.textMuted }} />
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '14px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: attachments.filter(a => !a.pendingDelete).length > 0 ? DARK_THEME.electric : DARK_THEME.textMuted,
                }}
              >
                {(() => {
                  const count = attachments.filter(a => !a.pendingDelete).length;
                  return count > 0 ? `${count} FILE${count > 1 ? 'S' : ''}` : 'NO FILES';
                })()}
              </span>
            </motion.div>
            <p
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                color: DARK_THEME.textMuted,
                margin: '10px 0 0 0',
                textAlign: 'center',
              }}
            >
              Click to view & manage attachments
            </p>
          </Panel>

          {/* Save Actions - Always at bottom */}
          <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
            <motion.button
              data-save-button
              onClick={handleSave}
              disabled={saving}
              whileHover={!saving ? { scale: 1.01 } : {}}
              whileTap={!saving ? { scale: 0.99 } : {}}
              style={{
                width: '100%',
                padding: '14px',
                background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}40)`,
                border: `1px solid ${DARK_THEME.electric}`,
                borderRadius: '6px',
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: DARK_THEME.electric,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: `0 0 14px ${DARK_THEME.glow}`,
                marginBottom: '12px',
              }}
            >
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </motion.button>
            <button
              onClick={handleDiscard}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                border: 'none',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                color: DARK_THEME.textMuted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <RotateCcw size={13} />
              DISCARD CHANGES
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        confirmDanger={confirmDialog.confirmDanger}
      />

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(8px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'zoom-out',
              }}
            >
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                src={lightboxImage.url}
                alt={lightboxImage.name}
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 0 60px rgba(0, 0, 0, 0.5)',
                }}
              />
              <button
                onClick={() => setLightboxImage(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} style={{ color: '#fff' }} />
              </button>
              <div
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                }}
              >
                {lightboxImage.name}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Text/PDF Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewFile(null)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(5, 10, 24, 0.9)',
                backdropFilter: 'blur(4px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '90%',
                  maxWidth: '800px',
                  maxHeight: '80vh',
                  backgroundColor: DARK_THEME.surface,
                  border: `1px solid ${DARK_THEME.border}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: `1px solid ${DARK_THEME.border}`,
                    backgroundColor: 'rgba(79, 195, 247, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={18} style={{ color: DARK_THEME.electric }} />
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: DARK_THEME.text,
                      }}
                    >
                      {previewFile.name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '10px',
                        color: DARK_THEME.textMuted,
                      }}
                    >
                      ({(previewFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => setPreviewFile(null)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${DARK_THEME.border}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={16} style={{ color: DARK_THEME.textMuted }} />
                  </button>
                </div>
                {/* Content */}
                <div
                  style={{
                    flex: 1,
                    padding: '20px',
                    overflowY: 'auto',
                    backgroundColor: DARK_THEME.navy,
                  }}
                >
                  {previewFile.file ? (
                    <PreviewContent file={previewFile.file} />
                  ) : (
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted }}>
                      Preview not available
                    </p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper component to preview file content
function PreviewContent({ file }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
      // For PDF, create a URL and show in iframe
      const url = URL.createObjectURL(file);
      setContent({ type: 'pdf', url });
      setLoading(false);
      return () => URL.revokeObjectURL(url);
    } else {
      // For text files, read content
      const reader = new FileReader();
      reader.onload = (e) => {
        setContent({ type: 'text', text: e.target.result });
        setLoading(false);
      };
      reader.onerror = () => {
        setContent({ type: 'error' });
        setLoading(false);
      };
      reader.readAsText(file);
    }
  }, [file]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <Loader2 size={24} style={{ color: DARK_THEME.electric, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (content?.type === 'pdf') {
    return (
      <iframe
        src={content.url}
        style={{ width: '100%', height: '60vh', border: 'none', borderRadius: '6px' }}
        title="PDF Preview"
      />
    );
  }

  if (content?.type === 'text') {
    return (
      <pre
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12px',
          color: DARK_THEME.text,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {content.text}
      </pre>
    );
  }

  return (
    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.danger }}>
      Unable to preview this file.
    </p>
  );
}

export default IncidentEditPage;
