/**
 * Learning Path Progress — localStorage + Cloud Backend sync tracker
 */
import { safeLocalStorage } from './safeStorage';
import { API_BASE_URL } from '../config/api.config';

const STORAGE_PREFIX = 'learning_path_progress';

const getStorageKey = (userId, subjectId) =>
  `${STORAGE_PREFIX}_${userId}_${subjectId}`;

/**
 * Get the full progress object for a user+subject
 */
export const getProgress = (userId, subjectId) => {
  try {
    const key = getStorageKey(userId, subjectId);
    const raw = safeLocalStorage.getItem(key);
    if (!raw) return { completedChapters: [], stars: {}, scores: {}, lastUpdated: 0 };
    const parsed = JSON.parse(raw);
    return {
      completedChapters: parsed.completedChapters || [],
      stars: parsed.stars || {},
      scores: parsed.scores || {},
      lastUpdated: parsed.lastUpdated || 0,
    };
  } catch (e) {
    console.warn('Failed to read learning path progress:', e);
    return { completedChapters: [], stars: {}, scores: {}, lastUpdated: 0 };
  }
};

/**
 * Mark a chapter as complete with a star rating and percentage score
 */
export const markChapterComplete = (userId, subjectId, chapterId, stars = 1, percentage = 0, totalQuestions = 0) => {
  try {
    const progress = getProgress(userId, subjectId);

    if (!progress.completedChapters.includes(chapterId)) {
      progress.completedChapters.push(chapterId);
    }

    const existingStars = progress.stars[chapterId] || 0;
    progress.stars[chapterId] = Math.max(existingStars, stars);

    progress.scores = progress.scores || {};
    const existingScore = progress.scores[chapterId] || 0;
    progress.scores[chapterId] = Math.max(existingScore, percentage);

    progress.lastUpdated = Date.now();

    const key = getStorageKey(userId, subjectId);
    safeLocalStorage.setItem(key, JSON.stringify(progress));

    // Cloud backend synchronization (non-blocking)
    if (userId && userId !== 'guest') {
      syncJourneyProgressWithBackend(userId, subjectId, chapterId, progress.stars[chapterId], progress.scores[chapterId], totalQuestions);
    }

    return progress;
  } catch (e) {
    console.warn('Failed to save learning path progress:', e);
    return null;
  }
};

/**
 * Sync single chapter or batch progress to backend MongoDB
 */
export const syncJourneyProgressWithBackend = async (userId, subjectId, chapterId, stars, percentage, totalQuestions = 0) => {
  if (!userId || userId === 'guest' || !subjectId) return;
  try {
    const token = safeLocalStorage.getItem('O_authWEB');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = token;

    await fetch(`${API_BASE_URL}/journey/saveProgress`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        studentId: userId,
        subjectId,
        chapterId,
        stars,
        percentage,
        totalQuestions
      })
    });
  } catch (err) {
    console.warn('Background sync to /journey/saveProgress failed:', err.message);
  }
};

/**
 * Fetch progress from backend for a specific student + subject and merge into localStorage
 */
export const fetchBackendJourneyProgress = async (userId, subjectId) => {
  if (!userId || userId === 'guest' || !subjectId) return getProgress(userId, subjectId);
  try {
    const token = safeLocalStorage.getItem('O_authWEB');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = token;

    const res = await fetch(`${API_BASE_URL}/journey/getProgress/${userId}/${subjectId}`, {
      headers
    });
    const data = await res.json();

    if (data && data.message === 'success' && data.progress) {
      const local = getProgress(userId, subjectId);
      const mergedCompleted = Array.from(new Set([...(local.completedChapters || []), ...(data.progress.completedChapters || [])]));
      const mergedStars = { ...(local.stars || {}), ...(data.progress.stars || {}) };
      const mergedScores = { ...(local.scores || {}), ...(data.progress.scores || {}) };

      const merged = {
        completedChapters: mergedCompleted,
        stars: mergedStars,
        scores: mergedScores,
        lastUpdated: Math.max(local.lastUpdated || 0, new Date(data.progress.lastUpdated || 0).getTime())
      };

      const key = getStorageKey(userId, subjectId);
      safeLocalStorage.setItem(key, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('fetchBackendJourneyProgress failed:', err.message);
  }
  return getProgress(userId, subjectId);
};

/**
 * Fetch student journey overview (all systems + completion percentages)
 */
export const fetchStudentJourneyOverview = async (userId) => {
  if (!userId || userId === 'guest') return null;
  try {
    const token = safeLocalStorage.getItem('O_authWEB');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = token;

    const res = await fetch(`${API_BASE_URL}/journey/systemOverview/${userId}`, {
      headers
    });
    const data = await res.json();
    if (data && data.message === 'success') {
      return data.overview || [];
    }
  } catch (err) {
    console.warn('fetchStudentJourneyOverview failed:', err.message);
  }
  return null;
};

/**
 * Calculate star rating from a percentage score
 */
export const calculateStars = (percentage) => {
  if (percentage >= 90) return 3;
  if (percentage >= 70) return 2;
  if (percentage >= 50) return 1;
  return 0;
};

/**
 * Flatten all chapters from all units into a sequential ordered array
 */
export const flattenChapters = (units) => {
  const result = [];
  let globalIndex = 0;

  const sorted = [...units].sort((a, b) =>
    (a.unitName || '').localeCompare(b.unitName || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  );

  sorted.forEach((unit, uIdx) => {
    (unit.chapters || []).forEach((chapter, cIdx) => {
      result.push({
        chapterId: chapter._id || chapter.chapterId,
        chapterName: chapter.chapterName || `Lesson ${cIdx + 1}`,
        unitName: unit.unitName || `Unit ${uIdx + 1}`,
        unitIndex: uIdx,
        chapterIndex: cIdx,
        globalIndex: globalIndex++,
        questionsCount: chapter.questions?.length || 0,
      });
    });
  });

  return result;
};

/**
 * Determine a chapter's status: 'completed' | 'current' | 'locked'
 */
export const getChapterStatus = (progress, chapterId, allChaptersFlat) => {
  const index = allChaptersFlat.findIndex((c) => c.chapterId === chapterId);
  if (index === -1) return 'locked';

  if (index === 0) {
    const score = progress.scores?.[chapterId];
    if (score >= 70 || progress.completedChapters.includes(chapterId)) return 'completed';
    return 'current';
  }

  const prevChapter = allChaptersFlat[index - 1];
  const prevScore = progress.scores?.[prevChapter.chapterId] || 0;

  if (prevScore >= 70 || progress.completedChapters.includes(prevChapter.chapterId)) {
    const score = progress.scores?.[chapterId];
    if (score >= 70 || progress.completedChapters.includes(chapterId)) {
      return 'completed';
    }
    return 'current';
  }

  return 'locked';
};

export const getStars = (progress, chapterId) => {
  return progress.stars?.[chapterId] || 0;
};

export const getScore = (progress, chapterId) => {
  return progress.scores?.[chapterId] || 0;
};

export const getOverallStats = (progress, allChaptersFlat) => {
  const total = allChaptersFlat.length;
  const completed = progress.completedChapters.length;
  const totalStars = Object.values(progress.stars).reduce((sum, s) => sum + s, 0);
  const maxStars = total * 3;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, totalStars, maxStars, percentage };
};

export const resetProgress = (userId, subjectId) => {
  const key = getStorageKey(userId, subjectId);
  safeLocalStorage.removeItem(key);
};
