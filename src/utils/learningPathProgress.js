/**
 * Learning Path Progress — localStorage-based tracker
 * 
 * Stores per-student, per-subject progress including:
 * - Which chapters have been completed
 * - Star ratings (1-3) for each completed chapter
 * - The current active chapter ID
 * - Timestamp of last update
 */
import { safeLocalStorage } from './safeStorage';

const STORAGE_PREFIX = 'learning_path_progress';

/**
 * Build the localStorage key for a user+subject combination
 */
const getStorageKey = (userId, subjectId) =>
  `${STORAGE_PREFIX}_${userId}_${subjectId}`;

/**
 * Get the full progress object for a user+subject
 * Returns { completedChapters: string[], stars: {[chapterId]: number}, lastUpdated: number }
 */
export const getProgress = (userId, subjectId) => {
  try {
    const key = getStorageKey(userId, subjectId);
    const raw = safeLocalStorage.getItem(key);
    if (!raw) return { completedChapters: [], stars: {}, lastUpdated: 0 };
    const parsed = JSON.parse(raw);
    return {
      completedChapters: parsed.completedChapters || [],
      stars: parsed.stars || {},
      lastUpdated: parsed.lastUpdated || 0,
    };
  } catch (e) {
    console.warn('Failed to read learning path progress:', e);
    return { completedChapters: [], stars: {}, lastUpdated: 0 };
  }
};

/**
 * Mark a chapter as complete with a star rating
 * @param {string} userId
 * @param {string} subjectId
 * @param {string} chapterId
 * @param {number} stars - 0 to 3
 */
export const markChapterComplete = (userId, subjectId, chapterId, stars = 1) => {
  try {
    const progress = getProgress(userId, subjectId);

    // Only add if not already in completed list
    if (!progress.completedChapters.includes(chapterId)) {
      progress.completedChapters.push(chapterId);
    }

    // Update stars (keep the best rating)
    const existingStars = progress.stars[chapterId] || 0;
    progress.stars[chapterId] = Math.max(existingStars, stars);

    progress.lastUpdated = Date.now();

    const key = getStorageKey(userId, subjectId);
    safeLocalStorage.setItem(key, JSON.stringify(progress));
    return progress;
  } catch (e) {
    console.warn('Failed to save learning path progress:', e);
    return null;
  }
};

/**
 * Calculate star rating from a percentage score
 * @param {number} percentage - 0 to 100
 * @returns {number} 0-3 stars
 */
export const calculateStars = (percentage) => {
  if (percentage >= 90) return 3;
  if (percentage >= 70) return 2;
  if (percentage >= 50) return 1;
  return 0;
};

/**
 * Flatten all chapters from all units into a sequential ordered array
 * Each item gets { chapterId, chapterName, unitName, unitIndex, chapterIndex, globalIndex }
 */
export const flattenChapters = (units) => {
  const result = [];
  let globalIndex = 0;

  // Sort units by name (natural sort)
  const sorted = [...units].sort((a, b) =>
    (a.unitName || '').localeCompare(b.unitName || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  );

  sorted.forEach((unit, unitIndex) => {
    const chapters = [...(unit.chapters || [])].sort((a, b) =>
      (a.chapterName || '').localeCompare(b.chapterName || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );

    chapters.forEach((chapter, chapterIndex) => {
      result.push({
        chapterId: chapter._id,
        chapterName: chapter.chapterName,
        unitId: unit._id,
        unitName: unit.unitName,
        unitIndex,
        chapterIndex,
        globalIndex,
      });
      globalIndex++;
    });
  });

  return result;
};

/**
 * Check if a chapter is unlocked (completed or the first uncompleted one)
 * @param {object} progress - from getProgress()
 * @param {string} chapterId
 * @param {Array} allChaptersFlat - from flattenChapters()
 * @returns {'completed' | 'current' | 'locked'}
 */
export const getChapterStatus = (progress, chapterId, allChaptersFlat) => {
  if (progress.completedChapters.includes(chapterId)) {
    return 'completed';
  }

  // Find the first uncompleted chapter — that's the "current" one
  const firstUncompleted = allChaptersFlat.find(
    (c) => !progress.completedChapters.includes(c.chapterId)
  );

  if (firstUncompleted && firstUncompleted.chapterId === chapterId) {
    return 'current';
  }

  return 'locked';
};

/**
 * Get star count for a chapter
 */
export const getStars = (progress, chapterId) => {
  return progress.stars[chapterId] || 0;
};

/**
 * Reset all progress for a user+subject (dev utility)
 */
export const resetProgress = (userId, subjectId) => {
  const key = getStorageKey(userId, subjectId);
  safeLocalStorage.removeItem(key);
};

/**
 * Get overall stats for the learning path
 */
export const getOverallStats = (progress, allChaptersFlat) => {
  const total = allChaptersFlat.length;
  const completed = progress.completedChapters.length;
  const totalStars = Object.values(progress.stars).reduce((sum, s) => sum + s, 0);
  const maxStars = total * 3;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, totalStars, maxStars, percentage };
};
