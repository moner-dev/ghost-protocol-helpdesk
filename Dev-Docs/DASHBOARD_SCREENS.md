# GHOST PROTOCOL — Screen Architecture v1.0.0

> **Complete Page Reference for IT Intelligence Suite**
>
> This document defines all screens, their features, access controls,
> and key functionality as implemented in v1.0.0.

---

## Table of Contents

1. [Application Layout](#application-layout)
2. [Pages Overview](#pages-overview)
3. [Operations Overview (Dashboard)](#operations-overview-dashboard)
4. [Incident Management](#incident-management)
5. [Incident Edit Page](#incident-edit-page)
6. [Knowledge Base](#knowledge-base)
7. [End Users Management](#end-users-management)
8. [Company Departments](#company-departments)
9. [User Administration](#user-administration)
10. [Audit Log](#audit-log)
11. [Reports](#reports)
12. [Settings](#settings)
13. [Help Center](#help-center)
14. [Authentication Pages](#authentication-pages)

---

## Application Layout

### Main Dashboard Layout

```
┌────────────────────────────────────────────────────────────────┐
│                     TOP COMMAND BAR (48px)                      │
│  [● ONLINE]  GHOST PROTOCOL — {PAGE}  [METRICS]  [USER] [⏻]   │
├────────┬───────────────────────────────────────────┬───────────┤
│        │                                           │           │
│  LEFT  │          MAIN CONTENT AREA               │   RIGHT   │
│  NAV   │                                           │  ACTIVITY │
│ (72px) │          (Variable Width)                │  (320px)  │
│        │                                           │           │
│  ◉     │                                           │           │
│  ▣     │                                           │           │
│  ⚠     │                                           │           │
│  📚    │                                           │           │
│  👥    │                                           │           │
│  🏢    │                                           │           │
│  👤    │                                           │           │
│  📋    │                                           │           │
│  📊    │                                           │           │
│  ⚙     │                                           │           │
│  ?     │                                           │           │
└────────┴───────────────────────────────────────────┴───────────┘
```

### Navigation Items

| Icon | Label | Route | Access |
|------|-------|-------|--------|
| ◉ | Dashboard | `/dashboard` | All |
| ⚠ | Incidents | `/incidents` | All |
| 📚 | Knowledge Base | `/knowledge-base` | All |
| 👥 | End Users | `/end-users` | Operator+ |
| 🏢 | Company | `/company` | Admin+ |
| 👤 | Admin | `/admin` | Admin+ |
| 📋 | Audit Log | `/audit-log` | Admin+ |
| 📊 | Reports | `/reports` | All |
| ⚙ | Settings | `/settings` | All (restricted features) |
| ? | Help | `/help` | All |

---

## Pages Overview

| Page | Component | Access | Description |
|------|-----------|--------|-------------|
| Dashboard | `Dashboard.jsx` | All | Operations overview with metrics |
| Incidents | `IncidentsPage.jsx` | All | Incident list and management |
| Incident Edit | `IncidentEditPage.jsx` | Operator+ | Full incident editor |
| Knowledge Base | `KnowledgeBasePage.jsx` | All | Articles and feedback |
| End Users | `EndUsersPage.jsx` | Operator+ | Reporter management |
| Company | `CompanyManagementPage.jsx` | Admin+ | Department management |
| Admin | `AdminPage.jsx` | Admin+ | User administration |
| Audit Log | `AuditLogPage.jsx` | Admin+ | Operation history |
| Reports | `ReportsPage.jsx` | All | Analytics and export |
| Settings | `SettingsPage.jsx` | All | App settings, backup |
| Help | `HelpPage.jsx` | All | Documentation |

---

## Operations Overview (Dashboard)

**File:** `src/pages/Dashboard.jsx`

### Purpose
Real-time operations command center showing incident metrics, department load, and live activity feed.

### Access
All authenticated users

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  OPERATIONS OVERVIEW                                [Today ▼]│
├─────────────┬─────────────┬─────────────┬───────────────────┤
│   ACTIVE    │  CRITICAL   │  RESOLVED   │     PENDING       │
│     23      │      3      │     67      │       15          │
├─────────────┴─────────────┴─────────────┴───────────────────┤
│                                                              │
│  DEPARTMENT LOAD                                             │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐        │
│  │ IT OPS  │SECURITY │NETWORK  │HELPDESK │  DEV    │        │
│  │   23/30 │   12/15 │    8/20 │   34/40 │   11/25 │        │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘        │
├─────────────────────────────────────────────────────────────┤
│  LIVE ACTIVITY FEED                                          │
│  ● INC-2851  Server Down - Prod        CRITICAL  2 min ago  │
│  ● INC-2849  Database Timeout          HIGH      8 min ago  │
│  ● INC-2850  VPN Mass Outage           HIGH      5 min ago  │
└─────────────────────────────────────────────────────────────┘
```

### Features
- 4 metric cards: Active, Critical, Resolved Today, Pending
- Department Load bar chart with color-coded capacity
- Live Activity Feed with priority indicators
- Quick actions: View, Assign from feed
- Real-time updates via polling

### Components Used
- `TopCommandBar.jsx`
- `LeftNavSidebar.jsx`
- `MainOperationsArea.jsx`
- `RightActivityPanel.jsx`
- `DepartmentLoad.jsx`
- `MetricBadge.jsx`
- `IncidentCard.jsx`

---

## Incident Management

**File:** `src/components/dashboard/IncidentsPage.jsx`

### Purpose
Full incident list with filtering, bulk actions, and CRUD operations.

### Access
- **View:** All users
- **Create/Edit:** Operator, Admin, Owner
- **Delete:** Admin, Owner (with restrictions)

### Features

#### Filters
- Status dropdown (All, New, In Progress, Escalated, Resolved, Closed)
- Priority dropdown (All, Critical, High, Medium, Low)
- Department dropdown
- Search by title/ID
- Date range filter

#### Actions
- **New Incident** button (Operator+)
- **Bulk select** with checkbox
- **Bulk delete** (Admin+ only)
- Row click opens detail modal

#### Delete Rules
- Cannot delete incidents with status: `new`, `in_progress`, `escalated`
- Must be `resolved` or `closed` to delete
- Confirmation dialog with red glow border

### Modals
- `NewIncidentModal.jsx` — Create new incident
- `IncidentDetailModal.jsx` — View/quick edit
- `EditIncidentModal.jsx` — Full edit (legacy)

---

## Incident Edit Page

**File:** `src/pages/IncidentEditPage.jsx`

### Purpose
Full-featured incident editor with 3-column layout, tabs, and all management tools.

### Access
Operator, Admin, Owner

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← BACK    INC-2851                           [EDIT] [MORE] │
├─────────────────┬───────────────────────┬───────────────────┤
│                 │                       │                   │
│   LEFT PANEL    │    CENTER PANEL       │   RIGHT PANEL     │
│   (300px)       │    (Flexible)         │   (320px)         │
│                 │                       │                   │
│   Status        │    [Details] [Notes]  │   ON THIS PAGE    │
│   Priority      │    [Attachments]      │   - Section 1     │
│   Department    │                       │   - Section 2     │
│   Assignee      │    Title              │                   │
│   Reporter      │    Description        │   RELATED         │
│                 │    Affected Systems   │   INCIDENTS       │
│   QUICK         │    Tags               │                   │
│   ACTIONS       │                       │   HISTORY         │
│   - Escalate    │                       │   TIMELINE        │
│   - Resolve     │                       │                   │
│   - Close       │                       │                   │
│                 │                       │                   │
└─────────────────┴───────────────────────┴───────────────────┘
```

### Features

#### Left Panel
- Status badge with change dropdown
- Priority selector
- Department assignment
- Assignee with team member dropdown
- Reporter info card
- Quick action buttons (Escalate, Resolve, Close)

#### Center Panel (Tabs)
- **Details Tab:** Title, description, affected systems, tags
- **Notes Tab:** Internal comments with rich text
- **Attachments Tab:** File uploads, image preview

#### Right Panel
- On This Page navigation (smooth scroll)
- Related Incidents
- History Timeline (status changes, assignments)

### Status Actions
- **Resolve:** Requires resolution type and description
- **Close:** Requires reason
- **Escalate:** Marks as escalated status

---

## Knowledge Base

**File:** `src/components/dashboard/KnowledgeBasePage.jsx`

### Purpose
Article management system with categories, search, feedback, and notifications.

### Access
- **View:** All users
- **Create/Edit:** Operator, Admin, Owner
- **Delete:** Admin, Owner

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  KNOWLEDGE BASE                    [🔔 3]  [+ NEW ARTICLE]  │
├───────────────┬─────────────────────────────────────────────┤
│               │                                              │
│  CATEGORIES   │   ARTICLES LIST / ARTICLE VIEW              │
│  (240px)      │                                              │
│               │   ┌────────────────────────────────────┐    │
│  □ All (47)   │   │  How to Reset VPN Connection       │    │
│  □ Network    │   │  Category: Network  |  5 min read  │    │
│  □ Security   │   │  Last updated: 2 hours ago         │    │
│  □ Hardware   │   └────────────────────────────────────┘    │
│  □ Software   │                                              │
│  □ Email      │   ┌────────────────────────────────────┐    │
│  □ VPN        │   │  Password Reset Procedure          │    │
│               │   │  Category: Security  |  3 min read │    │
│  [+ Category] │   └────────────────────────────────────┘    │
│               │                                              │
└───────────────┴─────────────────────────────────────────────┘
```

### Features

#### Article List View
- Category filter sidebar
- Search by title/content
- Sort by date, title, views
- Article cards with preview

#### Article View
- Markdown rendering
- ON THIS PAGE sidebar (headings navigation)
- Feedback section (YES/NO helpful buttons)
- Report an Issue button
- Edit/Delete buttons (by role)

#### Feedback System
- YES/NO rating per article
- Issue reporting with type selection
- Reporter name (optional)

#### Notifications Bell
- Shows unread feedback count
- Dropdown panel with recent feedback
- Mark as read, Mark all read
- Clear individual notifications

### Modals
- Article editor (markdown)
- Category manager
- Issue report form

---

## End Users Management

**File:** `src/components/dashboard/EndUsersPage.jsx`

### Purpose
Manage external end users (reporters) who submit incidents.

### Access
Operator, Admin, Owner

### Features

#### List View
- Search by name, email, department, employee ID
- Filter: Active, Inactive, All
- Sort by name, email, incident count
- Bulk select for operations

#### End User Card
- Full name, email, phone
- Department, location
- Employee ID
- Incident count badge
- Active/Inactive status

#### CRUD Operations
- **Add End User** with validation
- **Edit** via detail modal
- **Deactivate/Reactivate** toggle
- **Delete** with incident reassignment

#### Delete with Reassignment
When deleting an end user with linked incidents:
1. Shows count of linked incidents
2. Option to reassign to another end user
3. Option to unassign (leave orphaned)
4. Confirmation with red glow dialog

### Modals
- `AddEndUserModal.jsx`
- `EndUserModal.jsx` (view/edit)
- Delete confirmation with reassignment

---

## Company Departments

**File:** `src/components/dashboard/CompanyManagementPage.jsx`

### Purpose
Manage company departments that incidents can be assigned to.

### Access
Admin, Owner

### Features

#### List View
- All departments with incident counts
- Active incident count per department
- Capacity indicator (current/max)

#### CRUD Operations
- **Add Department** with name, capacity
- **Edit** department details
- **Delete** with protection

#### Delete Protection
- Cannot delete department with active incidents
- Must reassign incidents first OR
- Confirm force delete (incidents become unassigned)
- Confirmation dialog shows affected incident count

### Modals
- `AddDepartmentModal.jsx`
- `DepartmentModal.jsx` (view/edit)
- Delete confirmation with reassignment options

---

## User Administration

**File:** `src/components/dashboard/AdminPage.jsx`

### Purpose
Manage application users, roles, and account status.

### Access
Admin, Owner

### Features

#### User List
- All registered users
- Search by name, email, username
- Filter by role, status, department
- Sort by name, role, created date

#### Role Hierarchy
| Role | Can Manage |
|------|------------|
| Owner | Admin, Operator, Viewer |
| Admin | Operator, Viewer |
| Operator | — |
| Viewer | — |

#### Account Status
- **Pending** — Awaiting approval
- **Approved** — Active account
- **Rejected** — Registration denied
- **Suspended** — Temporarily disabled

#### Actions
- Approve pending users
- Change user role (within hierarchy)
- Change user department
- Suspend/unsuspend
- Delete user (with confirmation)
- Reset password (generates temp password)

#### Protection Rules
- Owner cannot be deleted
- Owner cannot be demoted
- Cannot modify users of equal/higher role
- Cannot delete self

### Modals
- `DeleteUserDialog.jsx` — Confirmation with role check

---

## Audit Log

**File:** `src/components/dashboard/AuditLogPage.jsx`

### Purpose
Complete history of all sensitive operations for compliance and debugging.

### Access
- **View:** Admin, Owner
- **Export:** Admin, Owner
- **Delete:** Owner only

### Features

#### Filters
- Date range picker
- Event type dropdown
- Target type (user, incident, etc.)
- Performer filter
- Search by target name

#### Event Types Tracked
- `login_success`, `login_failed`
- `user_registered`, `user_approved`, `user_rejected`
- `user_role_changed`, `user_deleted`
- `incident_created`, `incident_updated`, `incident_deleted`
- `backup_created`, `backup_restored`
- `end_user_created`, `end_user_deleted`
- `department_created`, `department_deleted`

#### Export
- PDF export with date range
- Excel/CSV export

#### Delete
- Owner only
- Confirmation dialog
- Cannot be undone

### Components
- `AuditLogPanel.jsx` — Embedded panel version
- `DateRangeFilter.jsx` — Date picker

---

## Reports

**File:** `src/components/dashboard/ReportsPage.jsx`

### Purpose
Analytics dashboard with charts and export functionality.

### Access
All authenticated users

### Features

#### Charts
- Incidents by Status (donut chart)
- Incidents by Priority (bar chart)
- Incidents by Department (bar chart)
- Trend over time (line chart)

#### Metrics
- Total incidents
- Resolution rate
- Average resolution time
- Open vs closed ratio

#### Export
- **PDF Report** — Full analytics report
- **Excel Export** — Raw data spreadsheet
- Date range selection

### Libraries Used
- Chart rendering (custom SVG or library)
- PDF generation (jsPDF or similar)
- Excel generation (xlsx)

---

## Settings

**File:** `src/components/dashboard/SettingsPage.jsx`

### Purpose
Application settings, backup/restore, and system information.

### Access
- **View:** All users
- **Backup/Restore:** Owner only

### Sections

#### Profile Settings
- Display name (editable)
- Email (editable)
- Password change

#### Application Settings
- Theme (dark only currently)
- Notifications toggle
- Auto-refresh interval

#### Backup & Restore (Owner Only)
- **Create Backup** — Saves .db file
- **Restore Backup** — Select and restore
- **Backup List** — View/delete old backups
- **Export to JSON** — Human-readable export

#### System Information
- App version
- Database size
- User count
- Last backup date

#### Updates Section
- Current version display
- Check for updates button

---

## Help Center

**File:** `src/components/dashboard/HelpPage.jsx`

### Purpose
Documentation, keyboard shortcuts, and system architecture.

### Access
All authenticated users

### Sections

#### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | New Incident |
| `Ctrl + K` | Search |
| `Ctrl + /` | Help |
| `Esc` | Close modal |

#### System Architecture
- Overview of app structure
- Database schema summary
- API reference

#### RBAC Documentation
- Role permissions table
- Hierarchy explanation

#### Built By Section
```
BUILT BY
M. O. N. E. R
Application Developer & AI Specialist
```

---

## Authentication Pages

### Login Page

**File:** `src/pages/Login.jsx`

#### Features
- Username/password form
- Remember me option
- Show/hide password toggle
- Error messages with shake animation
- Link to signup
- Cinematic dark theme

#### Security
- bcrypt password verification
- Session stored in sessionStorage
- Auto-logout on app close

### Signup Page

**File:** `src/pages/Signup.jsx`

#### Features
- Full registration form
- Department selection
- Password requirements display
- Terms acceptance
- Account pending notice

#### Flow
1. User submits registration
2. Account created with `pending` status
3. Admin must approve in User Administration
4. User can login after approval

### Splash Screen

**File:** `src/pages/SplashScreen.jsx`

#### Features
- GSAP animated boot sequence (2 seconds)
- "GHOST PROTOCOL SYSTEMS" branding
- Scan line animation
- Click anywhere to skip
- Auto-navigates to `/login`

---

## Hooks Reference

| Hook | Purpose |
|------|---------|
| `useAuth.js` | Authentication state and methods |
| `useCompanyDepartments.js` | Department data management |
| `useDashboardData.js` | Dashboard metrics and polling |
| `useDataRefresh.js` | Auto-refresh trigger |
| `useEndUsers.js` | End user CRUD operations |
| `useIncidents.js` | Incident data and operations |
| `useKnowledgeBase.js` | KB articles and feedback |
| `useTickets.js` | Legacy ticket hook |
| `useToast.js` | Toast notifications |
| `useUsers.js` | User management |

---

## Component Count

| Directory | Count |
|-----------|-------|
| `src/components/dashboard/` | 35 components |
| `src/hooks/` | 11 hooks |
| `src/pages/` | 5 pages |

---

> **GHOST PROTOCOL — SCREEN ARCHITECTURE v1.0.0**
> **ALL PAGES DOCUMENTED**
