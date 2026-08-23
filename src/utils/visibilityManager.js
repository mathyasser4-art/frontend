/**
 * Visibility Manager for Abacus Heroes Curriculum Systems, Levels & Units.
 * 
 * Rules:
 * - ALL systems, levels, and units are VISIBLE (ON) by default for all school accounts.
 * - Settings are stored per-school so ALL users in a school (admin, teachers, students) share the same visibility.
 * - The school ID is resolved from localStorage in this priority:
 *     1. 'school_id' (explicit school identifier set at login)
 *     2. 'pp_id' (for School role, pp_id IS the school ID)
 *     3. 'created_by' (fallback)
 * - Hidden systems/units are automatically filtered out from:
 *   1. Student/Teacher System & Worksheets views
 *   2. All 8 Games question bank dropdown selectors
 *   3. Homework & Competition creation wizards
 */

/**
 * Resolve the effective school ID for the current user.
 * School admins: pp_id is the school ID.
 * Teachers/Students: school_id is set at login from createdBy chain.
 */
const resolveSchoolId = (explicitSchoolId) => {
  if (explicitSchoolId) return explicitSchoolId;
  
  const role = localStorage.getItem('auth_role');
  
  // For School/IT role, pp_id IS the school
  if (role === 'School' || role === 'IT') {
    return localStorage.getItem('pp_id') || 'default_school';
  }
  
  // For Teachers/Students, use school_id set at login
  return localStorage.getItem('school_id') || localStorage.getItem('created_by') || localStorage.getItem('teacher_id') || 'default_school';
};

const getSchoolKey = (schoolId) => {
  const effectiveId = resolveSchoolId(schoolId);
  return `school_hidden_units_${effectiveId}`;
};

const getSchoolSystemKey = (schoolId) => {
  const effectiveId = resolveSchoolId(schoolId);
  return `school_hidden_systems_${effectiveId}`;
};

// ========== UNIT-LEVEL VISIBILITY ==========

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
 */
export const setUnitVisibility = (unitId, isVisible, schoolId) => {
  if (!unitId) return;
  const strId = String(unitId);
  let hiddenIds = getHiddenUnitIds(schoolId);

  if (isVisible) {
    hiddenIds = hiddenIds.filter(id => id !== strId);
  } else {
    if (!hiddenIds.includes(strId)) {
      hiddenIds.push(strId);
    }
  }

  localStorage.setItem(getSchoolKey(schoolId), JSON.stringify(hiddenIds));
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
 */
export const filterVisibleUnits = (units, schoolId) => {
  if (!Array.isArray(units)) return [];
  const hiddenIds = getHiddenUnitIds(schoolId);
  if (hiddenIds.length === 0) return units;
  return units.filter(unit => unit && !hiddenIds.includes(String(unit._id)));
};

// ========== SYSTEM-LEVEL VISIBILITY ==========

/**
 * Get the list of hidden system IDs for a school.
 */
export const getHiddenSystemIds = (schoolId) => {
  try {
    const raw = localStorage.getItem(getSchoolSystemKey(schoolId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

/**
 * Check if a specific system is visible (Defaults to true).
 */
export const isSystemVisible = (systemId, schoolId) => {
  if (!systemId) return true;
  const hiddenIds = getHiddenSystemIds(schoolId);
  return !hiddenIds.includes(String(systemId));
};

/**
 * Set visibility for a system.
 */
export const setSystemVisibility = (systemId, isVisible, schoolId) => {
  if (!systemId) return;
  const strId = String(systemId);
  let hiddenIds = getHiddenSystemIds(schoolId);

  if (isVisible) {
    hiddenIds = hiddenIds.filter(id => id !== strId);
  } else {
    if (!hiddenIds.includes(strId)) {
      hiddenIds.push(strId);
    }
  }

  localStorage.setItem(getSchoolSystemKey(schoolId), JSON.stringify(hiddenIds));
  window.dispatchEvent(new CustomEvent('systemVisibilityUpdated', { detail: { systemId: strId, isVisible } }));
};

/**
 * Reset all systems to Visible (ON) for a school.
 */
export const resetAllSystemsVisible = (schoolId) => {
  localStorage.removeItem(getSchoolSystemKey(schoolId));
  window.dispatchEvent(new CustomEvent('systemVisibilityUpdated', { detail: { resetAll: true } }));
};

/**
 * Filter an array of systems so only VISIBLE (ON) systems are returned.
 */
export const filterVisibleSystems = (systems, schoolId) => {
  if (!Array.isArray(systems)) return [];
  const hiddenIds = getHiddenSystemIds(schoolId);
  if (hiddenIds.length === 0) return systems;
  return systems.filter(sys => sys && !hiddenIds.includes(String(sys._id)));
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  resolveSchoolId,
  isUnitVisible,
  setUnitVisibility,
  resetAllUnitsVisible,
  filterVisibleUnits,
  getHiddenUnitIds,
  isSystemVisible,
  setSystemVisibility,
  resetAllSystemsVisible,
  filterVisibleSystems,
  getHiddenSystemIds
};
