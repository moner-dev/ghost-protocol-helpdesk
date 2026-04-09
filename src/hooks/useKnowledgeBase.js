/**
 * GHOST PROTOCOL — useKnowledgeBase Hook
 * Manages all Knowledge Base data via Electron IPC.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const isElectron = typeof window !== 'undefined' && window.electronAPI?.kb;

export function useKnowledgeBase() {
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchTimer = useRef(null);

  // ── Fetch categories ──
  const fetchCategories = useCallback(async () => {
    if (!isElectron) return;
    try {
      const data = await window.electronAPI.kb.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch KB categories:', err);
    }
  }, []);

  // ── Fetch articles ──
  const fetchArticles = useCallback(async (filters = {}) => {
    if (!isElectron) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const data = await window.electronAPI.kb.getArticles(filters);
      setArticles(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch KB articles:', err);
      setError(err.message);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load on mount ──
  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, [fetchCategories, fetchArticles]);

  // ── Get single article (increments view count) ──
  const openArticle = useCallback(async (id) => {
    if (!isElectron) return null;
    try {
      const article = await window.electronAPI.kb.getArticle(id);
      setCurrentArticle(article);
      return article;
    } catch (err) {
      console.error('Failed to fetch article:', err);
      return null;
    }
  }, []);

  const closeArticle = useCallback(() => setCurrentArticle(null), []);

  // ── Search with 300ms debounce ──
  const searchArticles = useCallback((query) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query || query.length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      if (!isElectron) return;
      try {
        const results = await window.electronAPI.kb.searchArticles(query);
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      }
    }, 300);
  }, []);

  // ── Article CRUD ──
  const createArticle = useCallback(async (data, performedBy, performerName) => {
    if (!isElectron) return { success: false, error: 'Electron required' };
    const result = await window.electronAPI.kb.createArticle(data, performedBy, performerName);
    if (result.success) { fetchArticles(); fetchCategories(); }
    return result;
  }, [fetchArticles, fetchCategories]);

  const updateArticle = useCallback(async (id, data, performedBy, performerName) => {
    if (!isElectron) return { success: false, error: 'Electron required' };
    const result = await window.electronAPI.kb.updateArticle(id, data, performedBy, performerName);
    if (result.success) { fetchArticles(); fetchCategories(); if (currentArticle?.id === id) setCurrentArticle(result.article); }
    return result;
  }, [fetchArticles, fetchCategories, currentArticle]);

  const deleteArticle = useCallback(async (id, performedBy, performerName) => {
    if (!isElectron) return { success: false, error: 'Electron required' };
    const result = await window.electronAPI.kb.deleteArticle(id, performedBy, performerName);
    if (result.success) { fetchArticles(); fetchCategories(); if (currentArticle?.id === id) setCurrentArticle(null); }
    return result;
  }, [fetchArticles, fetchCategories, currentArticle]);

  const togglePin = useCallback(async (id, performedBy, performerName) => {
    if (!isElectron) return { success: false };
    const result = await window.electronAPI.kb.togglePin(id, performedBy, performerName);
    if (result.success) fetchArticles();
    return result;
  }, [fetchArticles]);

  const publishArticle = useCallback(async (id, performedBy, performerName) => {
    if (!isElectron) return { success: false };
    const result = await window.electronAPI.kb.publishArticle(id, performedBy, performerName);
    if (result.success) fetchArticles();
    return result;
  }, [fetchArticles]);

  // ── Feedback ──
  const submitFeedback = useCallback(async (articleId, agentId, isHelpful, comment, agentName) => {
    if (!isElectron) return { success: false };
    return await window.electronAPI.kb.submitFeedback(articleId, agentId, isHelpful, comment, agentName);
  }, []);

  const getArticleFeedback = useCallback(async (articleId, performedBy) => {
    if (!isElectron) return { success: false };
    return await window.electronAPI.kb.getArticleFeedback(articleId, performedBy);
  }, []);

  const getUserFeedback = useCallback(async (articleId, agentId) => {
    if (!isElectron) return null;
    return await window.electronAPI.kb.getUserFeedback(articleId, agentId);
  }, []);

  // ── Issue Reports ──
  const createIssueReport = useCallback(async (articleId, reportedBy, reporterName, issueType, description) => {
    if (!isElectron) return { success: false };
    return await window.electronAPI.kb.createIssueReport(articleId, reportedBy, reporterName, issueType, description);
  }, []);

  // ── Notifications (OWNER/ADMIN) ──
  const getNotifications = useCallback(async (limit = 20) => {
    if (!isElectron) return [];
    return await window.electronAPI.kb.getNotifications(limit);
  }, []);

  const getUnreadCount = useCallback(async () => {
    if (!isElectron) return 0;
    return await window.electronAPI.kb.getUnreadCount();
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!isElectron) return { success: false };
    return await window.electronAPI.kb.markAllAsRead();
  }, []);

  const resolveIssueReport = useCallback(async (issueId, performedBy) => {
    if (!isElectron) return { success: false };
    return await window.electronAPI.kb.resolveIssueReport(issueId, performedBy);
  }, []);

  // ── History, Duplication, Bulk, Recent ──
  const getArticleHistory = useCallback(async (articleId) => {
    if (!isElectron) return [];
    return await window.electronAPI.kb.getArticleHistory(articleId);
  }, []);

  const duplicateArticle = useCallback(async (articleId, performedBy, performerName) => {
    if (!isElectron) return { success: false };
    const result = await window.electronAPI.kb.duplicateArticle(articleId, performedBy, performerName);
    if (result.success) { fetchArticles(); fetchCategories(); }
    return result;
  }, [fetchArticles, fetchCategories]);

  const getRecentEdits = useCallback(async (userId, limit) => {
    if (!isElectron) return [];
    return await window.electronAPI.kb.getRecentEdits(userId, limit);
  }, []);

  const bulkUpdateStatus = useCallback(async (articleIds, status, performedBy, performerName) => {
    if (!isElectron) return { success: false };
    const result = await window.electronAPI.kb.bulkUpdateStatus(articleIds, status, performedBy, performerName);
    if (result.success) fetchArticles();
    return result;
  }, [fetchArticles]);

  const bulkMoveCategory = useCallback(async (articleIds, categoryId, performedBy, performerName) => {
    if (!isElectron) return { success: false };
    const result = await window.electronAPI.kb.bulkMoveCategory(articleIds, categoryId, performedBy, performerName);
    if (result.success) { fetchArticles(); fetchCategories(); }
    return result;
  }, [fetchArticles, fetchCategories]);

  const bulkDelete = useCallback(async (articleIds, performedBy, performerName) => {
    if (!isElectron) return { success: false };
    const result = await window.electronAPI.kb.bulkDelete(articleIds, performedBy, performerName);
    if (result.success) { fetchArticles(); fetchCategories(); }
    return result;
  }, [fetchArticles, fetchCategories]);

  // ── Category CRUD ──
  const createCategory = useCallback(async (name, slug, icon, parentId, performedBy, performerName) => {
    if (!isElectron) return { success: false };
    const result = await window.electronAPI.kb.createCategory(name, slug, icon, parentId, performedBy, performerName);
    if (result.success) fetchCategories();
    return result;
  }, [fetchCategories]);

  const updateCategory = useCallback(async (id, name, icon, performedBy, performerName) => {
    if (!isElectron) return { success: false };
    const result = await window.electronAPI.kb.updateCategory(id, name, icon, performedBy, performerName);
    if (result.success) fetchCategories();
    return result;
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (id, performedBy, performerName) => {
    if (!isElectron) return { success: false };
    const result = await window.electronAPI.kb.deleteCategory(id, performedBy, performerName);
    if (result.success) { fetchCategories(); fetchArticles(); }
    return result;
  }, [fetchCategories, fetchArticles]);

  const deleteCategoryWithMigration = useCallback(async (id, targetId, performedBy, performerName) => {
    if (!isElectron) return { success: false };
    const result = await window.electronAPI.kb.deleteCategoryWithMigration(id, targetId, performedBy, performerName);
    if (result.success) { fetchCategories(); fetchArticles(); }
    return result;
  }, [fetchCategories, fetchArticles]);

  const reorderCategories = useCallback(async (orderedIds, performedBy) => {
    if (!isElectron) return { success: false };
    const result = await window.electronAPI.kb.reorderCategories(orderedIds, performedBy);
    if (result.success) fetchCategories();
    return result;
  }, [fetchCategories]);

  return {
    categories, articles, currentArticle, searchResults, isLoading, error,
    fetchCategories, fetchArticles, openArticle, closeArticle, searchArticles,
    createArticle, updateArticle, deleteArticle, togglePin, publishArticle,
    submitFeedback, getArticleFeedback, getUserFeedback,
    createIssueReport, getNotifications, getUnreadCount, markAllAsRead, resolveIssueReport,
    getArticleHistory, duplicateArticle, getRecentEdits, bulkUpdateStatus, bulkMoveCategory, bulkDelete,
    createCategory, updateCategory, deleteCategory, deleteCategoryWithMigration, reorderCategories,
  };
}

export default useKnowledgeBase;
