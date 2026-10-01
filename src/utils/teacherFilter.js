import { safeLocalStorage } from './safeStorage';
import API_BASE_URL from '../config/api.config';

/**
 * Normalizes subject names to recognize core curriculum subjects in both English & Arabic
 */
export const normalizeSubjectType = (subjectName) => {
    if (!subjectName) return '';
    const raw = String(subjectName).toLowerCase().trim();
    if (raw.includes('math') || raw.includes('رياضيات') || raw.includes('حساب')) return 'math';
    if (raw.includes('scien') || raw.includes('علوم') || raw.includes('ساينس') || raw.includes('phy') || raw.includes('chem') || raw.includes('bio')) return 'science';
    if (raw.includes('eng') || raw.includes('انجليز') || raw.includes('english')) return 'english';
    if (raw.includes('arab') || raw.includes('عرب') || raw.includes('لغة عربية')) return 'arabic';
    if (raw.includes('social') || raw.includes('دراسات') || raw.includes('geog') || raw.includes('hist') || raw.includes('تاريخ') || raw.includes('جغرافيا')) return 'social_studies';
    return raw;
};

/**
 * Filter systems (grades) for the logged-in teacher based on their assigned grades.
 * If user is not a Teacher, returns all systems.
 * If teacher has assignedSystemList in localStorage, filters by those IDs or names.
 * If teacher has no assigned grades yet, defaults to Grade 4 as fallback.
 */
export const filterTeacherSystems = (systems) => {
    if (!systems || !Array.isArray(systems)) return [];
    const role = safeLocalStorage.getItem('auth_role');
    if (role !== 'Teacher') return systems;

    let assigned = [];
    try {
        const raw = safeLocalStorage.getItem('teacher_assigned_systems');
        if (raw) assigned = JSON.parse(raw);
    } catch (e) {}

    if (assigned && assigned.length > 0) {
        const filtered = systems.filter(sys => {
            return assigned.some(a => {
                const assignedId = String(a._id || a);
                const assignedName = String(a.systemName || a).toLowerCase().trim();
                return assignedId === String(sys._id) || assignedName === String(sys.systemName).toLowerCase().trim();
            });
        });
        if (filtered.length > 0) return filtered;
    }

    // Default fallback for legacy teachers without assigned grades: Grade 4
    const grade4 = systems.filter(sys => String(sys.systemName || '').toLowerCase().includes('grade 4'));
    return grade4.length > 0 ? grade4 : systems.slice(0, 1);
};

/**
 * Filter subjects for the logged-in teacher based on their assigned subject.
 * If user is not a Teacher, returns all subjects.
 * If teacher has an assigned subject (e.g. Math, Science), filters subjects to only matching ones.
 */
export const filterTeacherSubjects = (subjects) => {
    if (!subjects || !Array.isArray(subjects)) return [];
    const role = safeLocalStorage.getItem('auth_role');
    if (role !== 'Teacher') return subjects;

    const teacherSubjectRaw = safeLocalStorage.getItem('teacher_subject_name') || safeLocalStorage.getItem('teacher_subject') || '';
    if (!teacherSubjectRaw) return subjects;

    const targetType = normalizeSubjectType(teacherSubjectRaw);

    const filtered = subjects.filter(sub => {
        const subName = sub.subjectName || sub.schoolSubjectName || '';
        const thisType = normalizeSubjectType(subName);
        if (targetType === thisType) return true;
        // Fallback substring check
        return String(subName).toLowerCase().includes(targetType);
    });

    return filtered.length > 0 ? filtered : subjects;
};

/**
 * Fetch and update teacher's assigned grades and subject from backend /teacher/myScope
 */
export const fetchAndCacheTeacherScope = async () => {
    const role = safeLocalStorage.getItem('auth_role');
    const token = safeLocalStorage.getItem('O_authWEB');
    if (role !== 'Teacher' || !token) return;

    try {
        const res = await fetch(`${API_BASE_URL}/teacher/myScope`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authrization': `pracYas09${token}`
            }
        });
        const data = await res.json();
        if (data.message === 'success' && data.teacher) {
            const t = data.teacher;
            if (t.subject) {
                const sName = t.subject.schoolSubjectName || t.subject.subjectName || t.subject;
                safeLocalStorage.setItem('teacher_subject', typeof sName === 'string' ? sName : JSON.stringify(sName));
                safeLocalStorage.setItem('teacher_subject_name', typeof sName === 'string' ? sName : (t.subject.schoolSubjectName || ''));
            }
            if (t.assignedSystemList && Array.isArray(t.assignedSystemList)) {
                safeLocalStorage.setItem('teacher_assigned_systems', JSON.stringify(t.assignedSystemList));
            }
        }
    } catch (e) {
        console.warn('Could not fetch teacher scope:', e);
    }
};
