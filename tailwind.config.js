/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base Colors
        base: '#FFFFFF',
        surface: {
          DEFAULT: '#F4F7FF',
          2: '#EBF0FF',
        },
        border: '#D0D9F0',

        // Brand Colors
        navy: {
          DEFAULT: '#1B2A6B',
          light: '#2A3F9F',
        },
        electric: {
          DEFAULT: '#4FC3F7',
          glow: 'rgba(79, 195, 247, 0.3)',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: 'rgba(201, 168, 76, 0.15)',
        },

        // Semantic Colors
        success: '#10B981',
        warning: '#F59E0B',
        danger: {
          DEFAULT: '#EF4444',
          glow: 'rgba(239, 68, 68, 0.2)',
        },

        // Text Colors
        'text-primary': '#0D1B4B',
        'text-secondary': '#4A5578',
        'text-muted': '#8892B0',

        // Glass Colors
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.72)',
          border: 'rgba(255, 255, 255, 0.9)',
        },
      },
      fontFamily: {
        heading: ['Rajdhani', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.4' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.5' }],
        lg: ['1.25rem', { lineHeight: '1.4' }],
        xl: ['1.5rem', { lineHeight: '1.3' }],
        '2xl': ['2rem', { lineHeight: '1.2' }],
        '3xl': ['3rem', { lineHeight: '1.1' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(27, 42, 107, 0.04)',
        md: '0 4px 12px rgba(27, 42, 107, 0.06)',
        lg: '0 8px 32px rgba(27, 42, 107, 0.08), 0 2px 8px rgba(27, 42, 107, 0.04)',
        xl: '0 16px 48px rgba(27, 42, 107, 0.12), 0 4px 16px rgba(27, 42, 107, 0.06)',
        glow: '0 0 20px rgba(79, 195, 247, 0.3)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.2)',
      },
      backdropBlur: {
        glass: '20px',
      },
      animation: {
        'pulse-critical': 'pulse-critical 2s infinite ease-in-out',
        'pulse-subtle': 'pulse-subtle 3s infinite ease-in-out',
      },
      keyframes: {
        'pulse-critical': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.2)',
            opacity: '1',
          },
          '50%': {
            boxShadow: '0 0 20px 4px rgba(239, 68, 68, 0.2)',
            opacity: '0.9',
          },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
        page: '600ms',
      },
      zIndex: {
        base: '0',
        elevated: '10',
        dropdown: '100',
        sticky: '200',
        modal: '300',
        toast: '400',
        tooltip: '500',
        splash: '1000',
      },
    },
  },
  plugins: [],
};
