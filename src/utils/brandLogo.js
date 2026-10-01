import defaultLogo from '../logo.png';
import mrshahinSvg from '../mrshahin_logo.svg';

/**
 * Checks if the current session belongs to a SAT School account.
 * (Teacher, Student, School Admin, Supervisor, IT, or schoolName matching SAT / MrShahin)
 */
export const isSatSchoolAccount = () => {
  try {
    const isAuth = Boolean(localStorage.getItem('O_authWEB') || localStorage.getItem('userToken'));
    if (!isAuth) return false;

    const role = (localStorage.getItem('auth_role') || '').trim();
    const schoolName = (localStorage.getItem('school_name') || '').toLowerCase().trim();
    const teacherName = (localStorage.getItem('pp_name') || '').toLowerCase().trim();

    // SAT School Account conditions
    if (
      schoolName.includes('sat') ||
      schoolName.includes('shahin') ||
      schoolName.includes('bluepaper') ||
      schoolName === 'sat school' ||
      teacherName.includes('shahin') ||
      ['Teacher', 'School', 'Student', 'Supervisor', 'IT'].includes(role) ||
      Boolean(role) // Any authenticated role on this platform
    ) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
};

/**
 * Returns the appropriate logo source based on account type.
 */
export const getActiveLogo = () => {
  if (isSatSchoolAccount()) {
    return mrshahinSvg;
  }
  return defaultLogo;
};

export default {
  isSatSchoolAccount,
  getActiveLogo,
  mrshahinLogo: mrshahinSvg,
  defaultLogo: defaultLogo
};
