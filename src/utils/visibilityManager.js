/**
 * Visibility Manager for Abacus Heroes Curriculum Levels & Units.
 * 
 * Rules:
 * - ALL levels and units are VISIBLE (ON) by default for all school accounts.
 * - When a school admin toggles a unit OFF, its ID is saved to the hidden units set for that school.
 * - Any level/unit marked as OFF is automatically filtered out from:
 *   1. Student/Teacher Worksheets view (/unit)
 *   2. All 8 Games question bank dropdown selectors
 *   3. Homework & Competition creation wizards
 */

const getSchoolKey = (schoolId) => {
  const effectiveId = schoolId || localStorage.getItem('pp_id') || localStorage.getItem('user_id') || 'default_school';
  return `school_hidden_units_${effectiveId}`;
};

/**
 * Get the list of hidden unit IDs for a school.
 */
export const getHiddenUnitIds = (schoolId) => {
  try {
    const raw = localStorage.getItem(getSchoolKey(schoolId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

/**
 * Check if a specific unit is visible (Defaults to true).
 */
export const isUnitVisible = (unitId, schoolId) => {
  if (!unitId) return true;
  const hiddenIds = getHiddenUnitIds(schoolId);
  return !hiddenIds.includes(String(unitId));
};

/**
 * Set visibility for a unit.
 * @param {string} unitId 
 * @param {boolean} isVisible 
 * @param {string} schoolId 
 */
export const setUnitVisibility = (unitId, isVisible, schoolId) => {
  if (!unitId) return;
  const strId = String(unitId);
  let hiddenIds = getHiddenUnitIds(schoolId);

  if (isVisible) {
    // Remove from hidden
    hiddenIds = hiddenIds.filter(id => id !== strId);
  } else {
    // Add to hidden
    if (!hiddenIds.includes(strId)) {
      hiddenIds.push(strId);
    }
  }

  localStorage.setItem(getSchoolKey(schoolId), JSON.stringify(hiddenIds));
  // Dispatch custom event for real-time reactivity across open components
  window.dispatchEvent(new CustomEvent('unitVisibilityUpdated', { detail: { unitId: strId, isVisible } }));
};

/**
 * Reset all units to Visible (ON) for a school.
 */
export const resetAllUnitsVisible = (schoolId) => {
  localStorage.removeItem(getSchoolKey(schoolId));
  window.dispatchEvent(new CustomEvent('unitVisibilityUpdated', { detail: { resetAll: true } }));
};

/**
 * Filter an array of units so only VISIBLE (ON) units are returned.
 * @param {Array} units 
 * @param {string} schoolId 
 * @returns {Array} filtered units
 */
export const filterVisibleUnits = (units, schoolId) => {
  if (!Array.isArray(units)) return [];
  const hiddenIds = getHiddenUnitIds(schoolId);
  if (hiddenIds.length === 0) return units; // Fast path: all ON
  return units.filter(unit => unit && !hiddenIds.includes(String(unit._id)));
};

export default {
  isUnitVisible,
  setUnitVisibility,
  resetAllUnitsVisible,
  filterVisibleUnits,
  getHiddenUnitIds
};
