/**
 * GHOST PROTOCOL — Electron Main Process
 *
 * Main entry point for the Electron application.
 * Creates the browser window, initializes SQLite, handles IPC, and system tray.
 */

const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, Notification, nativeImage, screen } = require('electron');
const path = require('path');
const db = require('./database/db.cjs');

const isDev = !app.isPackaged;

let mainWindow = null;
let tray = null;
let isQuitting = false;
let hasShownTrayNotification = false;

// ========================================
// Rate Limiter for sensitive operations
// ========================================
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per user

function checkRateLimit(userId, operation) {
  const key = `${userId}:${operation}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(key, { windowStart: now, count: 1 });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

// Get the tray icon path based on environment
function getTrayIconPath() {
  if (isDev) {
    return path.join(__dirname, '../src/assets/sea-wave-monster.png');
  }
  // In production, the icon is in the extraResources folder
  return path.join(process.resourcesPath, 'assets/tray-icon.png');
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Start at 85% of screen size, never smaller than 1200x700
  const windowWidth = Math.max(Math.floor(screenWidth * 0.85), 1200);
  const windowHeight = Math.max(Math.floor(screenHeight * 0.85), 700);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 1200,
    minHeight: 700,
    center: true,
    frame: false,
    transparent: false,
    backgroundColor: '#050A18',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for better-sqlite3 native module
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();

      // Show notification first time user minimizes to tray
      if (!hasShownTrayNotification && Notification.isSupported()) {
        hasShownTrayNotification = true;
        const notification = new Notification({
          title: 'GHOST PROTOCOL',
          body: 'Application is still running in the system tray.',
          icon: getTrayIconPath(),
          silent: true,
        });
        notification.show();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = getTrayIconPath();
  const icon = nativeImage.createFromPath(iconPath);

  // Resize icon for tray (16x16 is standard for Windows tray)
  const trayIcon = icon.resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  tray.setToolTip('GHOST PROTOCOL — IT Intelligence Suite');

  updateTrayMenu();

  // Double-click to show window
  tray.on('double-click', () => {
    showAndFocusWindow();
  });
}

function updateTrayMenu(agentName = 'MONER') {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'GHOST PROTOCOL',
      enabled: false,
      icon: nativeImage.createFromPath(getTrayIconPath()).resize({ width: 16, height: 16 }),
    },
    { type: 'separator' },
    {
      label: 'Open',
      click: () => showAndFocusWindow(),
    },
    {
      label: 'Dashboard',
      click: () => navigateToPage('dashboard'),
    },
    {
      label: 'Incidents',
      click: () => navigateToPage('incidents'),
    },
    { type: 'separator' },
    {
      label: `Agent: ${agentName.toUpperCase()}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function showAndFocusWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
}

function navigateToPage(page) {
  showAndFocusWindow();

  // Send navigation event to renderer after window is ready
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('navigate-to', page);
  }
}

app.whenReady().then(() => {
  // Initialize database before creating window
  db.initializeDatabase();

  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit on window close — keep running in tray
  // App will only quit when user clicks "Quit" in tray menu
});

app.on('before-quit', () => {
  isQuitting = true;
  db.closeDatabase();
  if (tray) {
    tray.destroy();
  }
});

// ========================================
// IPC Handlers — Window Controls
// ========================================

ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// ========================================
// IPC Handlers — Incidents
// ========================================

ipcMain.handle('db:getIncidents', async () => {
  return db.getAllIncidents();
});

ipcMain.handle('db:getIncidentById', async (event, id) => {
  return db.getIncidentById(id);
});

