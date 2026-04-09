# GHOST PROTOCOL — Project Conventions

This document defines the **law of the project**. All contributors must follow these conventions without exception. Consistency is the foundation of a legendary codebase.

---

## Naming Rules

### React Components
- **Always use PascalCase**
- Examples: `TicketRow`, `StatusBadge`, `PageWrapper`
- Never: `ticket-row`, `ticketRow`, `TICKET_ROW`

### Hooks
- **Use camelCase with `use` prefix**
- Examples: `useTickets`, `useAuth`, `useLocalStorage`
- Never: `UseTickets`, `use_tickets`

### CSS Classes
- **Use kebab-case**
- Examples: `ticket-card`, `status-badge`, `nav-item-active`
- Never: `ticketCard`, `TicketCard`

### Database Functions
- **Use camelCase with verb prefixes**
- Examples: `getAllTickets`, `updateTicketStatus`, `createTicket`, `deleteTicketById`
- Verbs: `get`, `create`, `update`, `delete`, `find`, `search`

### Constants
- **Use SCREAMING_SNAKE_CASE**
- Examples: `MAX_PRIORITY_LEVEL`, `DEFAULT_PAGE_SIZE`, `API_TIMEOUT_MS`
- Store in dedicated constant files or at the top of relevant modules

### File Names
- **Match the export name exactly**
- Component `TicketRow` → File `TicketRow.jsx`
- Hook `useTickets` → File `useTickets.js`
- Utility `formatters` → File `formatters.js`

---

## Component Rules

### Shared UI Elements
- Every reusable UI element lives in `components/ui/`
- Never duplicate UI components — import from the shared location
- Examples: `Button`, `Input`, `Badge`, `Card`, `Modal`, `Tooltip`

### Layout Components
- `Sidebar`, `TopBar`, and `PageWrapper` are used on **every page**
- Never rebuild these inline or create page-specific versions
- Modify the shared components if new features are needed globally

### Page Wrapper Requirement
- **Every page wraps its content inside `<PageWrapper>`**
- No exceptions — this ensures consistent layout, padding, and animations
- The `PageWrapper` handles page entry animations and scrolling behavior

### Props Destructuring
- Always destructure props at the top of every component
- Good: `const TicketRow = ({ ticket, onSelect, isActive }) => {}`
- Bad: `const TicketRow = (props) => { const ticket = props.ticket; }`

### No Inline Styles
- Use Tailwind classes or CSS variables only
- Never use the `style` prop for layout or theming
- Exception: Dynamic values that cannot be expressed in Tailwind (e.g., calculated positions)

---

## Import Order

Always organize imports in this exact sequence, separated by blank lines:

```jsx
// 1. React and hooks
import React, { useState, useEffect, useCallback } from 'react';

// 2. Third-party libraries
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Search, Filter, X } from 'lucide-react';

// 3. Components (shared first, then local)
import { Button, Card, Badge } from '@/components/ui';
import { PageWrapper, TopBar } from '@/components/shared';
import TicketFilters from './TicketFilters';

// 4. Hooks
import { useTickets } from '@/hooks/useTickets';
import { useAuth } from '@/hooks/useAuth';

// 5. Utils and constants
import { formatDate, formatTicketId } from '@/utils/formatters';
import { PRIORITY_LEVELS } from '@/constants';

// 6. Styles (if any local styles)
import './TicketList.css';
```

---

## State Management

### Local UI State
- Use `useState` inside the component
- Examples: modal open/closed, input values, hover states, local loading

### Shared App State
- Use Zustand store in `store/appStore.js`
- Examples: current user, theme preferences, global notifications, sidebar collapsed state
- Access via hooks: `const { user, setUser } = useAppStore()`

### Database Calls
- **Only inside custom hooks in `hooks/`**
- Never call database functions directly in components
- Hooks handle loading states, error handling, and data transformation
- Components remain pure UI logic

---

## Animation Rules

### Page Transitions
- **Framer Motion `AnimatePresence`**
- Wrap route content in `AnimatePresence` with `mode="wait"`
- Each page component includes entry/exit motion variants

### Micro-interactions
- **Framer Motion `motion.*` components**
- Hover effects, click feedback, toggle animations
- Use `whileHover`, `whileTap`, `animate` props

### Complex Timeline Animations
- **GSAP only**
- Splash screen sequence, multi-element orchestration
- Use `gsap.timeline()` for sequenced animations

### Critical Rule
- **Never mix CSS `transition` and Framer Motion on the same element**
- Choose one animation system per element
- CSS transitions: only for very simple, non-interactive state changes

---

## File Organization

### Components
```
components/
├── shared/      # Layout components used on every page
├── ui/          # Reusable UI primitives
├── tickets/     # Ticket-specific components
└── dashboard/   # Dashboard-specific components
```

### Pages
- One file per route
- Named exactly as the route: `Dashboard.jsx`, `Tickets.jsx`
- Always wrapped in `PageWrapper`

### Hooks
- One hook per file
- Named with `use` prefix: `useTickets.js`
- Export as named export matching filename

### Styles
- Global styles in `styles/globals.css`
- CSS variables in `styles/variables.css`
- Component-specific styles: Tailwind classes (preferred) or co-located CSS file

---

## Code Quality Standards

### No Magic Numbers
- Define all numeric values as named constants
- Bad: `if (priority > 2)`
- Good: `if (priority > PRIORITY_THRESHOLD)`

### Descriptive Variable Names
- Prefer clarity over brevity
- Bad: `const d = new Date()`
- Good: `const createdAt = new Date()`

### Early Returns
- Exit early for error cases and edge conditions
- Reduces nesting and improves readability

### Comments
- Only when the "why" is not obvious from the code
- Never comment the "what" — the code should be self-explanatory
- Use JSDoc for complex function signatures

---

## Git Commit Conventions

### Format
```
<type>: <short description>

[optional body]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `style`: UI/styling changes
- `refactor`: Code restructuring without behavior change
- `docs`: Documentation only
- `chore`: Maintenance tasks

### Examples
- `feat: add ticket priority filter`
- `fix: resolve sidebar collapse animation jitter`
- `style: update card shadow depth`

---

## Security Rules

### IPC Communication
- All Electron IPC channels must be explicitly defined in `preload.js`
- Never expose `require` or `process` to the renderer
- Validate all data crossing the IPC bridge

### User Input
- Sanitize all user inputs before database operations
- Use parameterized queries for SQLite
- Never construct SQL strings with concatenation

---

*This document is the law. When in doubt, refer here. When conventions conflict with deadlines, conventions win.*
