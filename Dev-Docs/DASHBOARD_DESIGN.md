# GHOST PROTOCOL — Design System v1.0.0

> **Dark Intelligence Theater — Visual Identity Documentation**
>
> This document captures the complete visual identity of Ghost Protocol
> as implemented in v1.0.0. All screens follow these specifications.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Component Patterns](#component-patterns)
5. [Animation System](#animation-system)
6. [Dialog & Modal Patterns](#dialog--modal-patterns)
7. [Scrollbar Styling](#scrollbar-styling)
8. [Z-Index Scale](#z-index-scale)

---

## Design Philosophy

Ghost Protocol embodies a **Dark Intelligence Theater** aesthetic — a
cinematic operations command center designed for IT specialists.

### Core Principles

- **Dark Atmospheric Depth**: Near-black backgrounds with blue undertones
- **Electric Cyan Accents**: All interactive elements use `#4FC3F7`
- **Military-Grade Precision**: Monospace typography for data and labels
- **Glass Morphism**: Frosted glass panels with subtle borders
- **Consistent Spacing**: 8px base unit throughout

---

## Color System

### DARK_THEME Palette

```javascript
const DARK_THEME = {
  // Backgrounds
  bg: '#050A18',              // Deep space black
  surface: '#0A1628',         // Panel backgrounds

  // Borders & Glows
  border: 'rgba(79, 195, 247, 0.2)',   // Subtle cyan border
  glow: 'rgba(79, 195, 247, 0.15)',    // Ambient glow effect

  // Brand Colors
  navy: '#1B2A6B',            // Deep navy for gradients
  electric: '#4FC3F7',        // Primary cyan accent
  electric2: '#00E5FF',       // Bright cyan highlights
  gold: '#C9A84C',            // Warning/pending state

  // Semantic Colors
  danger: '#EF4444',          // Errors, critical, delete actions
  success: '#10B981',         // Online status, confirmations
  warning: '#F59E0B',         // Warnings, high priority

  // Text Colors
  text: 'rgba(255, 255, 255, 0.9)',      // Primary text
  textMuted: 'rgba(79, 195, 247, 0.6)',  // Labels, secondary text

  // Utility
  gridLine: 'rgba(79, 195, 247, 0.06)',  // Background grid lines
};
```

### Color Usage Guidelines

| Element Type | Color | Notes |
|-------------|-------|-------|
| Page background | `bg` (#050A18) | Solid, never gradient |
| Panel background | `surface` (#0A1628) | Cards, modals, sidebars |
| Primary text | `text` | White at 90% opacity |
| Labels & secondary | `textMuted` | Cyan at 60% opacity |
| Interactive borders | `border` | Cyan at 20% opacity |
| Active/focused | `electric` | Full cyan #4FC3F7 |
| Success states | `success` | Green #10B981 |
| Error/delete | `danger` | Red #EF4444 |
| Warnings | `warning` | Orange #F59E0B |

### Danger/Delete Glow Effect

All destructive actions use a red glow border:

```javascript
{
  border: `1px solid ${DARK_THEME.danger}`,
  boxShadow: `0 0 20px rgba(239, 68, 68, 0.3), inset 0 0 20px rgba(239, 68, 68, 0.05)`,
}
```

---

## Typography

### Font Stack

```css
--font-heading: 'Rajdhani', sans-serif;    /* Titles, buttons */
--font-body: 'DM Sans', sans-serif;        /* Body text, inputs */
--font-mono: 'JetBrains Mono', monospace;  /* Data, labels, status */
```

### Typography Scale

| Element | Font | Size | Weight | Letter Spacing |
|---------|------|------|--------|----------------|
| Page titles | Rajdhani | 18-24px | 600-700 | 0.1em |
| Section labels | JetBrains Mono | 10-11px | 500 | 0.1-0.15em |
| Panel titles | JetBrains Mono | 10-11px | 400 | 0.1-0.15em |
| Data values | JetBrains Mono | 12-14px | 400 | normal |
| Button text | Rajdhani | 13-15px | 600 | 0.15-0.25em |
| Input text | DM Sans | 14px | 400 | normal |
| Input labels | JetBrains Mono | 10px | 500 | 0.15em |
| Table headers | JetBrains Mono | 10px | 500 | 0.1em |
| Badges | JetBrains Mono | 9-11px | 500-600 | 0.05em |

---

## Component Patterns

### Status Badge

```javascript
{
  padding: '4px 12px',
  backgroundColor: `${color}15`,        // 15% opacity
  border: `1px solid ${color}40`,       // 40% opacity
  borderRadius: '6px',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '11px',
  letterSpacing: '0.05em',
  color: color,
  fontWeight: 600,
}
```

### Priority Badge Colors

| Priority | Color | Hex |
|----------|-------|-----|
| Critical | danger | #EF4444 |
| High | warning | #F59E0B |
| Medium | electric | #4FC3F7 |
| Low | textMuted | rgba(79,195,247,0.6) |

### Input Field

```javascript
{
  width: '100%',
  height: '44px',
  backgroundColor: 'rgba(79, 195, 247, 0.04)',
  border: `1px solid ${isFocused ? DARK_THEME.electric : DARK_THEME.border}`,
  borderRadius: '8px',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '14px',
  color: DARK_THEME.text,
  padding: '0 16px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}
```

### Primary Button

```javascript
{
  height: '44px',
  background: `linear-gradient(135deg, ${DARK_THEME.navy}, #0A1628)`,
  border: `1px solid ${DARK_THEME.electric}`,
  borderRadius: '8px',
  fontFamily: 'Rajdhani, sans-serif',
  fontWeight: 600,
  fontSize: '14px',
  letterSpacing: '0.15em',
  color: DARK_THEME.electric,
  cursor: 'pointer',
}
```

### Danger Button

```javascript
{
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: `1px solid ${DARK_THEME.danger}`,
  color: DARK_THEME.danger,
}
```

### Card/Panel Container

```javascript
{
  backgroundColor: DARK_THEME.surface,
  border: `1px solid ${DARK_THEME.border}`,
  borderRadius: '12px',
  padding: '20px',
}
```

### Panel Accent Bar (Top Glow)

```javascript
{
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '4px',
  background: `linear-gradient(90deg, ${DARK_THEME.electric} 30%, transparent 100%)`,
  borderRadius: '12px 12px 0 0',
  opacity: 0.8,
}
```

---

## Animation System

### Framer Motion Patterns

**Modal Entry:**
```javascript
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.95 }}
transition={{ duration: 0.2 }}
```

**List Item Stagger:**
```javascript
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: index * 0.05 }}
```

**Button Tap:**
```javascript
whileTap={{ scale: 0.97 }}
```

**Hover Scale:**
```javascript
whileHover={{ scale: 1.02 }}
```

### CSS Animations

**Pulse (Status Indicators):**
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}
animation: pulse 2s ease-in-out infinite;
```

**Spin (Loading):**
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
animation: spin 1s linear infinite;
```

---

## Dialog & Modal Patterns

### Modal Backdrop

```javascript
{
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(5, 10, 24, 0.85)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 300,
}
```

### Modal Container

```javascript
{
  backgroundColor: DARK_THEME.surface,
  border: `1px solid ${DARK_THEME.border}`,
  borderRadius: '16px',
  maxHeight: '90vh',
  overflow: 'hidden',
  boxShadow: '0 0 60px rgba(79, 195, 247, 0.1)',
}
```

### Delete Confirmation Dialog

```javascript
{
  width: '480px',
  border: `1px solid ${DARK_THEME.danger}`,
  boxShadow: `0 0 30px rgba(239, 68, 68, 0.2), inset 0 0 30px rgba(239, 68, 68, 0.03)`,
}
```

### Notification Panel (KB Feedback)

```javascript
{
  position: 'absolute',
  top: '100%',
  right: 0,
  width: '380px',
  maxHeight: '500px',
  backgroundColor: DARK_THEME.surface,
  border: `1px solid ${DARK_THEME.border}`,
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  overflow: 'hidden',
}
```

---

## Scrollbar Styling

### Custom Scrollbar (Dark Theme)

```css
/* Webkit browsers */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(79, 195, 247, 0.05);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(79, 195, 247, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(79, 195, 247, 0.3);
}
```

### Inline Scrollbar Style (JSX)

```javascript
const scrollbarStyle = `
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: rgba(79, 195, 247, 0.15);
    border-radius: 3px;
  }
`;
```

---

## Z-Index Scale

```javascript
// Established z-index layers
1      // Base elements
10     // Elevated cards
100    // Dropdowns, tooltips
200    // Sticky headers, sidebars
300    // Modals, dialogs
400    // Toast notifications
500    // Tooltips over modals
1000   // Splash screen
```

### CSS Variables

```css
--z-base:      0;
--z-elevated:  10;
--z-dropdown:  100;
--z-sticky:    200;
--z-modal:     300;
--z-toast:     400;
--z-tooltip:   500;
--z-splash:    1000;
```

---

## File Structure

```
src/
├── constants/
│   └── theme.js              # DARK_THEME object
├── styles/
│   ├── variables.css         # CSS custom properties
│   └── globals.css           # Global styles, fonts
├── components/
│   ├── dashboard/            # 35 dashboard components
│   ├── shared/               # Shared components
│   └── ui/                   # Reusable UI components
├── hooks/                    # 11 custom hooks
└── pages/                    # 5 page components
```

---

> **GHOST PROTOCOL — DESIGN SYSTEM v1.0.0**
> **VISUAL IDENTITY LOCKED**
