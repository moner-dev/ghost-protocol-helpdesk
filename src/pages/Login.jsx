/**
 * GHOST PROTOCOL — Login Page (Dark Intelligence Theater)
 *
 * HOTFIX 6: Final Cleanup
 *
 * Features:
 * - Full screen world map with high-quality d3-geo projection (COMPLETELY STATIC)
 * - Vignette overlay for depth focus
 * - Asymmetrically positioned HUD panels
 * - Military-grade radar with ghost trail sweep
 * - System status panel with animated metrics
 * - Incident feed panel with scrolling logs
 * - Network traffic waveform panel (Canvas)
 * - Biometric scan panel with fingerprint
 * - Dark glass login card with enhanced glow
 * - Enhanced top intelligence bar with three sections
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, Mail, Copy, Check, KeyRound } from 'lucide-react';
import * as d3Geo from 'd3-geo';
import * as topojson from 'topojson-client';
import worldData from 'world-atlas/countries-110m.json';

import { useAuth } from '@/hooks/useAuth';
import { DARK_THEME } from '@/constants/theme';
import fingerprintImg from '@/assets/fp.jpg';
import WindowControls from '@/components/shared/WindowControls';

// Incident feed log entries
const INCIDENT_LOGS = [
  '[04:17:32] NODE_ALPHA >> CONNECTED',
  '[04:17:35] FIREWALL_LAYER_3 >> ACTIVE',
  '[04:17:38] AGENT_MONER >> LAST_SEEN: LOCAL',
  '[04:17:41] THREAT_SCAN >> RUNNING...',
  '[04:17:44] ENCRYPT_TUNNEL >> ESTABLISHED',
  '[04:17:47] DATABASE_SYNC >> OK',
  '[04:17:50] PACKET_LOSS >> 0.00%',
  '[04:17:53] PORT_8443 >> LISTENING',
  '[04:17:56] AUTH_MODULE >> STANDBY',
  '[04:17:59] VPN_LAYER >> BYPASSED',
  '[04:18:02] SENSOR_GRID >> ONLINE',
  '[04:18:05] ACCESS_LOG >> WRITING',
  '[04:18:08] PROTOCOL_CHECK >> PASSED',
  '[04:18:11] SYSTEM_LOAD >> 12%',
  '[04:18:14] GHOST_CORE >> OPERATIONAL',
];

// ============================================================
// HIGH-QUALITY WORLD MAP COMPONENT — COMPLETELY STATIC
// Uses higher detail rendering with land masses filled
// ============================================================
function WorldMapD3({ width, height }) {
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    if (!worldData) return;

    // Create Natural Earth projection - optimized for visibility
    const projection = d3Geo.geoNaturalEarth1()
      .scale(width / 4.5)
      .translate([width / 2, height / 2 + 30])
      .rotate([-10, 0]);

    const pathGenerator = d3Geo.geoPath().projection(projection);

    // Convert TopoJSON to GeoJSON - get land boundaries for cleaner look
    const countries = topojson.feature(worldData, worldData.objects.countries);
    const land = topojson.feature(worldData, worldData.objects.land);

    // Generate SVG paths
    const countryPaths = countries.features.map((feature, i) => ({
      d: pathGenerator(feature),
      id: `country-${i}`,
    })).filter(p => p.d);

    const landPath = land ? pathGenerator(land) : null;

    setPaths({ countries: countryPaths, land: landPath });
  }, [width, height]);

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Subtle grid overlay */}
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M 60 0 L 0 0 0 60"
            fill="none"
            stroke={DARK_THEME.electric}
            strokeWidth="0.3"
            opacity="0.08"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Land mass fill for better definition */}
      {paths.land && (
        <path
          d={paths.land}
          fill="rgba(79, 195, 247, 0.03)"
          stroke="none"
        />
      )}

      {/* Country borders with refined styling */}
      <g>
        {paths.countries?.map((path) => (
          <path
            key={path.id}
            d={path.d}
            fill="none"
            stroke={DARK_THEME.electric}
            strokeWidth="0.6"
            opacity="0.35"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* Graticule (lat/long lines) for geographic authenticity */}
      <g opacity="0.06">
        {Array.from({ length: 7 }, (_, i) => {
          const lat = -60 + i * 30;
          const projection = d3Geo.geoNaturalEarth1()
            .scale(width / 4.5)
            .translate([width / 2, height / 2 + 30])
            .rotate([-10, 0]);
          const points = [];
          for (let lon = -180; lon <= 180; lon += 5) {
            const [x, y] = projection([lon, lat]) || [0, 0];
            points.push(`${lon === -180 ? 'M' : 'L'} ${x} ${y}`);
          }
          return <path key={`lat-${i}`} d={points.join(' ')} fill="none" stroke={DARK_THEME.electric} strokeWidth="0.3" />;
        })}
      </g>
    </svg>
  );
}

// ============================================================
// MAP VIGNETTE OVERLAY
// ============================================================
function MapVignette() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, transparent 25%, rgba(5,10,24,0.7) 100%)',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
}

// ============================================================
// BLUR BACKDROP BEHIND CARD
// ============================================================
function CardBackdrop() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '700px',
        backgroundColor: 'rgba(5,10,24,0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    />
  );
}

