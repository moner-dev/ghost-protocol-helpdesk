/**
 * GHOST PROTOCOL — SplashScreen Page
 *
 * Cinematic boot sequence with GSAP timeline animations.
 * Auto-navigates to /login after 2 seconds. Click anywhere to skip.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import WindowControls from '@/components/shared/WindowControls';

function SplashScreen() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const hasNavigated = useRef(false);

  // Skip handler — click anywhere to skip
  const handleSkip = () => {
    if (!hasNavigated.current) {
      hasNavigated.current = true;
      navigate('/login');
    }
  };

  // Refs for animated elements
  const containerRef = useRef(null);
  const gridRef = useRef(null);
  const cornerTLRef = useRef(null);
  const cornerTRRef = useRef(null);
  const cornerBLRef = useRef(null);
  const cornerBRRef = useRef(null);
  const statusBarRef = useRef(null);
  const corporationRef = useRef(null);
  const ghostLettersRef = useRef([]);
  const protocolLettersRef = useRef([]);
  const dividerRef = useRef(null);
  const subtitleRef = useRef(null);
  const scanLineRef = useRef(null);
  const flashOverlayRef = useRef(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // GSAP Timeline Animation
  useEffect(() => {
    const tl = gsap.timeline();

    // Initial states
    gsap.set([cornerTLRef.current, cornerTRRef.current, cornerBLRef.current, cornerBRRef.current], {
      scale: 0,
      opacity: 0,
    });
    gsap.set(statusBarRef.current, { opacity: 0 });
    gsap.set(corporationRef.current, { opacity: 0 });
    gsap.set(ghostLettersRef.current, { y: 40, opacity: 0 });
    gsap.set(protocolLettersRef.current, { y: 40, opacity: 0 });
    gsap.set(dividerRef.current, { width: 0, opacity: 1 });
    gsap.set(subtitleRef.current, { opacity: 0 });
    gsap.set(scanLineRef.current, { y: -10, opacity: 0 });
    gsap.set(flashOverlayRef.current, { opacity: 0 });

    // Animate grid continuously
    gsap.to(gridRef.current, {
      backgroundPositionY: '-=40px',
      duration: 2,
      repeat: -1,
      ease: 'none',
    });

    // t=0.0s → Corner brackets snap in
    tl.to([cornerTLRef.current, cornerTRRef.current, cornerBLRef.current, cornerBRRef.current], {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: 'elastic.out(1, 0.5)',
      stagger: 0.02,
    }, 0);

    // t=0.1s → Status bar fades in
    tl.to(statusBarRef.current, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    }, 0.1);

    // t=0.2s → "GHOST PROTOCOL SYSTEMS" fades in
    tl.to(corporationRef.current, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    }, 0.2);

    // t=0.3s → "GHOST" letters stagger in
    tl.to(ghostLettersRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.4,
      ease: 'power3.out',
      stagger: 0.03,
    }, 0.3);

    // t=0.5s → "PROTOCOL" letters stagger in
    tl.to(protocolLettersRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.4,
      ease: 'power3.out',
      stagger: 0.03,
    }, 0.5);

    // t=0.7s → Divider line draws outward
    tl.to(dividerRef.current, {
      width: 120,
      duration: 0.3,
      ease: 'power2.out',
    }, 0.7);

    // t=0.8s → Subtitle line fades in
    tl.to(subtitleRef.current, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    }, 0.8);

    // t=0.9s → Scanning line begins sweep top to bottom
    tl.to(scanLineRef.current, {
      opacity: 0.6,
      duration: 0.1,
    }, 0.9);
    tl.to(scanLineRef.current, {
      y: '100vh',
      duration: 0.9,
      ease: 'none',
    }, 0.9);

    // t=1.8s → White flash overlay
    tl.to(flashOverlayRef.current, {
      opacity: 1,
      duration: 0.2,
      ease: 'power2.in',
    }, 1.8);

    // t=2.0s → Navigate to /login
    tl.call(() => {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        navigate('/login');
      }
    }, [], 2.0);

    return () => {
      tl.kill();
    };
  }, [navigate]);

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Split text into individual letter spans
  const renderLetters = (text, refsArray) => {
    return text.split('').map((letter, index) => (
      <span
        key={index}
        ref={(el) => (refsArray.current[index] = el)}
        style={{ display: 'inline-block' }}
      >
        {letter}
      </span>
    ));
  };

  return (
    <div
      ref={containerRef}
      onClick={handleSkip}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--color-base)',
        overflow: 'hidden',
        zIndex: 'var(--z-splash)',
        cursor: 'pointer',
      }}
    >
      {/* Window Controls - Top Right */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          zIndex: 300,
          WebkitAppRegion: 'drag',
        }}
      >
        <div style={{ WebkitAppRegion: 'no-drag' }}>
          <WindowControls />
        </div>
      </div>

      {/* Layer 1 — Topographic Background (6% opacity) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg fill='none' stroke='%231B2A6B' stroke-width='0.5'%3E%3Cpath d='M0 50 Q 50 30, 100 50 T 200 50'/%3E%3Cpath d='M0 70 Q 50 50, 100 70 T 200 70'/%3E%3Cpath d='M0 90 Q 50 110, 100 90 T 200 90'/%3E%3Cpath d='M0 110 Q 50 90, 100 110 T 200 110'/%3E%3Cpath d='M0 130 Q 50 150, 100 130 T 200 130'/%3E%3Cpath d='M0 150 Q 50 130, 100 150 T 200 150'/%3E%3Ccircle cx='30' cy='40' r='15'/%3E%3Ccircle cx='30' cy='40' r='25'/%3E%3Ccircle cx='170' cy='160' r='20'/%3E%3Ccircle cx='170' cy='160' r='30'/%3E%3Ccircle cx='100' cy='100' r='35'/%3E%3Ccircle cx='100' cy='100' r='45'/%3E%3Ccircle cx='100' cy='100' r='55'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 2 — Animated Grid */}
      <div
        ref={gridRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.04,
          backgroundImage: `
            linear-gradient(to right, var(--color-navy) 1px, transparent 1px),
            linear-gradient(to bottom, var(--color-navy) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 3 — Corner Brackets */}
      {/* Top Left */}
      <div
        ref={cornerTLRef}
        style={{
          position: 'absolute',
          top: '40px',
          left: '40px',
          width: '60px',
          height: '60px',
          borderLeft: '2px solid var(--color-navy)',
          borderTop: '2px solid var(--color-navy)',
        }}
      />
      {/* Top Right */}
      <div
        ref={cornerTRRef}
        style={{
          position: 'absolute',
          top: '40px',
          right: '40px',
          width: '60px',
          height: '60px',
          borderRight: '2px solid var(--color-navy)',
          borderTop: '2px solid var(--color-navy)',
        }}
      />
      {/* Bottom Left */}
      <div
        ref={cornerBLRef}
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '40px',
          width: '60px',
          height: '60px',
          borderLeft: '2px solid var(--color-navy)',
          borderBottom: '2px solid var(--color-navy)',
        }}
      />
      {/* Bottom Right */}
      <div
        ref={cornerBRRef}
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '40px',
          width: '60px',
          height: '60px',
          borderRight: '2px solid var(--color-navy)',
          borderBottom: '2px solid var(--color-navy)',
        }}
      />

      {/* Layer 4 — Center Logo Block */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Corporation text */}
        <div
          ref={corporationRef}
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: '13px',
            letterSpacing: '0.4em',
            color: 'var(--color-text-muted)',
            marginBottom: '16px',
          }}
        >
          GHOST PROTOCOL SYSTEMS
        </div>

        {/* GHOST text */}
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '88px',
            letterSpacing: '0.15em',
            color: 'var(--color-navy)',
            lineHeight: 1,
          }}
        >
          {renderLetters('GHOST', ghostLettersRef)}
        </div>

        {/* PROTOCOL text */}
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '88px',
            letterSpacing: '0.15em',
            color: 'var(--color-navy)',
            lineHeight: 1,
            marginTop: '-8px',
          }}
        >
          {renderLetters('PROTOCOL', protocolLettersRef)}
        </div>

        {/* Divider line */}
        <div
          ref={dividerRef}
          style={{
            height: '1px',
            backgroundColor: 'var(--color-electric)',
            marginTop: '24px',
            marginBottom: '20px',
          }}
        />

        {/* Subtitle */}
        <div
          ref={subtitleRef}
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 400,
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: 'var(--color-text-muted)',
          }}
        >
          IT INTELLIGENCE SUITE // SECURE ACCESS ONLY
        </div>
      </div>

      {/* Layer 5 — Scanning Line */}
      <div
        ref={scanLineRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          backgroundColor: 'var(--color-electric)',
          boxShadow: '0 0 20px 4px var(--color-electric-glow)',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 6 — Bottom Status Bar */}
      <div
        ref={statusBarRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40px',
          backgroundColor: 'rgba(27, 42, 107, 0.06)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-success)',
          }}
        >
          SYSTEM STATUS: OPERATIONAL
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
          }}
        >
          GHOST PROTOCOL // SYSTEM INITIALIZATION
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
          }}
        >
          {formatDate(currentTime)} {formatTime(currentTime)}
        </span>
      </div>

      {/* Layer 7 — Exit Flash Overlay */}
      <div
        ref={flashOverlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--color-base)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default SplashScreen;