ipcMain.handle('db:createIncident', async (event, data, performedBy) => {
  // RBAC: Only owner, admin, operator can create incidents
  if (!db.canWrite(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  try {
    return { success: true, data: db.createIncident(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:updateIncident', async (event, id, updates, performedBy) => {
  // RBAC: Only owner, admin, operator can update incidents
  if (!db.canWrite(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  try {
    return { success: true, data: db.updateIncident(id, updates) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:deleteIncident', async (event, id, performedBy, performerName) => {
  // RBAC: Only owner and admin can delete incidents
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }

  // Get incident info BEFORE deleting for audit log
  const incident = db.getIncidentById(id);
  if (!incident) return { success: false, error: 'Incident not found' };

  try {
    const result = db.deleteIncident(id, performedBy);
    if (result.success) {
      db.logAuditEvent({
        eventType: 'incident_deleted',
        targetType: 'incident',
        targetId: id,
        targetName: incident.title,
        oldValue: JSON.stringify({
          status: incident.status,
          priority: incident.priority,
          department: incident.department,
        }),
        performedBy,
        performerName,
      });
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:getIncidentHistory', async (event, incidentId) => {
  return db.getIncidentHistory(incidentId);
});

// ========================================
// IPC Handlers — Metrics & Stats
// ========================================

ipcMain.handle('db:getMetrics', async () => {
  return db.getMetrics();
});

ipcMain.handle('db:getStatusDistribution', async () => {
  return db.getStatusDistribution();
});

ipcMain.handle('db:getPriorityBreakdown', async () => {
  return db.getPriorityBreakdown();
});

ipcMain.handle('db:getDepartmentLoad', async () => {
  return db.getDepartmentLoad();
});

ipcMain.handle('db:getRecentResolutions', async () => {
  return db.getRecentResolutions();
});

ipcMain.handle('reports:getStats', async (event, options) => {
  return db.getReportStats(options);
});

// ========================================
// IPC Handlers — Users & Departments
// ========================================

ipcMain.handle('db:getUsers', async () => {
  return db.getAllUsers();
});

ipcMain.handle('db:getUserByUsername', async (event, username) => {
  return db.getUserByUsername(username);
});

ipcMain.handle('db:getDepartments', async () => {
  return db.getAllDepartments();
});

// ========================================
// IPC Handlers — Authentication
// ========================================

ipcMain.handle('auth:login', async (event, username, password) => {
  return db.authenticateUser(username, password);
});

ipcMain.handle('auth:register', async (event, data) => {
  return db.registerUser(data);
});

ipcMain.handle('auth:recoverUsername', async (event, email) => {
  return db.recoverUsername(email);
});

ipcMain.handle('auth:resetPassword', async (event, username, email) => {
  return db.resetPassword(username, email);
});

ipcMain.handle('admin:changePassword', async (event, targetUserId, newPassword, performedBy, performerName) => {
  if (!db.isAdmin(performedBy)) return { success: false, error: 'Unauthorized' };
  return db.changeUserPassword(targetUserId, newPassword, performedBy, performerName);
});

// ========================================
// IPC Handlers — Comments
// ========================================

ipcMain.handle('db:getIncidentComments', async (event, incidentId) => {
  return db.getIncidentComments(incidentId);
});

ipcMain.handle('db:addIncidentComment', async (event, incidentId, authorId, authorName, text) => {
  return db.addIncidentComment(incidentId, authorId, authorName, text);
});

// ========================================
// IPC Handlers — User Preferences
// ========================================

ipcMain.handle('db:getUserPreferences', async (event, userId) => {
  return db.getUserPreferences(userId);
});

ipcMain.handle('db:updateUserPreferences', async (event, userId, updates) => {
  return db.updateUserPreferences(userId, updates);
});

// ========================================
// IPC Handlers — Admin User Management
// ========================================

ipcMain.handle('admin:getUsers', async () => {
  return db.getAllUsers();
});

ipcMain.handle('admin:getPendingUsers', async () => {
  return db.getPendingUsers();
});

ipcMain.handle('admin:updateUserStatus', async (event, userId, status, performedBy, performerName) => {
  if (!db.isAdmin(performedBy)) return { success: false, error: 'Unauthorized' };
  return db.updateUserStatus(userId, status, performedBy, performerName);
});

ipcMain.handle('admin:updateUserRole', async (event, userId, role, performedBy, performerName) => {
  if (!db.isAdmin(performedBy)) return { success: false, error: 'Unauthorized' };
  return db.updateUserRole(userId, role, performedBy, performerName);
});

ipcMain.handle('admin:updateUserDepartment', async (event, userId, department, performedBy, performerName) => {
  if (!db.isAdmin(performedBy)) return { success: false, error: 'Unauthorized' };
  return db.updateUserDepartment(userId, department, performedBy, performerName);
});

// User can update their own profile (display_name, email)
// Authorization: OWNER can edit anyone, ADMIN can edit self + operator/viewer, others can only edit self
// Rate limited: Max 10 requests per minute per performer
ipcMain.handle('user:updateProfile', async (event, userId, updates, performedBy) => {
  // Rate limit check
  const rateCheck = checkRateLimit(performedBy, 'updateProfile');
  if (!rateCheck.allowed) {
    return { success: false, error: `Too many requests. Please wait ${rateCheck.retryAfter} seconds.` };
  }
  return db.updateUserProfile(userId, updates, performedBy);
});

ipcMain.handle('admin:deleteUser', async (event, userId, performedBy, performerName) => {
  const result = db.deleteUser(userId, performedBy, performerName);
  return result;
});

ipcMain.handle('admin:getLinkedTickets', async (event, userId) => {
  return db.getLinkedTickets(userId);
});

ipcMain.handle('admin:reassignAndDelete', async (event, userId, reassignToId, performedBy, performerName) => {
  return db.reassignAndDeleteUser(userId, reassignToId, performedBy, performerName);
});

ipcMain.handle('admin:reassignAndDeactivate', async (event, userId, reassignToId, performedBy, performerName) => {
  return db.reassignAndDeactivateUser(userId, reassignToId, performedBy, performerName);
});

// ========================================
// IPC Handlers — Audit Log
// ========================================

ipcMain.handle('audit:log', async (event, { eventType, targetType, targetId, targetName, oldValue, newValue, performedBy, performerName }) => {
  db.logAuditEvent({ eventType, targetType, targetId, targetName, oldValue, newValue, performedBy, performerName });
  return { success: true };
});

ipcMain.handle('audit:getLog', async (event, options, performedBy) => {
  // RBAC: Only owner and admin can view audit logs
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions', data: [] };
  }
  return db.getAuditLog(options);
});

ipcMain.handle('audit:getCount', async (event, options, performedBy) => {
  // RBAC: Only owner and admin can view audit logs
  if (!db.isAdmin(performedBy)) {
    return 0;
  }
  return db.getAuditLogCount(options);
});

ipcMain.handle('audit:deleteSelected', async (event, ids, performedBy, performerName) => {
  // RBAC: Only owner can delete audit logs
  if (!db.isOwner(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.deleteAuditLogEntries(ids, performedBy, performerName);
});

ipcMain.handle('audit:deleteAll', async (event, performedBy, performerName) => {
  // RBAC: Only owner can delete audit logs
  if (!db.isOwner(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.deleteAllAuditLogs(performedBy, performerName);
});

// ========================================
// IPC Handlers — Knowledge Base
// ========================================

// Categories
ipcMain.handle('kb:getCategories', async () => {
  return db.kbGetCategories();
});

ipcMain.handle('kb:createCategory', async (event, name, slug, icon, parentId, performedBy, performerName) => {
  // RBAC: Only owner and admin can manage categories
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  try {
    return db.kbCreateCategory(name, slug, icon, parentId, performedBy, performerName);
  } catch (err) {
    console.error('[IPC kb:createCategory] ERROR:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('kb:updateCategory', async (event, id, name, icon, performedBy, performerName) => {
  // RBAC: Only owner and admin can manage categories
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.kbUpdateCategory(id, name, icon, performedBy, performerName);
});

ipcMain.handle('kb:deleteCategory', async (event, id, performedBy, performerName) => {
  // RBAC: Only owner and admin can manage categories
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  try { return db.kbDeleteCategory(id, performedBy, performerName); }
  catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('kb:deleteCategoryWithMigration', async (event, id, targetId, performedBy, performerName) => {
  // RBAC: Only owner and admin can manage categories
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  try { return db.kbDeleteCategoryWithMigration(id, targetId, performedBy, performerName); }
  catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('kb:reorderCategories', async (event, orderedIds, performedBy) => {
  // RBAC: Only owner and admin can manage categories
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.kbReorderCategories(orderedIds, performedBy);
});

// Articles
ipcMain.handle('kb:getArticles', async (event, filters) => {
  return db.kbGetArticles(filters);
});

ipcMain.handle('kb:getArticle', async (event, id) => {
  return db.kbGetArticle(id);
});

ipcMain.handle('kb:searchArticles', async (event, query) => {
  return db.kbSearchArticles(query);
});

ipcMain.handle('kb:createArticle', async (event, data, performedBy, performerName) => {
  // RBAC: Only owner, admin, operator can create articles
  if (!db.canWrite(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.kbCreateArticle(data, performedBy, performerName);
});

ipcMain.handle('kb:updateArticle', async (event, id, data, performedBy, performerName) => {
  // RBAC: Only owner, admin, operator can update articles
  if (!db.canWrite(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.kbUpdateArticle(id, data, performedBy, performerName);
});

ipcMain.handle('kb:deleteArticle', async (event, id, performedBy, performerName) => {
  // RBAC: Only owner, admin, operator can delete articles
  if (!db.canWrite(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.kbDeleteArticle(id, performedBy, performerName);
});

ipcMain.handle('kb:togglePin', async (event, id, performedBy, performerName) => {
  // RBAC: Only owner, admin, operator can toggle pin
  if (!db.canWrite(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.kbTogglePin(id, performedBy, performerName);
});

ipcMain.handle('kb:publishArticle', async (event, id, performedBy, performerName) => {
  // RBAC: Only owner, admin, operator can publish articles
  if (!db.canWrite(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.kbPublishArticle(id, performedBy, performerName);
});

// Feedback
ipcMain.handle('kb:submitFeedback', async (event, articleId, agentId, isHelpful, comment, agentName) => {
  return db.kbSubmitFeedback(articleId, agentId, isHelpful, comment, agentName);
});

ipcMain.handle('kb:getArticleFeedback', async (event, articleId, performedBy) => {
  return db.kbGetArticleFeedback(articleId, performedBy);
});

ipcMain.handle('kb:getUserFeedback', async (event, articleId, agentId) => {
  return db.kbGetUserFeedback(articleId, agentId);
});

// Issue Reports
ipcMain.handle('kb:createIssueReport', async (event, articleId, reportedBy, reporterName, issueType, description) => {
  return db.kbCreateIssueReport(articleId, reportedBy, reporterName, issueType, description);
});

// Notifications (OWNER/ADMIN only)
ipcMain.handle('kb:getNotifications', async (event, userId, limit) => {
  return db.kbGetNotifications(userId, limit);
});

ipcMain.handle('kb:getUnreadCount', async (event, userId) => {
  return db.kbGetUnreadCount(userId);
});

ipcMain.handle('kb:markAllAsRead', async () => {
  return db.kbMarkAllAsRead();
});

ipcMain.handle('kb:clearAllNotifications', async (event, userId) => {
  return db.kbClearAllNotifications(userId);
});

ipcMain.handle('kb:resolveIssueReport', async (event, issueId, performedBy) => {
  // RBAC: Only owner and admin can resolve issue reports
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.kbResolveIssueReport(issueId, performedBy);
});

// History, Duplication, Bulk, Recent Edits
ipcMain.handle('kb:getArticleHistory', async (event, articleId) => {
  return db.kbGetArticleHistory(articleId);
});

ipcMain.handle('kb:duplicateArticle', async (event, articleId, performedBy, performerName) => {
  // RBAC: Only owner, admin, operator can duplicate articles
  if (!db.canWrite(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.kbDuplicateArticle(articleId, performedBy, performerName);
});

ipcMain.handle('kb:getRecentEdits', async (event, userId, limit) => {
  return db.kbGetRecentEdits(userId, limit);
});

ipcMain.handle('kb:bulkUpdateStatus', async (event, articleIds, status, performedBy, performerName) => {
  // RBAC: Only owner and admin can perform bulk operations
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.kbBulkUpdateStatus(articleIds, status, performedBy, performerName);
});

ipcMain.handle('kb:bulkMoveCategory', async (event, articleIds, categoryId, performedBy, performerName) => {
  // RBAC: Only owner and admin can perform bulk operations
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.kbBulkMoveCategory(articleIds, categoryId, performedBy, performerName);
});

ipcMain.handle('kb:bulkDelete', async (event, articleIds, performedBy, performerName) => {
  // RBAC: Only owner and admin can perform bulk operations
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.kbBulkDelete(articleIds, performedBy, performerName);
});

// ========================================
// IPC Handlers — Backup & Restore
// ========================================

ipcMain.handle('backup:create', async (event, performedBy) => {
  // RBAC: Only owner can create backups
  if (!db.isOwner(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.createBackup();
});

ipcMain.handle('backup:createToPath', async (event, performedBy) => {
  // RBAC: Only owner can create backups
  if (!db.isOwner(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Database Backup',
    defaultPath: `ghost-protocol-backup-${new Date().toISOString().slice(0, 10)}.db`,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, error: 'Cancelled' };
  }

  return db.createBackup(result.filePath);
});

ipcMain.handle('backup:restore', async (event, backupPath, performedBy) => {
  // RBAC: Only owner can restore backups
  if (!db.isOwner(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.restoreBackup(backupPath);
});

ipcMain.handle('backup:restoreFromFile', async (event, performedBy) => {
  // RBAC: Only owner can restore backups
  if (!db.isOwner(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Backup to Restore',
    filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'Cancelled' };
  }

  return db.restoreBackup(result.filePaths[0]);
});

ipcMain.handle('backup:list', async () => {
  return db.listBackups();
});

ipcMain.handle('backup:delete', async (event, backupPath, performedBy) => {
  // RBAC: Only owner can delete backups
  if (!db.isOwner(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.deleteBackup(backupPath);
});

ipcMain.handle('backup:exportJson', async (event, performedBy) => {
  // RBAC: Only owner can export database
  if (!db.isOwner(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.exportToJson();
});

ipcMain.handle('backup:exportJsonToPath', async (event, performedBy) => {
  // RBAC: Only owner can export database
  if (!db.isOwner(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Database as JSON',
    defaultPath: `ghost-protocol-export-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, error: 'Cancelled' };
  }

  return db.exportToJson(result.filePath);
});

ipcMain.handle('backup:exportAuditLog', async (event, filters, performedBy) => {
  // RBAC: Only owner and admin can export audit logs
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.exportAuditLog(null, filters);
});

ipcMain.handle('backup:exportAuditLogToPath', async (event, filters, performedBy) => {
  // RBAC: Only owner and admin can export audit logs
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Audit Log',
    defaultPath: `ghost-protocol-audit-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, error: 'Cancelled' };
  }

  return db.exportAuditLog(result.filePath, filters);
});

ipcMain.handle('backup:getDatabaseInfo', async () => {
  return db.getDatabaseInfo();
});

// Legacy aliases for backward compatibility with preload
ipcMain.handle('db:getTickets', async () => {
  return db.getAllIncidents();
});

ipcMain.handle('db:getTicketById', async (event, id) => {
  return db.getIncidentById(id);
});

// Legacy write handlers (db:createTicket, db:updateTicket, db:deleteTicket) removed
// — unused by frontend, use guarded incidents.* API instead

// ========================================
// IPC Handlers — Export (CSV/PDF)
// ========================================

const fs = require('fs');

ipcMain.handle('export:showSaveDialog', async (event, { defaultPath, filters, title }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: title || 'Save File',
    defaultPath,
    filters: filters || [{ name: 'All Files', extensions: ['*'] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  return { success: true, filePath: result.filePath };
});

ipcMain.handle('export:saveFile', async (event, { filePath, content, encoding }) => {
  try {
    // Handle binary content (PDF) vs text content (CSV)
    if (encoding === 'binary') {
      // content is expected to be a base64 string for binary files
      const buffer = Buffer.from(content, 'base64');
      fs.writeFileSync(filePath, buffer);
    } else {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    return { success: true, filePath };
  } catch (err) {
    console.error('[export:saveFile] Error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('export:getDownloadsPath', async () => {
  return app.getPath('downloads');
});

// ========================================
// IPC Handlers — Tray
// ========================================

ipcMain.handle('tray:setAgentName', async (event, name) => {
  if (tray) {
    updateTrayMenu(name);
  }
  return { success: true };
});

// ========================================
// IPC Handlers — End Users (Reporters)
// ========================================

ipcMain.handle('endUsers:getAll', async (event, options) => {
  return db.getAllEndUsers(options);
});

ipcMain.handle('endUsers:getById', async (event, id) => {
  return db.getEndUserById(id);
});

ipcMain.handle('endUsers:search', async (event, query) => {
  return db.searchEndUsers(query);
});

ipcMain.handle('endUsers:create', async (event, data, performedBy, performerName) => {
  // RBAC: Only owner and admin can manage end users
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.createEndUser(data, performedBy, performerName);
});

ipcMain.handle('endUsers:update', async (event, id, updates, performedBy, performerName) => {
  // RBAC: Only owner and admin can manage end users
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.updateEndUser(id, updates, performedBy, performerName);
});

ipcMain.handle('endUsers:deactivate', async (event, id, performedBy, performerName) => {
  // RBAC: Only owner and admin can manage end users
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.deactivateEndUser(id, performedBy, performerName);
});

ipcMain.handle('endUsers:reactivate', async (event, id, performedBy, performerName) => {
  // RBAC: Only owner and admin can manage end users
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.reactivateEndUser(id, performedBy, performerName);
});

ipcMain.handle('endUsers:delete', async (event, id, performedBy, performerName) => {
  // RBAC: Only owner and admin can manage end users
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.deleteEndUser(id, performedBy, performerName);
});

ipcMain.handle('endUsers:getIncidentCount', async (event, id) => {
  return db.getEndUserIncidentCount(id);
});

ipcMain.handle('endUsers:getIncidents', async (event, id) => {
  return db.getEndUserIncidents(id);
});

ipcMain.handle('endUsers:reassignAndDelete', async (event, userId, newReporterId, performedBy, performerName) => {
  // RBAC: Only owner and admin can manage end users
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.reassignAndDeleteEndUser(userId, newReporterId, performedBy, performerName);
});

// ========================================
// IPC Handlers — Company Departments
// ========================================

ipcMain.handle('companyDepts:getAll', async (event, includeInactive) => {
  try {
    return { success: true, departments: db.getAllCompanyDepartments(includeInactive) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('companyDepts:getById', async (event, id) => {
  try {
    const department = db.getCompanyDepartmentById(id);
    return department ? { success: true, department } : { success: false, error: 'Department not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('companyDepts:create', async (event, data, performedBy, performerName) => {
  // Role check: only admin or owner (performedBy is the user ID)
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Unauthorized — Admin or Owner role required' };
  }
  return db.createCompanyDepartment(data, performedBy, performerName);
});

ipcMain.handle('companyDepts:update', async (event, id, updates, performedBy, performerName) => {
  // Role check: only admin or owner (performedBy is the user ID)
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Unauthorized — Admin or Owner role required' };
  }
  return db.updateCompanyDepartment(id, updates, performedBy, performerName);
});

ipcMain.handle('companyDepts:reactivate', async (event, id, performedBy, performerName) => {
  // Role check: only admin or owner (performedBy is the user ID)
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Unauthorized — Admin or Owner role required' };
  }
  return db.reactivateCompanyDepartment(id, performedBy, performerName);
});

ipcMain.handle('companyDepts:delete', async (event, id, performedBy, performerName) => {
  // Role check: only admin or owner (performedBy is the user ID)
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Unauthorized — Admin or Owner role required' };
  }
  return db.deleteCompanyDepartment(id, performedBy, performerName);
});

ipcMain.handle('companyDepts:reassignAndDelete', async (event, fromId, toId, performedBy, performerName) => {
  if (!db.isAdmin(performedBy)) {
    return { success: false, error: 'Unauthorized — Admin or Owner role required' };
  }
  return db.reassignAndDeleteDepartment(fromId, toId, performedBy, performerName);
});

// ═══════════════════════════════════════════════════════════════════════════
// INCIDENT ATTACHMENTS
// ═══════════════════════════════════════════════════════════════════════════

ipcMain.handle('attachments:getByIncidentId', async (event, incidentId) => {
  return db.getAttachmentsByIncidentId(incidentId);
});

ipcMain.handle('attachments:getData', async (event, attachmentId) => {
  return db.getAttachmentData(attachmentId);
});

ipcMain.handle('attachments:save', async (event, incidentId, attachment, performedBy, performerName) => {
  // RBAC: Only owner, admin, operator can save attachments
  if (!db.canWrite(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.saveAttachment(incidentId, attachment, performedBy, performerName);
});

ipcMain.handle('attachments:saveBulk', async (event, incidentId, attachments, performedBy, performerName) => {
  // RBAC: Only owner, admin, operator can save attachments
  if (!db.canWrite(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.saveAttachments(incidentId, attachments, performedBy, performerName);
});

ipcMain.handle('attachments:delete', async (event, attachmentId, performedBy, performerName) => {
  // RBAC: Only owner, admin, operator can delete attachments
  if (!db.canWrite(performedBy)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  return db.deleteAttachment(attachmentId, performedBy, performerName);
});