// ============================================================
// PANEL ACCENT BAR (6px glowing left-edge)
// ============================================================
function PanelAccentBar() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '6px',
        background: `linear-gradient(90deg, ${DARK_THEME.electric} 30%, transparent 100%)`,
        borderRadius: '8px 8px 0 0',
        opacity: 0.8,
      }}
    />
  );
}

// ============================================================
// MILITARY-GRADE RADAR PANEL
// Asymmetric position: center-left area
// ============================================================
function RadarPanel() {
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const blipsRef = useRef([]);
  const [coordinates, setCoordinates] = useState({ lat: '52.3702N', lon: '4.8952E' });

  useEffect(() => {
    const interval = setInterval(() => {
      const lat = (Math.random() * 90).toFixed(4);
      const lon = (Math.random() * 180).toFixed(4);
      setCoordinates({
        lat: `${lat}${Math.random() > 0.5 ? 'N' : 'S'}`,
        lon: `${lon}${Math.random() > 0.5 ? 'E' : 'W'}`,
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 180;
    canvas.width = size;
    canvas.height = size;
    const center = size / 2;
    const radius = size / 2 - 12;

    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, size, size);

      // Draw range rings
      const rings = [
        { r: radius * 0.33, label: '250km' },
        { r: radius * 0.66, label: '500km' },
        { r: radius, label: '750km' },
      ];

      ctx.strokeStyle = DARK_THEME.electric;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.25;

      rings.forEach(ring => {
        ctx.beginPath();
        ctx.arc(center, center, ring.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw crosshairs
      ctx.beginPath();
      ctx.moveTo(center, center - radius);
      ctx.lineTo(center, center + radius);
      ctx.moveTo(center - radius, center);
      ctx.lineTo(center + radius, center);
      ctx.stroke();

      // Draw ghost trail (30 degrees fade)
      const tailLength = Math.PI / 6;
      for (let i = 0; i < 20; i++) {
        const angle = rotationRef.current - (i / 20) * tailLength;
        const opacity = 0.7 * (1 - i / 20);
        ctx.strokeStyle = DARK_THEME.electric;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = 2 - i * 0.08;
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(
          center + Math.cos(angle) * radius,
          center + Math.sin(angle) * radius
        );
        ctx.stroke();
      }

      // Draw main sweep line
      ctx.strokeStyle = DARK_THEME.electric;
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = DARK_THEME.electric;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(
        center + Math.cos(rotationRef.current) * radius,
        center + Math.sin(rotationRef.current) * radius
      );
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Generate blips
      if (Math.random() < 0.02) {
        const blipAngle = rotationRef.current + (Math.random() - 0.5) * 0.3;
        const blipDist = Math.random() * radius * 0.8 + radius * 0.1;
        blipsRef.current.push({
          x: center + Math.cos(blipAngle) * blipDist,
          y: center + Math.sin(blipAngle) * blipDist,
          life: 2,
          maxLife: 2,
        });
      }

      // Draw blips
      blipsRef.current = blipsRef.current.filter(blip => {
        blip.life -= 0.016;
        if (blip.life <= 0) return false;
        const alpha = blip.life / blip.maxLife;
        ctx.fillStyle = DARK_THEME.electric;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(blip.x, blip.y, 3, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      // Cardinal labels
      ctx.fillStyle = DARK_THEME.electric;
      ctx.font = '10px JetBrains Mono';
      ctx.globalAlpha = 0.6;
      ctx.textAlign = 'center';
      ctx.fillText('N', center, 14);
      ctx.fillText('S', center, size - 6);
      ctx.fillText('E', size - 10, center + 4);
      ctx.fillText('W', 10, center + 4);

      // Center dot
      ctx.fillStyle = DARK_THEME.electric;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(center, center, 4, 0, Math.PI * 2);
      ctx.fill();

      rotationRef.current += (Math.PI * 2) / (4 * 60);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: '160px',
        left: '150px',
        width: '220px',
        height: '290px',
        padding: '16px',
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '8px',
        boxShadow: `0 0 20px ${DARK_THEME.glow}`,
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      <PanelAccentBar />
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        color: DARK_THEME.textMuted,
        letterSpacing: '0.15em',
        marginTop: '8px',
        marginBottom: '8px',
      }}>
        TACTICAL RADAR
      </div>
      <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto 8px' }} />
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px',
        color: DARK_THEME.success,
        textAlign: 'center',
        marginBottom: '4px',
      }}>
        SCANNING NETWORK
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px',
        color: DARK_THEME.textMuted,
        textAlign: 'center',
      }}>
        {coordinates.lat} / {coordinates.lon}
      </div>
    </div>
  );
}

// ============================================================
// SYSTEM STATUS PANEL
// Asymmetric position: right side, vertically centered
// ============================================================
function SystemStatusPanel() {
  const [time, setTime] = useState(new Date());
  const [metrics, setMetrics] = useState([
    { name: 'FIREWALL', value: 98 },
    { name: 'ENCRYPTION', value: 100 },
    { name: 'VPN TUNNEL', value: 95 },
    { name: 'DATABASE', value: 97 },
    { name: 'AUTH SYS', value: 99 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(m => m.map(metric => ({
        ...metric,
        value: Math.max(95, Math.min(100, metric.value + (Math.random() - 0.5) * 2)),
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: '70px',
        right: '32px',
        width: '220px',
        height: '280px',
        padding: '18px',
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '8px',
        boxShadow: `0 0 20px ${DARK_THEME.glow}`,
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      <PanelAccentBar />
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '14px',
        color: DARK_THEME.electric,
        marginTop: '10px',
        marginBottom: '8px',
      }}>
        {time.toLocaleTimeString('en-US', { hour12: false })}
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        color: DARK_THEME.textMuted,
        letterSpacing: '0.1em',
        marginBottom: '12px',
      }}>
        SYSTEM STATUS
      </div>
      {metrics.map((metric, i) => (
        <div key={i} style={{ marginBottom: '8px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            color: DARK_THEME.textMuted,
            marginBottom: '4px',
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{metric.name}</span>
            <span style={{ color: DARK_THEME.success, flexShrink: 0 }}>{Math.round(metric.value)}%</span>
          </div>
          <div style={{
            height: '4px',
            backgroundColor: 'rgba(79, 195, 247, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${metric.value}%`,
              backgroundColor: DARK_THEME.success,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// INCIDENT FEED PANEL
// Asymmetric position: lower-left, offset from radar
// ============================================================
function IncidentFeedPanel() {
  const duplicatedLogs = [...INCIDENT_LOGS, ...INCIDENT_LOGS];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '90px',
        left: '44px',
        width: '190px',
        height: '202px',
        padding: '14px',
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '8px',
        boxShadow: `0 0 20px ${DARK_THEME.glow}`,
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      <PanelAccentBar />
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        color: DARK_THEME.textMuted,
        letterSpacing: '0.1em',
        marginTop: '8px',
        marginBottom: '6px',
      }}>
        INCIDENT FEED
      </div>
      <div style={{
        height: '110px',
        overflow: 'hidden',
        maskImage: 'linear-gradient(to bottom, transparent, black 10px, black calc(100% - 10px), transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10px, black calc(100% - 10px), transparent)',
      }}>
        <div style={{ animation: 'scrollUp 25s linear infinite' }}>
          {duplicatedLogs.map((log, i) => (
            <div key={i} style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              color: DARK_THEME.electric,
              opacity: 0.7,
              marginBottom: '5px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '155px',
            }}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NETWORK TRAFFIC PANEL
// Asymmetric position: bottom-right area
// ============================================================
function NetworkTrafficPanel() {
  const canvasRef = useRef(null);
  const offsetRef = useRef(0);
  const [inbound, setInbound] = useState(847);
  const [outbound, setOutbound] = useState(420);

  useEffect(() => {
    const interval = setInterval(() => {
      setInbound(Math.floor(800 + Math.random() * 100));
      setOutbound(Math.floor(400 + Math.random() * 50));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 185;
    canvas.height = 55;

    const baseline = canvas.height * 0.55;
    const beatLength = 90; // pixels per heartbeat cycle

    // Generate ECG heartbeat pattern (one complete cycle)
    const generateHeartbeat = (x) => {
      const pos = x % beatLength;
      const t = pos / beatLength;

      // Flat baseline
      if (t < 0.1) return baseline;
      // P wave (small bump)
      if (t < 0.18) {
        const p = (t - 0.1) / 0.08;
        return baseline - Math.sin(p * Math.PI) * 4;
      }
      // Back to baseline
      if (t < 0.25) return baseline;
      // Q dip (small down)
      if (t < 0.28) {
        const q = (t - 0.25) / 0.03;
        return baseline + Math.sin(q * Math.PI) * 3;
      }
      // R spike (sharp peak up)
      if (t < 0.35) {
        const r = (t - 0.28) / 0.07;
        return baseline - Math.sin(r * Math.PI) * 22;
      }
      // S dip (small down)
      if (t < 0.40) {
        const s = (t - 0.35) / 0.05;
        return baseline + Math.sin(s * Math.PI) * 5;
      }
      // Back to baseline
      if (t < 0.50) return baseline;
      // T wave (rounded bump)
      if (t < 0.65) {
        const tw = (t - 0.50) / 0.15;
        return baseline - Math.sin(tw * Math.PI) * 6;
      }
      // Flat baseline rest
      return baseline;
    };

    let animationId;
    let lastTime = 0;
    const speed = 0.4; // pixels per frame (slow, calm rhythm)

    const animate = (timestamp) => {
      animationId = requestAnimationFrame(animate);

      // Throttle to ~30fps for smoother appearance
      if (timestamp - lastTime < 33) return;
      lastTime = timestamp;

      offsetRef.current += speed;

      // Clear with near-black background
      ctx.fillStyle = 'rgba(5, 10, 24, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw fading trail effect (multiple lines with decreasing opacity)
      for (let trail = 3; trail >= 0; trail--) {
        const trailOffset = offsetRef.current - trail * 2;
        const alpha = 1 - trail * 0.25;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(79, 195, 247, ${alpha})`;
        ctx.lineWidth = trail === 0 ? 2 : 1.5 - trail * 0.3;
        ctx.shadowColor = trail === 0 ? DARK_THEME.electric : 'transparent';
        ctx.shadowBlur = trail === 0 ? 8 : 0;

        for (let x = 0; x <= canvas.width; x++) {
          const y = generateHeartbeat(x + trailOffset);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    };

    animate(0);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '275px',
        right: '340px',
        width: '220px',
        height: '125px',
        padding: '14px 16px',
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '8px',
        boxShadow: `0 0 20px ${DARK_THEME.glow}`,
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      <PanelAccentBar />
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        color: DARK_THEME.textMuted,
        marginTop: '8px',
        marginBottom: '8px',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>NET TRAFFIC</span>
        <span style={{ color: DARK_THEME.success, flexShrink: 0 }}>LIVE</span>
      </div>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div style={{
        marginTop: '6px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        color: DARK_THEME.textMuted,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>IN: {inbound}</span>
        <span>OUT: {outbound}</span>
      </div>
    </div>
  );
}

// ============================================================
// BIOMETRIC SCAN PANEL
// Uses actual fingerprint image with electric blue filter
// ============================================================
function BiometricPanel() {
  const [scanY, setScanY] = useState(0);
  const scanHeight = 200;

  useEffect(() => {
    const interval = setInterval(() => {
      setScanY(y => (y + 0.6) % scanHeight);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '32px',
        right: '55px',
        width: '220px',
        height: '300px',
        padding: '14px',
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '8px',
        boxShadow: `0 0 20px ${DARK_THEME.glow}`,
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      <PanelAccentBar />
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '9px',
        color: DARK_THEME.textMuted,
        letterSpacing: '0.12em',
        marginTop: '8px',
        marginBottom: '6px',
      }}>
        BIOMETRIC VERIFICATION
      </div>

      {/* Fingerprint scan container */}
      <div style={{
        position: 'relative',
        width: '160px',
        height: '200px',
        margin: '0 auto 10px',
        borderRadius: '10px',
        border: `1px solid ${DARK_THEME.border}`,
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 5, 15, 0.95)',
      }}>
        {/* Base fingerprint image - dim electric blue */}
        <img
          src={fingerprintImg}
          alt=""
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '140px',
            height: 'auto',
            filter: 'invert(1) sepia(1) saturate(5) hue-rotate(160deg) brightness(0.3)',
            opacity: 0.4,
          }}
        />

        {/* Highlighted fingerprint - clipped by scan position */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          clipPath: `polygon(0 ${Math.max(0, scanY - 25)}px, 100% ${Math.max(0, scanY - 25)}px, 100% ${scanY + 5}px, 0 ${scanY + 5}px)`,
        }}>
          <img
            src={fingerprintImg}
            alt=""
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '140px',
              height: 'auto',
              filter: 'invert(1) sepia(1) saturate(5) hue-rotate(160deg) brightness(1.2) drop-shadow(0 0 4px rgba(0, 229, 255, 0.8))',
              opacity: 1,
            }}
          />
        </div>

        {/* Corner brackets */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <g stroke={DARK_THEME.electric} strokeWidth="2" opacity="0.5">
            <path d="M 12 24 L 12 12 L 24 12" fill="none" />
            <path d="M 136 12 L 148 12 L 148 24" fill="none" />
            <path d="M 148 176 L 148 188 L 136 188" fill="none" />
            <path d="M 24 188 L 12 188 L 12 176" fill="none" />
          </g>
        </svg>

        {/* Scan line - bright glowing electric blue */}
        <div style={{
          position: 'absolute',
          top: scanY,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent 0%, ${DARK_THEME.electric2} 10%, ${DARK_THEME.electric2} 90%, transparent 100%)`,
          boxShadow: `0 0 6px 2px ${DARK_THEME.electric2}, 0 0 15px 4px rgba(0, 229, 255, 0.5), 0 0 30px 6px rgba(0, 229, 255, 0.2)`,
          zIndex: 10,
        }} />

        {/* Glow above scan line */}
        <div style={{
          position: 'absolute',
          top: scanY - 25,
          left: 0,
          right: 0,
          height: '28px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(0, 229, 255, 0.04) 60%, rgba(0, 229, 255, 0.1) 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Status display */}
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '9px',
        color: DARK_THEME.electric,
        textAlign: 'center',
        lineHeight: '1.5',
      }}>
        <div style={{ letterSpacing: '0.1em', opacity: 0.7 }}>ANALYZING RIDGE PATTERN</div>
        <div style={{ marginTop: '4px', color: DARK_THEME.success, letterSpacing: '0.1em', fontSize: '10px' }}>
          MATCH: 99.7%
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ENHANCED TOP INTELLIGENCE BAR
// ============================================================
function TopIntelligenceBar({ isMobile }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: isMobile ? '32px' : '36px',
        backgroundColor: 'rgba(5, 10, 24, 0.95)',
        borderBottom: `1px solid ${DARK_THEME.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 0 0 24px',
        zIndex: 200,
        WebkitAppRegion: 'drag',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', WebkitAppRegion: 'no-drag' }}>
        <div style={{
          width: isMobile ? '6px' : '8px',
          height: isMobile ? '6px' : '8px',
          borderRadius: '50%',
          backgroundColor: DARK_THEME.success,
          boxShadow: `0 0 8px ${DARK_THEME.success}`,
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: isMobile ? '8px' : '11px',
          letterSpacing: '0.15em',
          color: DARK_THEME.success,
        }}>
          {isMobile ? 'ONLINE' : 'SYSTEM ONLINE'}
        </span>
      </div>

      {!isMobile && (
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          letterSpacing: '0.15em',
          color: DARK_THEME.textMuted,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '600px',
        }}>
          MONER INTELLIGENCE — DAILY INCIDENT TRACKER // MONITORING ACTIVE
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', WebkitAppRegion: 'no-drag' }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: isMobile ? '12px' : '12px',
          letterSpacing: '0.1em',
          color: DARK_THEME.electric,
        }}>
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </span>
        <WindowControls />
      </div>
    </div>
  );
}

// ============================================================
// ANIMATED INPUT COMPONENT
// ============================================================
function AnimatedInput({
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  showToggle,
  showPassword,
  onTogglePassword,
  isFocused,
  onFocus,
  onBlur,
}) {
  const [scale, setScale] = useState(1);
  const hasContent = value.length > 0;

  const handleChange = (e) => {
    onChange(e);
    setScale(1.002);
    setTimeout(() => setScale(1), 150);
  };

  return (
    <motion.div
      style={{ position: 'relative' }}
      animate={{ scale }}
      transition={{ duration: 0.15 }}
    >
      <Icon
        size={16}
        style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: hasContent ? DARK_THEME.electric : DARK_THEME.textMuted,
          pointerEvents: 'none',
          transition: 'color 0.3s',
        }}
      />
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          width: '100%',
          height: '48px',
          backgroundColor: 'rgba(79, 195, 247, 0.04)',
          border: `1px solid ${isFocused ? DARK_THEME.electric : DARK_THEME.border}`,
          borderRadius: '6px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: DARK_THEME.text,
          padding: showToggle ? '0 48px' : '0 16px 0 48px',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: isFocused ? `0 0 0 3px ${DARK_THEME.glow}` : 'none',
        }}
      />
      {showToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            color: DARK_THEME.textMuted,
          }}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </motion.div>
  );
}

// ============================================================
// ANIMATED LABEL COMPONENT
// ============================================================
function AnimatedLabel({ children, isFocused }) {
  return (
    <motion.label
      animate={{ letterSpacing: isFocused ? '0.3em' : '0.2em' }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'block',
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 500,
        fontSize: '10px',
        color: DARK_THEME.textMuted,
        marginBottom: '8px',
      }}
    >
      {children}
    </motion.label>
  );
}

// ============================================================
// BUTTON LETTER COMPONENT
// ============================================================
function ButtonLetter({ letter, isHovered, delay }) {
  return (
    <motion.span
      animate={{ scale: isHovered ? [1, 1.05, 1] : 1 }}
      transition={{ duration: 0.2, delay: isHovered ? delay : 0 }}
      style={{ display: 'inline-block' }}
    >
      {letter}
    </motion.span>
  );
}

// ============================================================
// RECOVERY PANEL COMPONENT
// ============================================================
function RecoveryPanel({ onBack }) {
  const [activeTab, setActiveTab] = useState('username');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);

  const isElectron = typeof window !== 'undefined' && window.electronAPI?.auth?.recoverUsername;

  const resetState = () => {
    setResult(null);
    setError(null);
    setCopied(false);
    setShakeError(false);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setEmail('');
    setUsername('');
    resetState();
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerShake = () => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  const handleRecoverUsername = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    resetState();
    setIsLoading(true);
    try {
      if (isElectron) {
        const res = await window.electronAPI.auth.recoverUsername(email.trim());
        if (res.success) {
          setResult({ type: 'username', value: res.username });
        } else {
          setError(res.error);
          triggerShake();
        }
      } else {
        setError('Recovery requires Electron runtime');
        triggerShake();
      }
    } catch {
      setError('Recovery system unavailable');
      triggerShake();
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) return;
    resetState();
    setIsLoading(true);
    try {
      if (isElectron) {
        const res = await window.electronAPI.auth.resetPassword(username.trim(), email.trim());
        if (res.success) {
          setResult({ type: 'password', value: res.tempPassword });
        } else {
          setError(res.error);
          triggerShake();
        }
      } else {
        setError('Recovery requires Electron runtime');
        triggerShake();
      }
    } catch {
      setError('Recovery system unavailable');
      triggerShake();
    }
    setIsLoading(false);
  };

  const tabStyle = (isActive) => ({
    flex: 1,
    padding: '12px 0',
    background: 'none',
    border: 'none',
    borderBottom: `2px solid ${isActive ? DARK_THEME.electric : 'transparent'}`,
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '11px',
    letterSpacing: '0.1em',
    color: isActive ? DARK_THEME.electric : DARK_THEME.textMuted,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          letterSpacing: '0.1em',
          color: DARK_THEME.textMuted,
          cursor: 'pointer',
          padding: '0 0 20px 0',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = DARK_THEME.electric)}
        onMouseLeave={(e) => (e.currentTarget.style.color = DARK_THEME.textMuted)}
      >
        <ArrowLeft size={14} />
        BACK TO LOGIN
      </button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <KeyRound size={28} style={{ color: DARK_THEME.electric, marginBottom: '12px' }} />
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '22px', color: DARK_THEME.text }}>
          ACCOUNT RECOVERY
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginTop: '6px' }}>
          IDENTITY VERIFICATION REQUIRED
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${DARK_THEME.border}`, marginBottom: '28px' }}>
        <button onClick={() => switchTab('username')} style={tabStyle(activeTab === 'username')}>FORGOT USERNAME</button>
        <button onClick={() => switchTab('password')} style={tabStyle(activeTab === 'password')}>FORGOT PASSWORD</button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={shakeError ? { opacity: 1, y: 0, x: [-8, 8, -6, 6, -4, 4, 0] } : { opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === 'username' ? (
            <form onSubmit={handleRecoverUsername}>
              <div style={{ marginBottom: '24px' }}>
                <AnimatedLabel isFocused={emailFocused}>REGISTERED EMAIL</AnimatedLabel>
                <AnimatedInput
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); resetState(); }}
                  placeholder="Enter your email address"
                  icon={Mail}
                  isFocused={emailFocused}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </div>
              {!result && (
                <motion.button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%',
                    height: '48px',
                    background: `linear-gradient(135deg, ${DARK_THEME.navy}, #0A1628)`,
                    border: `1px solid ${DARK_THEME.electric}`,
                    borderRadius: '6px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 600,
                    fontSize: '15px',
                    letterSpacing: '0.25em',
                    color: DARK_THEME.electric,
                    cursor: isLoading || !email.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    opacity: !email.trim() ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {isLoading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> SEARCHING...</> : 'RECOVER USERNAME'}
                </motion.button>
              )}
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '20px' }}>
                <AnimatedLabel isFocused={usernameFocused}>AGENT IDENTIFIER</AnimatedLabel>
                <AnimatedInput
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); resetState(); }}
                  placeholder="Enter your username"
                  icon={User}
                  isFocused={usernameFocused}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <AnimatedLabel isFocused={emailFocused}>REGISTERED EMAIL</AnimatedLabel>
                <AnimatedInput
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); resetState(); }}
                  placeholder="Enter your email address"
                  icon={Mail}
                  isFocused={emailFocused}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </div>
              {!result && (
                <motion.button
                  type="submit"
                  disabled={isLoading || !username.trim() || !email.trim()}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%',
                    height: '48px',
                    background: `linear-gradient(135deg, ${DARK_THEME.navy}, #0A1628)`,
                    border: `1px solid ${DARK_THEME.electric}`,
                    borderRadius: '6px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 600,
                    fontSize: '15px',
                    letterSpacing: '0.25em',
                    color: DARK_THEME.electric,
                    cursor: isLoading || !username.trim() || !email.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    opacity: (!username.trim() || !email.trim()) ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {isLoading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> VERIFYING...</> : 'RESET PASSWORD'}
                </motion.button>
              )}
            </form>
          )}

          {/* Success Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: '20px',
                  padding: '20px',
                  backgroundColor: 'rgba(16, 185, 129, 0.06)',
                  border: `1px solid ${DARK_THEME.success}40`,
                  borderRadius: '8px',
                  boxShadow: `0 0 20px rgba(16, 185, 129, 0.1)`,
                }}
              >
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.success, marginBottom: '12px' }}>
                  {result.type === 'username' ? 'USERNAME RECOVERED' : 'TEMPORARY PASSWORD GENERATED'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <code style={{
                    flex: 1,
                    padding: '12px 16px',
                    backgroundColor: 'rgba(5, 10, 24, 0.8)',
                    border: `1px solid ${DARK_THEME.border}`,
                    borderRadius: '6px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: DARK_THEME.electric,
                    letterSpacing: '0.05em',
                  }}>
                    {result.value}
                  </code>
                  <motion.button
                    onClick={() => handleCopy(result.value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      width: '42px',
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: copied ? `${DARK_THEME.success}20` : 'rgba(79, 195, 247, 0.08)',
                      border: `1px solid ${copied ? DARK_THEME.success : DARK_THEME.border}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                  >
                    {copied ? <Check size={16} style={{ color: DARK_THEME.success }} /> : <Copy size={16} style={{ color: DARK_THEME.textMuted }} />}
                  </motion.button>
                </div>
                {result.type === 'password' && (
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.warning, marginTop: '12px', lineHeight: 1.6, letterSpacing: '0.05em' }}>
                    ⚠ THIS IS A TEMPORARY PASSWORD. CHANGE IT IMMEDIATELY AFTER LOGIN VIA SETTINGS.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                style={{
                  marginTop: '16px',
                  padding: '14px',
                  backgroundColor: 'rgba(239, 68, 68, 0.06)',
                  border: `1px solid ${DARK_THEME.danger}40`,
                  borderRadius: '6px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  color: DARK_THEME.danger,
                  textAlign: 'center',
                  boxShadow: `0 0 20px rgba(239, 68, 68, 0.1)`,
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// MAIN LOGIN COMPONENT
// ============================================================
function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();

  const [agentId, setAgentId] = useState('');
  const [clearanceCode, setClearanceCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [agentIdFocused, setAgentIdFocused] = useState(false);
  const [clearanceCodeFocused, setClearanceCodeFocused] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [showScanLine, setShowScanLine] = useState(false);
  const [scanLineComplete, setScanLineComplete] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [successScanLine, setSuccessScanLine] = useState(false);
  const [formFading, setFormFading] = useState(false);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [shakeCard, setShakeCard] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  const cardRef = useRef(null);
  const cardHeight = 520;

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowScanLine(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const success = await login(agentId, clearanceCode);

    if (success) {
      setLoginSuccess(true);
      setSuccessScanLine(true);
      setTimeout(() => setFormFading(true), 400);
      setTimeout(() => setIsExiting(true), 900);
      setTimeout(() => navigate('/'), 1400);
    } else {
      // Trigger shake animation via Framer Motion
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 500);
    }
  };

  const buttonText = loginSuccess ? 'ACCESS GRANTED' : 'INITIATE ACCESS';

  // Responsive breakpoints
  const isMobile = dimensions.width < 768;
  const isTablet = dimensions.width >= 768 && dimensions.width < 1200;
  const isDesktop = dimensions.width >= 1200;
  const isWideDesktop = dimensions.width >= 1500;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: DARK_THEME.bg,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Layer 1 — Static World Map (hidden on mobile) */}
      {!isMobile && <WorldMapD3 width={dimensions.width} height={dimensions.height} />}

      {/* Map Vignette Overlay (hidden on mobile) */}
      {!isMobile && <MapVignette />}

      {/* Blur Backdrop Behind Card (hidden on mobile) */}
      {!isMobile && <CardBackdrop />}

      {/* Layer 2 — Asymmetrically positioned HUD Panels (wide desktop only) */}
      {isWideDesktop && (
        <>
          <RadarPanel />
          <SystemStatusPanel />
          <IncidentFeedPanel />
          <NetworkTrafficPanel />
          <BiometricPanel />
        </>
      )}
      {isDesktop && !isWideDesktop && (
        <>
          <RadarPanel />
          <SystemStatusPanel />
          <IncidentFeedPanel />
          <BiometricPanel />
        </>
      )}

      {/* Enhanced Top Intelligence Bar */}
      <TopIntelligenceBar isMobile={isMobile} />

      {/* Threat Level Indicator (hidden on mobile) */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{
            position: 'absolute',
            bottom: 'calc(50% + 350px)',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 23px',
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '20px',
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                letterSpacing: '0.2em',
                color: DARK_THEME.danger,
              }}
            >
              The Best Helpdesk ever 
            </span>
          </div>
        </motion.div>
      )}

      {/* Layer 3 — Login Card */}
      <motion.div
        ref={cardRef}
        initial={{ y: 30, opacity: 0, x: 0 }}
        animate={
          isExiting
            ? { scale: 0, opacity: 0, x: 0 }
            : shakeCard
              ? { y: 0, opacity: 1, scale: 1, x: [-8, 8, -6, 6, -4, 4, 0] }
              : { y: 0, opacity: 1, scale: 1, x: 0 }
        }
        transition={
          shakeCard
            ? { duration: 0.4, ease: 'easeOut', x: { duration: 0.4 } }
            : {
                duration: isExiting ? 0.5 : 0.7,
                ease: isExiting ? 'easeIn' : 'easeOut',
                delay: isExiting ? 0 : 0.3,
              }
        }
        style={{
          position: 'relative',
          width: isMobile ? 'calc(100% - 32px)' : '450px',
          maxWidth: '450px',
          padding: isMobile ? '32px 24px' : '48px',
          background: isMobile ? DARK_THEME.bg : 'rgba(5, 10, 24, 0.9)',
          backdropFilter: isMobile ? 'none' : 'blur(20px)',
          WebkitBackdropFilter: isMobile ? 'none' : 'blur(20px)',
          borderRadius: isMobile ? '12px' : '16px',
          border: `1px solid ${DARK_THEME.border}`,
          boxShadow: isMobile
            ? `0 0 30px ${DARK_THEME.glow}`
            : loginSuccess
              ? '0 0 60px rgba(16, 185, 129, 0.2), 0 0 120px rgba(16, 185, 129, 0.1)'
              : '0 0 80px rgba(79,195,247,0.12), 0 0 160px rgba(79,195,247,0.06)',
          zIndex: 50,
          overflow: 'hidden',
          transition: 'box-shadow 0.3s',
        }}
      >
        {/* Animated Electric Border (hidden on mobile) */}
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              borderRadius: '18px',
              background: loginSuccess
                ? `conic-gradient(from 0deg, ${DARK_THEME.success}, transparent 60%, ${DARK_THEME.success})`
                : `conic-gradient(from 0deg, ${DARK_THEME.electric}, transparent 60%, ${DARK_THEME.electric})`,
              animation: 'rotateBorder 4s linear infinite',
              zIndex: -1,
            }}
          />
        )}
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              top: '1px',
              left: '1px',
              right: '1px',
              bottom: '1px',
              borderRadius: '15px',
              background: DARK_THEME.bg,
              zIndex: -1,
            }}
          />
        )}

        {/* Card Scan Line (hidden on mobile) */}
        <AnimatePresence>
          {!isMobile && (showScanLine && !scanLineComplete) && (
            <motion.div
              initial={{ y: 0, opacity: 0.8 }}
              animate={{ y: cardHeight }}
              transition={{ duration: 1.2, ease: 'linear' }}
              onAnimationComplete={() => setScanLineComplete(true)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                backgroundColor: DARK_THEME.electric,
                boxShadow: `0 0 12px 3px ${DARK_THEME.glow}`,
                zIndex: 100,
              }}
            />
          )}
        </AnimatePresence>

        {/* Success Scan Line (hidden on mobile) */}
        <AnimatePresence>
          {!isMobile && successScanLine && (
            <motion.div
              initial={{ y: 0, opacity: 0.8 }}
              animate={{ y: cardHeight }}
              transition={{ duration: 0.4, ease: 'linear' }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: DARK_THEME.success,
                boxShadow: '0 0 12px 3px rgba(16, 185, 129, 0.5)',
                zIndex: 100,
              }}
            />
          )}
        </AnimatePresence>

        {/* Slide between Login and Recovery */}
        <AnimatePresence mode="wait">
          {!showRecovery ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header Section */}
              <motion.div
                animate={{ opacity: formFading ? 0 : 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <ShieldCheck size={32} style={{ color: DARK_THEME.electric }} />
                <div
                  style={{
                    marginTop: '24px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 500,
                    fontSize: '11px',
                    letterSpacing: '0.35em',
                    color: DARK_THEME.textMuted,
                  }}
                >
                  SECURE TERMINAL ACCESS
                </div>
                <div
                  style={{
                    marginTop: '8px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700,
                    fontSize: isMobile ? '28px' : '36px',
                    color: DARK_THEME.text,
                    textShadow: isMobile ? 'none' : '0 0 30px rgba(79,195,247,0.4)',
                  }}
                >
                  GHOST PROTOCOL
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '1px',
                    backgroundColor: DARK_THEME.border,
                    marginTop: '24px',
                  }}
                />
              </motion.div>

              {/* Form Section */}
              <motion.form
                onSubmit={handleSubmit}
                animate={{ opacity: formFading ? 0 : 1 }}
                transition={{ duration: 0.3 }}
                style={{ marginTop: '32px' }}
              >
                <div style={{ marginBottom: '20px' }}>
                  <AnimatedLabel isFocused={agentIdFocused}>AGENT IDENTIFIER</AnimatedLabel>
                  <AnimatedInput
                    type="text"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    placeholder="Enter your agent ID"
                    icon={User}
                    isFocused={agentIdFocused}
                    onFocus={() => setAgentIdFocused(true)}
                    onBlur={() => setAgentIdFocused(false)}
                  />
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <AnimatedLabel isFocused={clearanceCodeFocused}>CLEARANCE CODE</AnimatedLabel>
                  <AnimatedInput
                    type={showPassword ? 'text' : 'password'}
                    value={clearanceCode}
                    onChange={(e) => setClearanceCode(e.target.value)}
                    placeholder="Enter clearance code"
                    icon={Lock}
                    showToggle
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    isFocused={clearanceCodeFocused}
                    onFocus={() => setClearanceCodeFocused(true)}
                    onBlur={() => setClearanceCodeFocused(false)}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading || loginSuccess}
                  whileTap={{ scale: 0.97 }}
                  onMouseEnter={() => setButtonHovered(true)}
                  onMouseLeave={() => setButtonHovered(false)}
                  className="access-button"
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '48px',
                    background: loginSuccess
                      ? DARK_THEME.success
                      : `linear-gradient(135deg, ${DARK_THEME.navy}, #0A1628)`,
                    border: `1px solid ${loginSuccess ? DARK_THEME.success : DARK_THEME.electric}`,
                    borderRadius: '6px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 600,
                    fontSize: '15px',
                    letterSpacing: '0.25em',
                    color: loginSuccess ? 'white' : DARK_THEME.electric,
                    cursor: isLoading || loginSuccess ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s',
                    opacity: isLoading ? 0.8 : 1,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                      animation: buttonHovered || isLoading || loginSuccess ? 'none' : 'shimmer 3s infinite',
                    }}
                  />
                  {isLoading ? (
                    <>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      AUTHENTICATING...
                    </>
                  ) : loginSuccess ? (
                    <>
                      <CheckCircle2 size={18} />
                      {buttonText.split('').map((letter, i) => (
                        <ButtonLetter key={i} letter={letter} isHovered={false} delay={i * 0.02} />
                      ))}
                    </>
                  ) : (
                    buttonText.split('').map((letter, i) => (
                      <ButtonLetter key={i} letter={letter === ' ' ? '\u00A0' : letter} isHovered={buttonHovered} delay={i * 0.02} />
                    ))
                  )}
                </motion.button>

                {/* Error message container - fixed height to prevent card resize */}
                <div style={{ position: 'relative', height: '32px', marginTop: '8px' }}>
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '11px',
                          color: DARK_THEME.danger,
                          textAlign: 'center',
                        }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.form>

              {/* Footer */}
              <motion.div
                animate={{ opacity: formFading ? 0 : 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  marginTop: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <button
                  onClick={() => navigate('/signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    letterSpacing: '0.1em',
                    color: DARK_THEME.textMuted,
                    cursor: 'pointer',
                    padding: '4px 0',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = DARK_THEME.electric)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = DARK_THEME.textMuted)}
                >
                  REQUEST NEW AGENT ACCESS →
                </button>
                <button
                  onClick={() => setShowRecovery(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    color: DARK_THEME.textMuted,
                    cursor: 'pointer',
                    padding: '4px 0',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = DARK_THEME.electric)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = DARK_THEME.textMuted)}
                >
                  ACCOUNT RECOVERY →
                </button>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '10px',
                    letterSpacing: '0.15em',
                    color: DARK_THEME.electric,
                    opacity: 0.5,
                  }}
                >
                  AUTHORIZED PERSONNEL ONLY
                </span>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="recovery"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
            >
              <RecoveryPanel onBack={() => setShowRecovery(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.7;
            }
          }

          @keyframes rotateBorder {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes shimmer {
            0% { left: -100%; }
            50%, 100% { left: 100%; }
          }

          @keyframes scrollUp {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }

          .access-button:hover {
            box-shadow: 0 0 20px ${DARK_THEME.glow}, 0 4px 20px rgba(79, 195, 247, 0.2);
          }

          input::placeholder {
            color: ${DARK_THEME.textMuted};
          }
        `}
      </style>
    </div>
  );
}

export default Login;
