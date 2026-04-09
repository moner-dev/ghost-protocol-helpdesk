/**
 * GHOST PROTOCOL — useDashboardData Hook
 *
 * In Electron: fetches from SQLite via IPC with differentiated polling.
 * In Browser: computes all metrics live from the incident array.
 * Either way, charts always reflect real current data.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDataRefresh } from './useDataRefresh';
import { DARK_THEME } from '@/constants/theme';

const isElectron = typeof window !== 'undefined' && window.electronAPI?.metrics;

const PRIORITY_COLORS = {
  critical: DARK_THEME.danger,
  high: DARK_THEME.warning,
  medium: DARK_THEME.electric,
  low: DARK_THEME.textMuted,
};

const STATUS_COLORS = {
  Active: DARK_THEME.electric,
  Pending: DARK_THEME.gold,
  Resolved: DARK_THEME.success,
  Escalated: DARK_THEME.danger,
};

// Compute all dashboard data from an incident array (used in browser mode)
function computeFromIncidents(incidents) {
  const active = incidents.filter((i) => i.status !== 'resolved' && i.status !== 'closed').length;
  const critical = incidents.filter((i) => i.priority === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length;
  const pending = incidents.filter((i) => i.status === 'in_progress').length;
  const resolvedToday = incidents.filter((i) => i.status === 'resolved' || i.status === 'closed').length;

  const metrics = { active, critical, pending, resolvedToday };

  // Status distribution
  const newCount = incidents.filter((i) => !i.status || i.status === 'new').length;
  const inProgressCount = incidents.filter((i) => i.status === 'in_progress').length;
  const escalatedCount = incidents.filter((i) => i.status === 'escalated').length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;
  const closedCount = incidents.filter((i) => i.status === 'closed').length;

  const statusData = [
    { status: 'Active', count: newCount + inProgressCount, color: STATUS_COLORS.Active },
    { status: 'Escalated', count: escalatedCount, color: STATUS_COLORS.Escalated },
    { status: 'Resolved', count: resolvedCount + closedCount, color: STATUS_COLORS.Resolved },
    { status: 'Pending', count: inProgressCount, color: STATUS_COLORS.Pending },
  ].filter((s) => s.count > 0);

  // Priority breakdown
  const priorityData = [
    { level: 'CRITICAL', count: incidents.filter((i) => i.priority === 'critical').length, color: PRIORITY_COLORS.critical },
    { level: 'HIGH', count: incidents.filter((i) => i.priority === 'high').length, color: PRIORITY_COLORS.high },
    { level: 'MEDIUM', count: incidents.filter((i) => i.priority === 'medium').length, color: PRIORITY_COLORS.medium },
    { level: 'LOW', count: incidents.filter((i) => i.priority === 'low').length, color: PRIORITY_COLORS.low },
  ];

  // Department load (computed from open incidents)
  const deptMap = {};
  const DEPT_CAPACITY = { 'it-ops': 30, 'security': 15, 'network': 20, 'helpdesk': 40, 'dev': 25 };
  const DEPT_NAMES = { 'it-ops': 'IT OPS', 'security': 'SECURITY', 'network': 'NETWORK', 'helpdesk': 'HELPDESK', 'dev': 'DEV' };

  incidents.forEach((i) => {
    if (i.department && i.status !== 'resolved' && i.status !== 'closed') {
      deptMap[i.department] = (deptMap[i.department] || 0) + 1;
    }
  });

  const departmentLoad = Object.keys(DEPT_CAPACITY).map((dept) => ({
    name: DEPT_NAMES[dept] || dept.toUpperCase(),
    count: deptMap[dept] || 0,
    capacity: DEPT_CAPACITY[dept],
  }));

  // Recent incidents — most recently added, regardless of status
  const recentResolutions = [...incidents]
    .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
    .slice(0, 8)
    .map((i) => ({
      time: new Date(i.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      id: i.id,
      title: i.title,
      status: (i.status || 'new').toUpperCase().replace('_', ' '),
      rawStatus: i.status || 'new',
      priority: i.priority,
      department: i.department,
      description: i.description,
      created_at: i.created_at,
    }));

  return { metrics, statusData, priorityData, departmentLoad, recentResolutions };
}

export function useDashboardData(incidents = []) {
  const [metrics, setMetrics] = useState({ active: 0, critical: 0, pending: 0, resolvedToday: 0 });
  const [statusData, setStatusData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [departmentLoad, setDepartmentLoad] = useState([]);
  const [recentResolutions, setRecentResolutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalsRef = useRef([]);

  // ── Browser mode: compute from incident array ──
  useEffect(() => {
    if (isElectron) return;
    if (incidents.length === 0 && isLoading) return;

    const computed = computeFromIncidents(incidents);
    setMetrics(computed.metrics);
    setStatusData(computed.statusData);
    setPriorityData(computed.priorityData);
    setDepartmentLoad(computed.departmentLoad);
    setRecentResolutions(computed.recentResolutions);
    setIsLoading(false);
    setLastUpdated(new Date());
  }, [incidents, isLoading]);

  // ── Electron mode: fetch from DB via IPC ──
  const fetchMetrics = useCallback(async () => {
    if (!isElectron) return;
    try {
      const res = await window.electronAPI.metrics.get();
      setMetrics(res);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Metrics fetch failed:', err);
    }
  }, []);

  const fetchCharts = useCallback(async () => {
    if (!isElectron) return;
    try {
      const [statusRes, priorityRes, deptRes] = await Promise.all([
        window.electronAPI.metrics.getStatusDistribution(),
        window.electronAPI.metrics.getPriorityBreakdown(),
        window.electronAPI.metrics.getDepartmentLoad(),
      ]);

      setStatusData(statusRes.map((item) => ({
        ...item,
        color: STATUS_COLORS[item.status] || DARK_THEME.textMuted,
      })));

      setPriorityData(priorityRes.map((item) => ({
        ...item,
        level: item.level.toUpperCase(),
        color: PRIORITY_COLORS[item.level] || DARK_THEME.textMuted,
      })));

      setDepartmentLoad(deptRes);
    } catch (err) {
      console.error('Charts fetch failed:', err);
    }
  }, []);

  const fetchResolutions = useCallback(async () => {
    if (!isElectron) return;
    try {
      const res = await window.electronAPI.metrics.getRecentResolutions();
      setRecentResolutions(res);
    } catch (err) {
      console.error('Resolutions fetch failed:', err);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    if (!isElectron) return;
    try {
      await Promise.all([fetchMetrics(), fetchCharts(), fetchResolutions()]);
    } catch (err) {
      console.error('Dashboard data fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchMetrics, fetchCharts, fetchResolutions]);

  useEffect(() => {
    if (!isElectron) return;

    fetchAll();

    const metricsInterval = setInterval(fetchMetrics, 10000);
    const chartsInterval = setInterval(fetchCharts, 30000);
    const resolutionsInterval = setInterval(fetchResolutions, 10000);

    intervalsRef.current = [metricsInterval, chartsInterval, resolutionsInterval];

    return () => {
      intervalsRef.current.forEach(clearInterval);
    };
  }, [fetchAll, fetchMetrics, fetchCharts, fetchResolutions]);

  // Immediate refresh when incident or department data changes via event bus
  useDataRefresh(useCallback((type) => {
    if (type === 'incidents' || type === 'departments') {
      if (isElectron) {
        fetchAll();
      }
      // Browser mode reacts automatically via the incidents prop
    }
  }, [fetchAll]));

  return {
    metrics,
    statusData,
    priorityData,
    departmentLoad,
    recentResolutions,
    isLoading,
    lastUpdated,
    refresh: isElectron ? fetchAll : () => {},
  };
}

export default useDashboardData;
