import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, BarChart3, TrendingUp, TrendingDown, Minus, Clock, Download, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import { exportReportsExcel, exportReportsPDF } from '@/utils/exportReports';
import DateRangeFilter from '@/components/dashboard/DateRangeFilter';
import { useToast } from '@/hooks/useToast';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import {
  DATE_PRESETS,
  getPresetDateRange,
  getDateRangeDescription,
  getTrendGrouping,
  generateTrendBuckets,
  toSQLiteDateTime,
  startOfDay,
  endOfDay,
} from '@/utils/dateRangeUtils';

// ═══════════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════════════

function LoadingSkeleton({ width = '100%', height = '20px', style = {} }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width,
        height,
        backgroundColor: DARK_THEME.border,
        borderRadius: '4px',
        ...style,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ReportPanel({ title, accentColor = DARK_THEME.electric, icon: Icon, rightContent, children, isLoading, style = {} }) {
  return (
    <div style={{
      backgroundColor: DARK_THEME.surface,
      border: `1px solid ${DARK_THEME.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}>
      <div style={{ height: '4px', background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)`, flexShrink: 0 }} />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        borderBottom: `1px solid ${DARK_THEME.border}`,
        backgroundColor: 'rgba(79, 195, 247, 0.02)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {Icon && (
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: `${accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={17} style={{ color: accentColor }} />
            </div>
          )}
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 500, letterSpacing: '0.15em', color: DARK_THEME.textMuted }}>
            {title}
          </span>
        </div>
        {rightContent}
      </div>
      <div style={{ padding: '24px', flex: 1, position: 'relative' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <LoadingSkeleton height="24px" width="60%" />
            <LoadingSkeleton height="16px" width="80%" />
            <LoadingSkeleton height="16px" width="70%" />
            <LoadingSkeleton height="16px" width="75%" />
          </div>
        ) : children}
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, color, icon: Icon, trend, isLoading }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? DARK_THEME.danger : trend === 'down' ? DARK_THEME.success : DARK_THEME.textMuted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '12px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ height: '4px', background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`, position: 'absolute', top: 0, left: 0, right: 0 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} style={{ color }} />
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.15em', color: DARK_THEME.textMuted }}>
              {label}
            </span>
          </div>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <LoadingSkeleton height="42px" width="80px" />
              <LoadingSkeleton height="14px" width="60px" />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '42px', fontWeight: 700, color, lineHeight: 1 }}>
                  {value}
                </span>
                {trend && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendIcon size={14} style={{ color: trendColor }} />
                  </div>
                )}
              </div>
              {subValue && (
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, display: 'block', marginTop: '8px' }}>
                  {subValue}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function HorizontalBarChart({ data }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {data.map((item, index) => (
        <div key={item.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: item.color }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: item.color }}>
                {item.label}
              </span>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '15px', fontWeight: 600, color: item.color }}>
              {item.count}
            </span>
          </div>
          <div style={{ height: '10px', backgroundColor: `${item.color}10`, borderRadius: '5px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.count / maxCount) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
              style={{
                height: '100%',
                backgroundColor: item.color,
                borderRadius: '5px',
                boxShadow: `0 0 10px ${item.color}40`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = 180;
    const center = size / 2;
    const outerRadius = 78;
    const innerRadius = 50;

    ctx.clearRect(0, 0, size, size);

    let startAngle = -Math.PI / 2;

    data.forEach((item) => {
      if (item.count === 0) return;
      const sliceAngle = (item.count / total) * 2 * Math.PI;

      ctx.beginPath();
      ctx.arc(center, center, outerRadius, startAngle, startAngle + sliceAngle);
      ctx.arc(center, center, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      startAngle += sliceAngle;
    });

    ctx.fillStyle = DARK_THEME.text;
    ctx.font = '700 28px Rajdhani';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), center, center - 6);

    ctx.fillStyle = DARK_THEME.textMuted;
    ctx.font = '400 10px JetBrains Mono';
    ctx.fillText('TOTAL', center, center + 14);
  }, [data, total]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
      <canvas ref={canvasRef} width={180} height={180} style={{ flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: item.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, flex: 1 }}>
                {item.label}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: item.color, fontWeight: 600, minWidth: '28px', textAlign: 'right' }}>
                {item.count}
              </span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                color: DARK_THEME.textMuted,
                padding: '2px 8px',
                backgroundColor: `${item.color}10`,
                borderRadius: '4px',
                minWidth: '36px',
                textAlign: 'center',
              }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrendChart({ data, maxValue }) {
  const chartHeight = 160;
  const totalCreated = data.reduce((sum, d) => sum + d.created, 0);
  const totalResolved = data.reduce((sum, d) => sum + d.resolved, 0);

  // Dynamic bar width based on number of buckets
  const barWidth = data.length > 14 ? 10 : data.length > 7 ? 14 : 18;

  return (
    <div>
      {/* Summary badges */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: `${DARK_THEME.electric}10`, border: `1px solid ${DARK_THEME.electric}25`, borderRadius: '8px' }}>
          <div style={{ width: '10px', height: '4px', backgroundColor: DARK_THEME.electric, borderRadius: '2px' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>CREATED</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 600, color: DARK_THEME.electric }}>{totalCreated}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: `${DARK_THEME.success}10`, border: `1px solid ${DARK_THEME.success}25`, borderRadius: '8px' }}>
          <div style={{ width: '10px', height: '4px', backgroundColor: DARK_THEME.success, borderRadius: '2px' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>RESOLVED</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 600, color: DARK_THEME.success }}>{totalResolved}</span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: data.length > 14 ? '8px' : '16px', height: chartHeight, overflowX: data.length > 20 ? 'auto' : 'visible' }}>
        {data.map((bucket, index) => (
          <div key={bucket.label + index} style={{ flex: data.length > 20 ? 'none' : 1, minWidth: data.length > 20 ? '40px' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: chartHeight - 28 }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${maxValue > 0 ? (bucket.created / maxValue) * 100 : 0}%` }}
                transition={{ duration: 0.6, delay: index * 0.04 }}
                style={{
                  width: `${barWidth}px`,
                  backgroundColor: DARK_THEME.electric,
                  borderRadius: '4px 4px 0 0',
                  minHeight: bucket.created > 0 ? '4px' : '0px',
                  boxShadow: `0 0 8px ${DARK_THEME.electric}30`,
                }}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${maxValue > 0 ? (bucket.resolved / maxValue) * 100 : 0}%` }}
                transition={{ duration: 0.6, delay: index * 0.04 + 0.1 }}
                style={{
                  width: `${barWidth}px`,
                  backgroundColor: DARK_THEME.success,
                  borderRadius: '4px 4px 0 0',
                  minHeight: bucket.resolved > 0 ? '4px' : '0px',
                  boxShadow: `0 0 8px ${DARK_THEME.success}30`,
                }}
              />
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: data.length > 14 ? '9px' : '12px', color: DARK_THEME.textMuted, fontWeight: 500, whiteSpace: 'nowrap' }}>
              {bucket.shortLabel || bucket.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN REPORTS PAGE
// ═══════════════════════════════════════════════════════════════════════════

const isElectron = typeof window !== 'undefined' && window.electronAPI?.reports;

function ReportsPage({ incidents, currentUser }) {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const toast = useToast();

  // Date range filter state
  const [dateFilter, setDateFilter] = useState({
    preset: DATE_PRESETS.ALL_TIME,
    startDate: null,
    endDate: null,
  });

  // Report data state
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const agentName = currentUser?.display_name || currentUser?.username || 'AGENT';

  // Fetch report data when filter changes
  const fetchReportData = useCallback(async () => {
    setIsLoading(true);

    try {
      // Determine actual date range
      let startDate = dateFilter.startDate;
      let endDate = dateFilter.endDate;

      if (dateFilter.preset !== DATE_PRESETS.CUSTOM && dateFilter.preset !== DATE_PRESETS.ALL_TIME) {
        const range = getPresetDateRange(dateFilter.preset);
        startDate = range.startDate;
        endDate = range.endDate;
      }

      // Generate trend buckets based on grouping
      const grouping = getTrendGrouping(dateFilter.preset, startDate, endDate);
      let trendBuckets = [];

      if (startDate && endDate) {
        trendBuckets = generateTrendBuckets(startDate, endDate, grouping);
      } else {
        // ALL TIME - generate monthly buckets for last 12 months
        const now = new Date();
        const start = new Date(now);
        start.setMonth(start.getMonth() - 11);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        trendBuckets = generateTrendBuckets(start, now, 'monthly');
      }

      // Convert buckets to SQLite format
      const sqlBuckets = trendBuckets.map((b) => ({
        ...b,
        start: toSQLiteDateTime(b.start),
        end: toSQLiteDateTime(b.end),
      }));

      if (isElectron) {
        // Use IPC to fetch filtered data
        const data = await window.electronAPI.reports.getStats({
          startDate: startDate ? toSQLiteDateTime(startDate) : null,
          endDate: endDate ? toSQLiteDateTime(endDate) : null,
          trendBuckets: sqlBuckets,
        });

        // Map priority data with colors
        const priorityColors = {
          CRITICAL: DARK_THEME.danger,
          HIGH: DARK_THEME.warning,
          MEDIUM: DARK_THEME.electric,
          LOW: DARK_THEME.success,
        };

        const priorityData = (data.priorityData || []).map((p) => ({
          label: p.label,
          count: p.count,
          color: priorityColors[p.label] || DARK_THEME.textMuted,
        }));

        // Ensure all priorities exist
        ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach((priority) => {
          if (!priorityData.find((p) => p.label === priority)) {
            priorityData.push({ label: priority, count: 0, color: priorityColors[priority] });
          }
        });

        // Sort by priority order
        priorityData.sort((a, b) => {
          const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
          return order.indexOf(a.label) - order.indexOf(b.label);
        });

        // Map status data with colors
        const statusColors = {
          NEW: DARK_THEME.electric,
          'IN PROGRESS': DARK_THEME.gold,
          ESCALATED: DARK_THEME.danger,
          RESOLVED: DARK_THEME.success,
          CLOSED: DARK_THEME.textMuted,
        };

        const statusData = (data.statusData || []).map((s) => ({
          label: s.label,
          count: s.count,
          color: statusColors[s.label] || DARK_THEME.textMuted,
        }));

        // Ensure all statuses exist
        ['NEW', 'IN PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED'].forEach((status) => {
          if (!statusData.find((s) => s.label === status)) {
            statusData.push({ label: status, count: 0, color: statusColors[status] });
          }
        });

        // Sort by status order
        statusData.sort((a, b) => {
          const order = ['NEW', 'IN PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED'];
          return order.indexOf(a.label) - order.indexOf(b.label);
        });

        setReportData({
          ...data,
          priorityData,
          statusData,
          trendData: data.trendData || [],
        });
      } else {
        // Fallback to client-side calculation from incidents prop
        const filteredIncidents = incidents.filter((inc) => {
          if (!startDate && !endDate) return true;
          const created = new Date(inc.created_at);
          if (startDate && created < startDate) return false;
          if (endDate && created > endDate) return false;
          return true;
        });

        const totalIncidents = filteredIncidents.length;
        const resolvedIncidents = filteredIncidents.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
        const openIncidents = totalIncidents - resolvedIncidents;
        const criticalOpen = filteredIncidents.filter((i) => i.priority === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length;
        const resolutionRate = totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0;

        // Calculate MTTR
        const resolvedWithTimestamps = filteredIncidents.filter((i) =>
          (i.status === 'resolved' || i.status === 'closed') && i.created_at
        );
        let avgResolveMinutes = 0;
        if (resolvedWithTimestamps.length > 0) {
          const totalMs = resolvedWithTimestamps.reduce((sum, inc) => {
            const created = new Date(inc.created_at).getTime();
            const resolved = inc.resolved_at ? new Date(inc.resolved_at).getTime() : Date.now();
            return sum + (resolved - created);
          }, 0);
          avgResolveMinutes = Math.round(totalMs / resolvedWithTimestamps.length / 60000);
        }

        const priorityData = [
          { label: 'CRITICAL', count: filteredIncidents.filter((i) => i.priority === 'critical').length, color: DARK_THEME.danger },
          { label: 'HIGH', count: filteredIncidents.filter((i) => i.priority === 'high').length, color: DARK_THEME.warning },
          { label: 'MEDIUM', count: filteredIncidents.filter((i) => i.priority === 'medium').length, color: DARK_THEME.electric },
          { label: 'LOW', count: filteredIncidents.filter((i) => i.priority === 'low').length, color: DARK_THEME.success },
        ];

        const statusData = [
          { label: 'NEW', count: filteredIncidents.filter((i) => !i.status || i.status === 'new').length, color: DARK_THEME.electric },
          { label: 'IN PROGRESS', count: filteredIncidents.filter((i) => i.status === 'in_progress').length, color: DARK_THEME.gold },
          { label: 'ESCALATED', count: filteredIncidents.filter((i) => i.status === 'escalated').length, color: DARK_THEME.danger },
          { label: 'RESOLVED', count: filteredIncidents.filter((i) => i.status === 'resolved').length, color: DARK_THEME.success },
          { label: 'CLOSED', count: filteredIncidents.filter((i) => i.status === 'closed').length, color: DARK_THEME.textMuted },
        ];

        // Generate trend data from buckets
        const trendData = trendBuckets.map((bucket) => {
          const created = filteredIncidents.filter((inc) => {
            const d = new Date(inc.created_at);
            return d >= bucket.start && d <= bucket.end;
          }).length;

          const resolved = filteredIncidents.filter((inc) => {
            if (!inc.resolved_at) return false;
            const d = new Date(inc.resolved_at);
            return d >= bucket.start && d <= bucket.end && (inc.status === 'resolved' || inc.status === 'closed');
          }).length;

          return {
            label: bucket.label,
            shortLabel: bucket.shortLabel,
            created,
            resolved,
          };
        });

        setReportData({
          totalIncidents,
          openIncidents,
          resolvedIncidents,
          criticalOpen,
          resolutionRate,
          avgResolveMinutes,
          priorityData,
          statusData,
          departmentLoad: [],
          recentResolutions: [],
          trendData,
        });
      }
    } catch (err) {
      console.error('[ReportsPage] Failed to fetch report data:', err);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
    // NOTE: `incidents` is intentionally excluded from dependencies.
    // It's only used in non-Electron fallback mode and including it causes
    // infinite re-fetch loops due to useIncidents polling creating new array refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  // Fetch on mount and filter change
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Immediate refresh when incident data changes via event bus
  useDataRefresh(useCallback((type) => {
    if (type === 'incidents') {
      fetchReportData();
    }
  }, [fetchReportData]));

  // Get description for current filter
  const rangeDescription = getDateRangeDescription(dateFilter.preset, dateFilter.startDate, dateFilter.endDate);
  const isFiltered = dateFilter.preset !== DATE_PRESETS.ALL_TIME;

  // Calculate max value for trend chart
  const maxTrend = reportData?.trendData?.length > 0
    ? Math.max(...reportData.trendData.flatMap((d) => [d.created, d.resolved]), 1)
    : 1;

  // Weekly summary from trend data
  const totalCreated = reportData?.trendData?.reduce((s, d) => s + d.created, 0) || 0;
  const totalResolved = reportData?.trendData?.reduce((s, d) => s + d.resolved, 0) || 0;
  const netChange = totalCreated - totalResolved;

  // Collect report data for export
  const getExportData = () => ({
    totalIncidents: reportData?.totalIncidents || 0,
    openIncidents: reportData?.openIncidents || 0,
    resolvedIncidents: reportData?.resolvedIncidents || 0,
    criticalOpen: reportData?.criticalOpen || 0,
    resolutionRate: reportData?.resolutionRate || 0,
    priorityData: reportData?.priorityData || [],
    statusData: reportData?.statusData || [],
    weeklyData: reportData?.trendData || [],
    avgResolveMinutes: reportData?.avgResolveMinutes || 0,
    dateRange: rangeDescription,
  });

  const handleExportExcel = async () => {
    if (!window.electronAPI?.export) {
      toast.error('Export requires Electron runtime');
      return;
    }
    setExportLoading(true);
    setShowExportDropdown(false);
    try {
      const result = await exportReportsExcel(getExportData(), agentName);
      if (result.success) {
        toast.success(`Exported to ${result.filePath.split(/[\\/]/).pop()}`);
      } else if (!result.canceled) {
        toast.error(result.error || 'Export failed');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!window.electronAPI?.export) {
      toast.error('Export requires Electron runtime');
      return;
    }
    setExportLoading(true);
    setShowExportDropdown(false);
    try {
      const result = await exportReportsPDF(getExportData(), agentName);
      if (result.success) {
        toast.success(`Exported to ${result.filePath.split(/[\\/]/).pop()}`);
      } else if (!result.canceled) {
        toast.error(result.error || 'Export failed');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: 'transparent' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '30px', fontWeight: 700, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 6px 0' }}>
            INCIDENT REPORTS
          </h1>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.textMuted }}>
            {isFiltered ? `ANALYTICS FOR: ${rangeDescription}` : 'ANALYTICS & PERFORMANCE METRICS'}
          </span>
        </div>

        {/* Export Button */}
        {window.electronAPI?.export && (
          <div style={{ position: 'relative' }}>
            <motion.button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={exportLoading || isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                backgroundColor: `${DARK_THEME.electric}10`,
                border: `1px solid ${DARK_THEME.electric}40`,
                borderRadius: '8px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: DARK_THEME.electric,
                cursor: exportLoading || isLoading ? 'not-allowed' : 'pointer',
                opacity: exportLoading || isLoading ? 0.6 : 1,
              }}
            >
              <Download size={14} style={{ animation: exportLoading ? 'spin 1s linear infinite' : 'none' }} />
              EXPORT
              <ChevronDown size={12} style={{ transform: showExportDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </motion.button>

            <AnimatePresence>
              {showExportDropdown && (
                <>
                  <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
                    onClick={() => setShowExportDropdown(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: DARK_THEME.surface,
                      border: `1px solid ${DARK_THEME.border}`,
                      borderRadius: '8px',
                      padding: '6px',
                      minWidth: '180px',
                      zIndex: 50,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    <button
                      onClick={handleExportExcel}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 14px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: DARK_THEME.text,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${DARK_THEME.electric}15`)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <FileSpreadsheet size={14} style={{ color: DARK_THEME.success }} />
                      EXPORT AS EXCEL
                    </button>
                    <button
                      onClick={handleExportPDF}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 14px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: DARK_THEME.text,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${DARK_THEME.electric}15`)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <FileText size={14} style={{ color: DARK_THEME.danger }} />
                      EXPORT AS PDF
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter value={dateFilter} onChange={setDateFilter} />

      {/* ── Row 1: KPI Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <StatCard
          label="TOTAL INCIDENTS"
          value={reportData?.totalIncidents ?? 0}
          subValue={rangeDescription}
          color={DARK_THEME.electric}
          icon={Activity}
          isLoading={isLoading}
        />
        <StatCard
          label="OPEN INCIDENTS"
          value={reportData?.openIncidents ?? 0}
          subValue={`${reportData?.criticalOpen ?? 0} critical`}
          color={DARK_THEME.warning}
          icon={AlertTriangle}
          trend={(reportData?.openIncidents ?? 0) > 0 ? 'up' : undefined}
          isLoading={isLoading}
        />
        <StatCard
          label="RESOLVED"
          value={reportData?.resolvedIncidents ?? 0}
          subValue="Completed"
          color={DARK_THEME.success}
          icon={CheckCircle}
          trend={(reportData?.resolvedIncidents ?? 0) > 0 ? 'down' : undefined}
          isLoading={isLoading}
        />
        <StatCard
          label="RESOLUTION RATE"
          value={`${reportData?.resolutionRate ?? 0}%`}
          subValue="Success rate"
          color={(reportData?.resolutionRate ?? 0) >= 70 ? DARK_THEME.success : (reportData?.resolutionRate ?? 0) >= 40 ? DARK_THEME.warning : DARK_THEME.danger}
          icon={BarChart3}
          isLoading={isLoading}
        />
      </div>

      {/* ── Row 2: Priority Breakdown + Status Donut ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <ReportPanel title="INCIDENTS BY PRIORITY" icon={BarChart3} accentColor={DARK_THEME.warning} isLoading={isLoading}>
          {reportData?.priorityData && <HorizontalBarChart data={reportData.priorityData} />}
        </ReportPanel>

        <ReportPanel title="INCIDENTS BY STATUS" icon={Activity} accentColor={DARK_THEME.electric} isLoading={isLoading}>
          {reportData?.statusData && <DonutChart data={reportData.statusData} />}
        </ReportPanel>
      </div>

      {/* ── Row 3: Trend Chart (full width) + MTTR side card ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
        <ReportPanel title="INCIDENT TREND" icon={TrendingUp} accentColor={DARK_THEME.success} isLoading={isLoading}>
          {reportData?.trendData && <TrendChart data={reportData.trendData} maxValue={maxTrend} />}
        </ReportPanel>

        {/* Side summary card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* MTTR */}
          <div style={{
            backgroundColor: DARK_THEME.surface,
            border: `1px solid ${DARK_THEME.border}`,
            borderRadius: '12px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}>
            <div style={{ height: '4px', background: `linear-gradient(90deg, ${DARK_THEME.gold} 0%, transparent 100%)`, position: 'absolute', top: 0, left: 0, right: 0 }} />
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: `${DARK_THEME.gold}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Clock size={22} style={{ color: DARK_THEME.gold }} />
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginBottom: '10px' }}>
              AVG. RESOLUTION TIME
            </span>
            {isLoading ? (
              <LoadingSkeleton height="40px" width="60px" />
            ) : (
              <>
                <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '40px', fontWeight: 700, color: DARK_THEME.gold, lineHeight: 1 }}>
                  {reportData?.avgResolveMinutes ?? 0}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, marginTop: '6px' }}>
                  MINUTES
                </span>
              </>
            )}
          </div>

          {/* Period summary */}
          <div style={{
            backgroundColor: DARK_THEME.surface,
            border: `1px solid ${DARK_THEME.border}`,
            borderRadius: '12px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ height: '4px', background: `linear-gradient(90deg, ${DARK_THEME.electric2} 0%, transparent 100%)`, position: 'absolute', top: 0, left: 0, right: 0 }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, display: 'block', marginBottom: '14px', marginTop: '4px' }}>
              PERIOD SUMMARY
            </span>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <LoadingSkeleton height="18px" />
                <LoadingSkeleton height="18px" />
                <LoadingSkeleton height="18px" />
              </div>
            ) : (
              [
                { label: 'Created', value: totalCreated, color: DARK_THEME.electric },
                { label: 'Resolved', value: totalResolved, color: DARK_THEME.success },
                { label: 'Net change', value: netChange, color: netChange > 0 ? DARK_THEME.danger : netChange < 0 ? DARK_THEME.success : DARK_THEME.textMuted },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${DARK_THEME.gridLine}` }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.textMuted }}>{row.label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 600, color: row.color }}>
                    {row.label === 'Net change' && row.value > 0 ? '+' : ''}{row.value}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default ReportsPage;
