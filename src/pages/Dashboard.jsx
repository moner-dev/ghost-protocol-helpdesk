/**
 * GHOST PROTOCOL — Dashboard Page
 *
 * Operations Command Center for IT Incident Management.
 * Dark Intelligence Theater aesthetic with real-time monitoring.
 *
 * This is the orchestrator — all components are imported from
 * their own files under components/dashboard/.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { useAuth } from '@/hooks/useAuth';
import { useIncidents } from '@/hooks/useIncidents';
import { useDashboardData } from '@/hooks/useDashboardData';

import { DARK_THEME } from '@/constants/theme';

import TopCommandBar from '@/components/dashboard/TopCommandBar';
import LeftNavSidebar from '@/components/dashboard/LeftNavSidebar';
import MobileBottomNav from '@/components/dashboard/MobileBottomNav';
import MainOperationsArea from '@/components/dashboard/MainOperationsArea';
import RightActivityPanel from '@/components/dashboard/RightActivityPanel';
import IncidentsPage from '@/components/dashboard/IncidentsPage';
import EndUsersPage from '@/components/dashboard/EndUsersPage';
import ReportsPage from '@/components/dashboard/ReportsPage';
import SettingsPage from '@/components/dashboard/SettingsPage';
import HelpPage from '@/components/dashboard/HelpPage';
import AdminPage from '@/components/dashboard/AdminPage';
import AuditLogPage from '@/components/dashboard/AuditLogPage';
import KnowledgeBasePage from '@/components/dashboard/KnowledgeBasePage';
import CompanyManagementPage from '@/components/dashboard/CompanyManagementPage';
import NewIncidentModal from '@/components/dashboard/NewIncidentModal';
import DeleteConfirmDialog from '@/components/dashboard/DeleteConfirmDialog';
import IncidentDetailModal from '@/components/dashboard/IncidentDetailModal';
import { useToast } from '@/hooks/useToast';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { incidents, setIncidents, createIncident, updateIncident, deleteIncident, fetchIncidents } = useIncidents();
  const { metrics, statusData, priorityData, departmentLoad, recentResolutions } = useDashboardData(incidents);
  const toast = useToast();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isNewIncidentModalOpen, setIsNewIncidentModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentToDelete, setIncidentToDelete] = useState(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Listen for ghost:refresh event (triggered by R shortcut)
  useEffect(() => {
    const handleRefresh = () => {
      if (activeNav === 'incidents') {
        fetchIncidents();
      }
      // Other pages (endusers, company, admin) handle their own refresh
    };
    window.addEventListener('ghost:refresh', handleRefresh);
    return () => window.removeEventListener('ghost:refresh', handleRefresh);
  }, [activeNav, fetchIncidents]);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle navigation state (e.g., from IncidentEditPage back navigation)
  useEffect(() => {
    if (location.state?.activeNav) {
      setActiveNav(location.state.activeNav);
      // Clear the state to prevent re-triggering on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Listen for navigation events from system tray menu
  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && window.electronAPI?.navigation;

    if (isElectron) {
      window.electronAPI.navigation.onNavigate((page) => {
        if (page === 'dashboard' || page === 'incidents') {
          setActiveNav(page);
        }
      });

      return () => {
        window.electronAPI.navigation.removeNavigateListener();
      };
    }
  }, []);

  // Update tray agent name when user is available
  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && window.electronAPI?.tray;

    if (isElectron && user) {
      const agentName = user.display_name || user.username || 'AGENT';
      window.electronAPI.tray.setAgentName(agentName);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Responsive breakpoints
  const isMobile = dimensions.width < 768;
  const isTablet = dimensions.width >= 768 && dimensions.width < 1200;
  const isDesktop = dimensions.width >= 1200;

  // Handle new incident creation
  const handleNewIncident = async (newIncident) => {
    const created = await createIncident(newIncident, user?.id);
    if (created) {
      toast.success(`Incident ${created.id} created successfully`);
    }
  };

  // Handle view incident
  const handleViewIncident = (incident) => {
    setSelectedIncident(incident);
    setIsDetailModalOpen(true);
  };

  // Handle update incident from detail modal
  const handleUpdateIncident = async (updatedIncident) => {
    const result = await updateIncident(updatedIncident.id, updatedIncident, user?.id);
    if (result.success && result.data) {
      setSelectedIncident(result.data);
      toast.success(`Incident ${result.data.id} updated`);
      return { success: true };
    } else {
      toast.error(result.error || 'Failed to update incident');
      return { success: false, error: result.error };
    }
  };

  // Handle edit incident — navigate to edit page
  const handleEditIncident = (incident) => {
    navigate(`/incidents/${incident.id}/edit`);
  };

  // Handle delete incident (open confirm dialog)
  const handleDeleteIncident = (incident) => {
    setIncidentToDelete(incident);
    setIsDeleteDialogOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async (incident) => {
    const result = await deleteIncident(incident.id, user?.id, user?.display_name);
    if (result === true) {
      toast.success(`Incident ${incident.id} deleted`);
    } else if (result && result.error) {
      toast.error(result.error);
    } else if (result === false) {
      toast.error('Failed to delete incident');
    }
  };

  // Get categorized incidents
  const criticalIncidents = incidents.filter((i) => i.priority === 'critical');
  const highIncidents = incidents.filter((i) => i.priority === 'high');
  const mediumIncidents = incidents.filter((i) => i.priority === 'medium');
  const lowIncidents = incidents.filter((i) => i.priority === 'low');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e) => {
      const isInInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;

      // ═══════════════════════════════════════════════════════════════════════
      // CTRL/CMD + KEY SHORTCUTS (work even in inputs for some keys)
      // ═══════════════════════════════════════════════════════════════════════
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Shift+Number — reserved for IncidentEditPage tab switching
        if (e.shiftKey) return;

        switch (e.key) {
          // Navigation shortcuts
          case '1': e.preventDefault(); setActiveNav('dashboard'); break;
          case '2': e.preventDefault(); setActiveNav('incidents'); break;
          case '3': e.preventDefault(); setActiveNav('reports'); break;
          case '4': e.preventDefault(); setActiveNav('knowledge'); break;
          case '5': e.preventDefault(); setActiveNav('settings'); break;
          // New incident
          case 'n': case 'N':
            if (!isInInput) {
              e.preventDefault();
              setIsNewIncidentModalOpen(true);
            }
            break;
        }
        return;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // ESC — Close any open modal/dialog (centralized)
      // ═══════════════════════════════════════════════════════════════════════
      if (e.key === 'Escape') {
        if (isNewIncidentModalOpen) {
          e.preventDefault();
          setIsNewIncidentModalOpen(false);
          return;
        }
        if (isDetailModalOpen) {
          e.preventDefault();
          setIsDetailModalOpen(false);
          return;
        }
        if (isDeleteDialogOpen) {
          e.preventDefault();
          setIsDeleteDialogOpen(false);
          return;
        }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // SINGLE KEY SHORTCUTS (only when not in input fields)
      // ═══════════════════════════════════════════════════════════════════════
      if (isInInput) return;

      switch (e.key) {
        // ? — Open Help Center
        case '?':
          e.preventDefault();
          setActiveNav('help');
          break;

        // / — Focus search input on current page
        case '/':
          e.preventDefault();
          const searchInput = document.querySelector('[data-search-input]');
          if (searchInput) {
            searchInput.focus();
          }
          break;

        // R — Refresh current list page
        case 'r': case 'R':
          // Only trigger on list pages
          if (['incidents', 'endusers', 'company', 'admin'].includes(activeNav)) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('ghost:refresh'));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [activeNav, isNewIncidentModalOpen, isDetailModalOpen, isDeleteDialogOpen]);

  // Inject keyframes
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Shared modals rendered in all layouts
  const modals = (
    <>
      <NewIncidentModal
        isOpen={isNewIncidentModalOpen}
        onClose={() => setIsNewIncidentModalOpen(false)}
        onSubmit={handleNewIncident}
      />
      <IncidentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        incident={selectedIncident}
        onUpdate={handleUpdateIncident}
        currentUser={user}
      />
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        incident={incidentToDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );

  // Content area based on active nav
  const renderContent = (isTabletLayout) => {
    switch (activeNav) {
      case 'dashboard':
        return <MainOperationsArea isTablet={isTabletLayout} statusData={statusData} priorityData={priorityData} departmentLoad={departmentLoad} recentResolutions={recentResolutions} onViewIncident={handleViewIncident} />;
      case 'incidents':
        return (
          <IncidentsPage
            incidents={incidents}
            currentUser={user}
            onViewIncident={handleViewIncident}
            onEditIncident={user?.role !== 'viewer' ? handleEditIncident : undefined}
            onDeleteIncident={(user?.role === 'admin' || user?.role === 'owner') ? handleDeleteIncident : undefined}
            onNewIncident={user?.role !== 'viewer' ? () => setIsNewIncidentModalOpen(true) : undefined}
            onUpdateIncidents={setIncidents}
          />
        );
      case 'endusers':
        return <EndUsersPage currentUser={user} />;
      case 'reports':
        return <ReportsPage incidents={incidents} currentUser={user} />;
      case 'knowledge':
        return <KnowledgeBasePage currentUser={user} />;
      case 'settings':
        return <SettingsPage user={user} />;
      case 'help':
        return <HelpPage />;
      case 'admin':
        return (user?.role === 'admin' || user?.role === 'owner') ? <AdminPage currentUser={user} /> : <MainOperationsArea isTablet={isTabletLayout} statusData={statusData} priorityData={priorityData} departmentLoad={departmentLoad} recentResolutions={recentResolutions} onViewIncident={handleViewIncident} />;
      case 'auditlog':
        return (user?.role === 'admin' || user?.role === 'owner') ? <AuditLogPage currentUser={user} /> : <MainOperationsArea isTablet={isTabletLayout} statusData={statusData} priorityData={priorityData} departmentLoad={departmentLoad} recentResolutions={recentResolutions} onViewIncident={handleViewIncident} />;
      case 'company':
        return (user?.role === 'admin' || user?.role === 'owner') ? <CompanyManagementPage currentUser={user} /> : <MainOperationsArea isTablet={isTabletLayout} statusData={statusData} priorityData={priorityData} departmentLoad={departmentLoad} recentResolutions={recentResolutions} onViewIncident={handleViewIncident} />;
      default:
        return <MainOperationsArea isTablet={isTabletLayout} statusData={statusData} priorityData={priorityData} departmentLoad={departmentLoad} recentResolutions={recentResolutions} onViewIncident={handleViewIncident} />;
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(96, 94, 141, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TopCommandBar user={user} metrics={metrics} onLogout={handleLogout} isMobile={true} />
        <div style={{ flex: 1, overflow: 'auto', paddingBottom: '72px' }}>
          <MainOperationsArea isTablet={true} statusData={statusData} priorityData={priorityData} departmentLoad={departmentLoad} recentResolutions={recentResolutions} onViewIncident={handleViewIncident} />
        </div>
        <MobileBottomNav activeNav={activeNav} setActiveNav={(nav) => {
          if (nav === 'new') {
            setIsNewIncidentModalOpen(true);
          } else {
            setActiveNav(nav);
          }
        }} />
        {modals}
      </div>
    );
  }

  // Tablet Layout (no right panel)
  if (isTablet) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(5, 10, 24, 0.85)',
          display: 'grid',
          gridTemplateColumns: '72px 1fr',
          gridTemplateRows: '48px 1fr',
          overflow: 'hidden',
        }}
      >
        <TopCommandBar user={user} metrics={metrics} onLogout={handleLogout} isMobile={false} />
        <LeftNavSidebar activeNav={activeNav} setActiveNav={setActiveNav} userRole={user?.role} hasCritical={metrics.critical > 0} />
        {renderContent(true)}
        {modals}
      </div>
    );
  }

  // Desktop Layout (full experience)
  const showRightPanel = activeNav === 'dashboard';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 10, 24, 0.85)',
        display: 'grid',
        gridTemplateColumns: showRightPanel ? '72px 1fr 320px' : '72px 1fr',
        gridTemplateRows: '48px 1fr',
        overflow: 'hidden',
      }}
    >
      <TopCommandBar user={user} metrics={metrics} onLogout={handleLogout} isMobile={false} />
      <LeftNavSidebar activeNav={activeNav} setActiveNav={setActiveNav} userRole={user?.role} hasCritical={metrics.critical > 0} />

      {renderContent(false)}

      {showRightPanel && (
        <RightActivityPanel
          criticalIncidents={criticalIncidents}
          highIncidents={highIncidents}
          mediumIncidents={mediumIncidents}
          lowIncidents={lowIncidents}
          onNewIncident={user?.role !== 'viewer' ? () => setIsNewIncidentModalOpen(true) : undefined}
          onViewIncident={handleViewIncident}
        />
      )}

      {modals}
    </div>
  );
}

export default Dashboard;
