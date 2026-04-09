/**
 * GHOST PROTOCOL — Electron Preload Script
 *
 * Exposes secure IPC channels via contextBridge.
 * SECURITY: Only specific IPC channels are exposed.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ========================================
  // Window Controls
  // ========================================
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // ========================================
  // Incidents
  // ========================================
  incidents: {
    getAll: () => ipcRenderer.invoke('db:getIncidents'),
    getById: (id) => ipcRenderer.invoke('db:getIncidentById', id),
    create: (data, performedBy) => ipcRenderer.invoke('db:createIncident', data, performedBy),
    update: (id, updates, performedBy) => ipcRenderer.invoke('db:updateIncident', id, updates, performedBy),
    delete: (id, performedBy, performerName) => ipcRenderer.invoke('db:deleteIncident', id, performedBy, performerName),
    getHistory: (incidentId) => ipcRenderer.invoke('db:getIncidentHistory', incidentId),
    getComments: (incidentId) => ipcRenderer.invoke('db:getIncidentComments', incidentId),
    addComment: (incidentId, authorId, authorName, text) => ipcRenderer.invoke('db:addIncidentComment', incidentId, authorId, authorName, text),
  },

  // ========================================
  // User Preferences
  // ========================================
  preferences: {
    get: (userId) => ipcRenderer.invoke('db:getUserPreferences', userId),
    update: (userId, updates) => ipcRenderer.invoke('db:updateUserPreferences', userId, updates),
  },

  // User Profile
  // ========================================
  profile: {
    update: (userId, updates, performedBy) => ipcRenderer.invoke('user:updateProfile', userId, updates, performedBy),
  },

  // ========================================
  // Metrics & Statistics
  // ========================================
  metrics: {
    get: () => ipcRenderer.invoke('db:getMetrics'),
    getStatusDistribution: () => ipcRenderer.invoke('db:getStatusDistribution'),
    getPriorityBreakdown: () => ipcRenderer.invoke('db:getPriorityBreakdown'),
    getDepartmentLoad: () => ipcRenderer.invoke('db:getDepartmentLoad'),
    getRecentResolutions: () => ipcRenderer.invoke('db:getRecentResolutions'),
  },

  // ========================================
  // Reports (with date filtering)
  // ========================================
  reports: {
    getStats: (options) => ipcRenderer.invoke('reports:getStats', options),
  },

  // ========================================
  // Users & Departments
  // ========================================
  users: {
    getAll: () => ipcRenderer.invoke('db:getUsers'),
    getByUsername: (username) => ipcRenderer.invoke('db:getUserByUsername', username),
  },

  departments: {
    getAll: () => ipcRenderer.invoke('db:getDepartments'),
  },

  // ========================================
  // Authentication
  // ========================================
  auth: {
    login: (username, password) => ipcRenderer.invoke('auth:login', username, password),
    register: (data) => ipcRenderer.invoke('auth:register', data),
    recoverUsername: (email) => ipcRenderer.invoke('auth:recoverUsername', email),
    resetPassword: (username, email) => ipcRenderer.invoke('auth:resetPassword', username, email),
  },

  // ========================================
  // Admin
  // ========================================
  admin: {
    getUsers: () => ipcRenderer.invoke('admin:getUsers'),
    getPendingUsers: () => ipcRenderer.invoke('admin:getPendingUsers'),
    updateUserStatus: (userId, status, performedBy, performerName) => ipcRenderer.invoke('admin:updateUserStatus', userId, status, performedBy, performerName),
    updateUserRole: (userId, role, performedBy, performerName) => ipcRenderer.invoke('admin:updateUserRole', userId, role, performedBy, performerName),
    updateUserDepartment: (userId, dept, performedBy, performerName) => ipcRenderer.invoke('admin:updateUserDepartment', userId, dept, performedBy, performerName),
    deleteUser: (userId, performedBy, performerName) => ipcRenderer.invoke('admin:deleteUser', userId, performedBy, performerName),
    getLinkedTickets: (userId) => ipcRenderer.invoke('admin:getLinkedTickets', userId),
    reassignAndDelete: (userId, reassignToId, performedBy, performerName) => ipcRenderer.invoke('admin:reassignAndDelete', userId, reassignToId, performedBy, performerName),
    reassignAndDeactivate: (userId, reassignToId, performedBy, performerName) => ipcRenderer.invoke('admin:reassignAndDeactivate', userId, reassignToId, performedBy, performerName),
    changePassword: (targetUserId, newPassword, performedBy, performerName) => ipcRenderer.invoke('admin:changePassword', targetUserId, newPassword, performedBy, performerName),
  },

  // ========================================
  // Audit Log
  // ========================================
  audit: {
    log: (data) => ipcRenderer.invoke('audit:log', data),
    getLog: (options, performedBy) => ipcRenderer.invoke('audit:getLog', options, performedBy),
    getCount: (options, performedBy) => ipcRenderer.invoke('audit:getCount', options, performedBy),
    deleteSelected: (ids, performedBy, performerName) => ipcRenderer.invoke('audit:deleteSelected', ids, performedBy, performerName),
    deleteAll: (performedBy, performerName) => ipcRenderer.invoke('audit:deleteAll', performedBy, performerName),
  },

  // ========================================
  // Knowledge Base
  // ========================================
  kb: {
    // Categories
    getCategories: () => ipcRenderer.invoke('kb:getCategories'),
    createCategory: (name, slug, icon, parentId, performedBy, performerName) => ipcRenderer.invoke('kb:createCategory', name, slug, icon, parentId, performedBy, performerName),
    updateCategory: (id, name, icon, performedBy, performerName) => ipcRenderer.invoke('kb:updateCategory', id, name, icon, performedBy, performerName),
    deleteCategory: (id, performedBy, performerName) => ipcRenderer.invoke('kb:deleteCategory', id, performedBy, performerName),
    deleteCategoryWithMigration: (id, targetId, performedBy, performerName) => ipcRenderer.invoke('kb:deleteCategoryWithMigration', id, targetId, performedBy, performerName),
    reorderCategories: (orderedIds, performedBy) => ipcRenderer.invoke('kb:reorderCategories', orderedIds, performedBy),
    // Articles
    getArticles: (filters) => ipcRenderer.invoke('kb:getArticles', filters),
    getArticle: (id) => ipcRenderer.invoke('kb:getArticle', id),
    searchArticles: (query) => ipcRenderer.invoke('kb:searchArticles', query),
    createArticle: (data, performedBy, performerName) => ipcRenderer.invoke('kb:createArticle', data, performedBy, performerName),
    updateArticle: (id, data, performedBy, performerName) => ipcRenderer.invoke('kb:updateArticle', id, data, performedBy, performerName),
    deleteArticle: (id, performedBy, performerName) => ipcRenderer.invoke('kb:deleteArticle', id, performedBy, performerName),
    togglePin: (id, performedBy, performerName) => ipcRenderer.invoke('kb:togglePin', id, performedBy, performerName),
    publishArticle: (id, performedBy, performerName) => ipcRenderer.invoke('kb:publishArticle', id, performedBy, performerName),
    // History, Duplication, Bulk, Recent Edits
    getArticleHistory: (articleId) => ipcRenderer.invoke('kb:getArticleHistory', articleId),
    duplicateArticle: (articleId, performedBy, performerName) => ipcRenderer.invoke('kb:duplicateArticle', articleId, performedBy, performerName),
    getRecentEdits: (userId, limit) => ipcRenderer.invoke('kb:getRecentEdits', userId, limit),
    bulkUpdateStatus: (articleIds, status, performedBy, performerName) => ipcRenderer.invoke('kb:bulkUpdateStatus', articleIds, status, performedBy, performerName),
    bulkMoveCategory: (articleIds, categoryId, performedBy, performerName) => ipcRenderer.invoke('kb:bulkMoveCategory', articleIds, categoryId, performedBy, performerName),
    bulkDelete: (articleIds, performedBy, performerName) => ipcRenderer.invoke('kb:bulkDelete', articleIds, performedBy, performerName),
    // Feedback
    submitFeedback: (articleId, agentId, isHelpful, comment, agentName) => ipcRenderer.invoke('kb:submitFeedback', articleId, agentId, isHelpful, comment, agentName),
    getArticleFeedback: (articleId, performedBy) => ipcRenderer.invoke('kb:getArticleFeedback', articleId, performedBy),
    getUserFeedback: (articleId, agentId) => ipcRenderer.invoke('kb:getUserFeedback', articleId, agentId),
    // Issue Reports
    createIssueReport: (articleId, reportedBy, reporterName, issueType, description) => ipcRenderer.invoke('kb:createIssueReport', articleId, reportedBy, reporterName, issueType, description),
    // Notifications (OWNER/ADMIN only)
    getNotifications: (userId, limit) => ipcRenderer.invoke('kb:getNotifications', userId, limit),
    getUnreadCount: (userId) => ipcRenderer.invoke('kb:getUnreadCount', userId),
    markAllAsRead: () => ipcRenderer.invoke('kb:markAllAsRead'),
    clearAllNotifications: (userId) => ipcRenderer.invoke('kb:clearAllNotifications', userId),
    resolveIssueReport: (issueId, performedBy) => ipcRenderer.invoke('kb:resolveIssueReport', issueId, performedBy),
  },

  // ========================================
  // Backup & Restore
  // ========================================
  backup: {
    create: (performedBy) => ipcRenderer.invoke('backup:create', performedBy),
    createToPath: (performedBy) => ipcRenderer.invoke('backup:createToPath', performedBy),
    restore: (backupPath, performedBy) => ipcRenderer.invoke('backup:restore', backupPath, performedBy),
    restoreFromFile: (performedBy) => ipcRenderer.invoke('backup:restoreFromFile', performedBy),
    list: () => ipcRenderer.invoke('backup:list'),
    delete: (backupPath, performedBy) => ipcRenderer.invoke('backup:delete', backupPath, performedBy),
    exportJson: (performedBy) => ipcRenderer.invoke('backup:exportJson', performedBy),
    exportJsonToPath: (performedBy) => ipcRenderer.invoke('backup:exportJsonToPath', performedBy),
    exportAuditLog: (filters, performedBy) => ipcRenderer.invoke('backup:exportAuditLog', filters, performedBy),
    exportAuditLogToPath: (filters, performedBy) => ipcRenderer.invoke('backup:exportAuditLogToPath', filters, performedBy),
    getDatabaseInfo: () => ipcRenderer.invoke('backup:getDatabaseInfo'),
  },

  // ========================================
  // Legacy API (backward compatibility — read-only)
  // ========================================
  db: {
    getTickets: () => ipcRenderer.invoke('db:getTickets'),
    getTicketById: (id) => ipcRenderer.invoke('db:getTicketById', id),
    // Write operations removed — use guarded incidents.* API instead
  },

  // ========================================
  // Platform Information
  // ========================================
  platform: process.platform,

  // ========================================
  // Navigation (from tray menu)
  // ========================================
  navigation: {
    onNavigate: (callback) => {
      ipcRenderer.on('navigate-to', (event, page) => callback(page));
    },
    removeNavigateListener: () => {
      ipcRenderer.removeAllListeners('navigate-to');
    },
  },

  // ========================================
  // Tray
  // ========================================
  tray: {
    setAgentName: (name) => ipcRenderer.invoke('tray:setAgentName', name),
  },

  // ========================================
  // End Users (Reporters)
  // ========================================
  endUsers: {
    getAll: (options) => ipcRenderer.invoke('endUsers:getAll', options),
    getById: (id) => ipcRenderer.invoke('endUsers:getById', id),
    search: (query) => ipcRenderer.invoke('endUsers:search', query),
    create: (data, performedBy, performerName) => ipcRenderer.invoke('endUsers:create', data, performedBy, performerName),
    update: (id, updates, performedBy, performerName) => ipcRenderer.invoke('endUsers:update', id, updates, performedBy, performerName),
    deactivate: (id, performedBy, performerName) => ipcRenderer.invoke('endUsers:deactivate', id, performedBy, performerName),
    reactivate: (id, performedBy, performerName) => ipcRenderer.invoke('endUsers:reactivate', id, performedBy, performerName),
    delete: (id, performedBy, performerName) => ipcRenderer.invoke('endUsers:delete', id, performedBy, performerName),
    getIncidentCount: (id) => ipcRenderer.invoke('endUsers:getIncidentCount', id),
    getIncidents: (id) => ipcRenderer.invoke('endUsers:getIncidents', id),
    reassignAndDelete: (userId, newReporterId, performedBy, performerName) => ipcRenderer.invoke('endUsers:reassignAndDelete', userId, newReporterId, performedBy, performerName),
  },

  // ========================================
  // Company Departments
  // ========================================
  companyDepts: {
    getAll: (includeInactive) => ipcRenderer.invoke('companyDepts:getAll', includeInactive),
    getById: (id) => ipcRenderer.invoke('companyDepts:getById', id),
    create: (data, performedBy, performerName) => ipcRenderer.invoke('companyDepts:create', data, performedBy, performerName),
    update: (id, updates, performedBy, performerName) => ipcRenderer.invoke('companyDepts:update', id, updates, performedBy, performerName),
    reactivate: (id, performedBy, performerName) => ipcRenderer.invoke('companyDepts:reactivate', id, performedBy, performerName),
    delete: (id, performedBy, performerName) => ipcRenderer.invoke('companyDepts:delete', id, performedBy, performerName),
    reassignAndDelete: (fromId, toId, performedBy, performerName) => ipcRenderer.invoke('companyDepts:reassignAndDelete', fromId, toId, performedBy, performerName),
  },

  // ========================================
  // Incident Attachments
  // ========================================
  attachments: {
    getByIncidentId: (incidentId) => ipcRenderer.invoke('attachments:getByIncidentId', incidentId),
    getData: (attachmentId) => ipcRenderer.invoke('attachments:getData', attachmentId),
    save: (incidentId, attachment, performedBy, performerName) => ipcRenderer.invoke('attachments:save', incidentId, attachment, performedBy, performerName),
    saveBulk: (incidentId, attachments, performedBy, performerName) => ipcRenderer.invoke('attachments:saveBulk', incidentId, attachments, performedBy, performerName),
    delete: (attachmentId, performedBy, performerName) => ipcRenderer.invoke('attachments:delete', attachmentId, performedBy, performerName),
  },

  // ========================================
  // Export (CSV/PDF)
  // ========================================
  export: {
    showSaveDialog: (options) => ipcRenderer.invoke('export:showSaveDialog', options),
    saveFile: (options) => ipcRenderer.invoke('export:saveFile', options),
    getDownloadsPath: () => ipcRenderer.invoke('export:getDownloadsPath'),
  },
});
