# GHOST PROTOCOL

**IT Intelligence Suite v1.0.0**

Full-featured IT Helpdesk desktop application built with modern web technologies.

Built by **M. O. N. E. R** — Application Developer & AI Specialist

---

## Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, GSAP |
| **Backend** | Electron, SQLite (better-sqlite3) |
| **State** | Zustand, React Hooks |
| **Auth** | bcryptjs, RBAC (Role-Based Access Control) |

---

## Features

- **Incident Management** — Full CRUD operations with status tracking, assignments, and resolution workflow
- **Knowledge Base** — Article management with markdown editor, categories, and search
- **End Users Management** — Track reporters with ticket reassignment on delete
- **Company Departments** — Organize departments with incident reassignment protection
- **User Administration** — RBAC with 4 roles: OWNER, ADMIN, OPERATOR, VIEWER
- **Audit Log** — Full operation tracking for compliance and security
- **Reports & Analytics** — Dashboard metrics with PDF/Excel export
- **Backup & Restore** — Database backup system (OWNER only)
- **KB Feedback System** — YES/NO rating + Report an Issue functionality
- **Notifications** — Real-time KB feedback notifications bell
- **Real-time Dashboard** — Department load chart and incident metrics

---

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| **OWNER** | `pro` | `Ghost2026` |
| **ADMIN** | `admin` | `Ghost2026` |

---

## System Requirements

| Requirement | Specification |
|-------------|---------------|
| **OS** | Windows 10 or later |
| **Resolution** | 1920x1080 recommended |
| **Display Scaling** | 100% |
| **Disk Space** | ~200 MB |

---

## Prerequisites (Development)

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | 18.x or later | https://nodejs.org/ |
| **npm** | 9.x or later | Included with Node.js |
| **Git** | Any recent version | https://git-scm.com/ |
| **Inno Setup 6** | 6.x (for building installer) | https://jrsoftware.org/isdl.php |

### Inno Setup PATH Setup

After installing Inno Setup, add it to your system PATH:

1. Find your Inno Setup install folder (default: `C:\Program Files (x86)\Inno Setup 6`)
2. Open **System Properties** > **Environment Variables**
3. Under **System variables**, select `Path` and click **Edit**
4. Click **New** and add: `C:\Program Files (x86)\Inno Setup 6`
5. Click **OK** and restart your terminal

Verify with:
```bash
iscc /?
```

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd ghost-protocol
```

### 2. Install dependencies

```bash
npm install
```

---

## Development

### Start with Electron (full app)

```bash
npm run electron:dev
```

Launches the Vite dev server and opens the Electron window with hot reload. The SQLite database is created automatically in `%APPDATA%\ghost-protocol\`.

### Start the dev server (browser only)

```bash
npm run dev
```

Opens the React app at http://localhost:5173 (no Electron shell, no database).

### Preview a production build locally

```bash
npm run electron:preview
```

Builds the Vite bundle and runs it inside Electron without packaging.

---

## Building

### Step 1: Build the Vite bundle

```bash
npm run build
```

Compiles the React app into the `dist/` folder.

### Step 2: Package with Electron Builder

```bash
npm run electron:build
```

Runs `vite build` and then `electron-builder --win`. Output goes to:

```
release/
  win-unpacked/                    <- Portable app
  GHOST PROTOCOL-1.0.0-Setup.exe   <- NSIS installer
```

### Step 3: Build the Inno Setup installer

```bash
npm run build:inno
```

Compiles `installer.iss` into a standalone installer. Output:

```
release/
  installer/
    GhostProtocol-1.0.0-Setup.exe
```

### All-in-one build

```bash
npm run build:installer
```

Runs all three steps in sequence: `vite build` > `electron-builder --win` > `iscc installer.iss`.

---

## NPM Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start Vite dev server (browser only) |
| `build` | `vite build` | Build the React bundle to `dist/` |
| `preview` | `vite preview` | Preview the built bundle in browser |
| `electron:dev` | `concurrently vite + electron` | Full Electron dev mode with hot reload |
| `electron:build` | `vite build && electron-builder` | Package the app for Windows |
| `electron:preview` | `vite build && electron .` | Quick preview in Electron |
| `build:installer` | `vite build && electron-builder && iscc` | Full build + Inno Setup installer |
| `build:inno` | `iscc installer.iss` | Compile only the Inno Setup installer |

---

## Project Structure

```
ghost-protocol/
├── electron/
│   ├── main.cjs              # Electron main process
│   ├── preload.cjs           # Context bridge (secure IPC)
│   └── database/
│       └── db.cjs            # SQLite database layer
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Router and app shell
│   ├── pages/                # Full-page components
│   ├── components/
│   │   ├── dashboard/        # Dashboard feature components
│   │   ├── knowledge/        # Knowledge base components
│   │   ├── shared/           # AuthGuard, WindowControls, etc.
│   │   └── ui/               # Reusable UI components
│   ├── hooks/                # Custom React hooks (data + auth)
│   ├── utils/                # Formatters, export helpers
│   ├── constants/            # Theme, options
│   ├── styles/               # Global CSS, variables
│   └── assets/               # Icons, images
├── installer.iss             # Inno Setup installer script
├── electron-builder.config.cjs
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Data Storage

The SQLite database is created automatically on first launch at:

```
%APPDATA%\ghost-protocol\ghost-protocol.db
```

This directory is **not** included in the installer. Uninstalling the app does not delete user data.

---

## Troubleshooting

### `iscc` is not recognized

Inno Setup is not in your PATH. See the [Inno Setup PATH Setup](#inno-setup-path-setup) section above.

### `better-sqlite3` build fails

This native module must be compiled for your Electron version:

```bash
npm run electron:build
```

Electron Builder handles the native rebuild automatically. If it still fails:

```bash
npx electron-rebuild -f -w better-sqlite3
```

### Electron Builder symlink error (winCodeSign)

If you see `Cannot create symbolic link` errors during `electron-builder`, the code signing cache extraction is failing. This is cosmetic — the app still packages correctly.

### Large chunk warnings during Vite build

The `markdown` and `index` chunks exceed 500 KB. This is expected due to the markdown editor and main application bundle. It does not affect functionality.

---

## License

MIT License - See [LICENSE](LICENSE)

Copyright (c) 2026 M. O. N. E. R
