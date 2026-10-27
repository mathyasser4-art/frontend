import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';

const URL = `${API_BASE_URL}/auth/login`;

const ROLE_ROUTES = {
    School: '/dashboard-school',
    IT: '/dashboard-school',
    Organization: '/dashboard-school',
    Teacher: '/',
    Student: '/dashboard/student',
    Supervisor: '/dashboard/supervisor',
};

const login = (userData, setError, setLoading, navigate, showAlert) => {
    setLoading(true);
    fetch(`${URL}`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                // Clear any trial data when logging in with a real account
                safeLocalStorage.removeItem('isTrialMode')
                safeLocalStorage.removeItem('teacher_trial')

                safeLocalStorage.setItem('O_authWEB', responseJson.userToken);
                safeLocalStorage.setItem('auth_role', responseJson.role);
                safeLocalStorage.setItem('pp_name', responseJson.userName);
                if (responseJson.role === 'School' || responseJson.role === 'Organization') {
                    safeLocalStorage.setItem('school_name', responseJson.userName);
                } else if (responseJson.schoolName) {
                    safeLocalStorage.setItem('school_name', responseJson.schoolName);
                } else if (responseJson.school?.userName) {
                    safeLocalStorage.setItem('school_name', responseJson.school.userName);
                } else if (responseJson.createdBy?.userName) {
                    safeLocalStorage.setItem('school_name', responseJson.createdBy.userName);
                }
                
                if (responseJson.userID) {
                    safeLocalStorage.setItem('pp_id', responseJson.userID);
                }
                if (responseJson.createdBy?._id) {
                    safeLocalStorage.setItem('teacher_id', responseJson.createdBy._id);
                } else if (responseJson.createdBy) {
                    safeLocalStorage.setItem('teacher_id', responseJson.createdBy);
                }
                // Persist school_id so all users in a school share visibility settings
                if (responseJson.role === 'School' || responseJson.role === 'IT' || responseJson.role === 'Organization') {
                    // School/Organization admin: their own ID is the school ID
                    safeLocalStorage.setItem('school_id', responseJson.userID);
                } else if (responseJson.school?._id) {
                    safeLocalStorage.setItem('school_id', responseJson.school._id);
                } else if (responseJson.schoolId) {
                    safeLocalStorage.setItem('school_id', responseJson.schoolId);
                } else if (responseJson.createdBy?._id) {
                    // For teachers: createdBy is the school
                    safeLocalStorage.setItem('school_id', responseJson.createdBy._id);
                } else if (responseJson.createdBy && typeof responseJson.createdBy === 'string') {
                    safeLocalStorage.setItem('school_id', responseJson.createdBy);
                }
                if (responseJson.remainingDays !== undefined && responseJson.remainingDays !== null) {
                    safeLocalStorage.setItem('trial_remaining_days', responseJson.remainingDays);
                } else {
                    safeLocalStorage.removeItem('trial_remaining_days');
                }
                if (responseJson.isPaid !== undefined) {
                    safeLocalStorage.setItem('is_paid', responseJson.isPaid ? 'true' : 'false');
                } else {
                    safeLocalStorage.setItem('is_paid', 'false');
                }
                if (responseJson.trialEndsAt) {
                    safeLocalStorage.setItem('trial_ends_at', responseJson.trialEndsAt);
                } else {
                    safeLocalStorage.removeItem('trial_ends_at');
                }
                if (responseJson.phone) {
                    safeLocalStorage.setItem('user_phone', responseJson.phone);
                }
                if (responseJson.referralCode) {
                    safeLocalStorage.setItem('referral_code', responseJson.referralCode);
                }
                if (responseJson.isFeaturesUnlocked !== undefined) {
                    safeLocalStorage.setItem('is_features_unlocked', responseJson.isFeaturesUnlocked ? 'true' : 'false');
                }
                if (responseJson.featuresUnlockedUntil) {
                    safeLocalStorage.setItem('features_unlocked_until', responseJson.featuresUnlockedUntil);
                } else {
                    safeLocalStorage.removeItem('features_unlocked_until');
                }
                if (responseJson.sharePassExpiresAt) {
                    safeLocalStorage.setItem('share_pass_expires_at', responseJson.sharePassExpiresAt);
                } else {
                    safeLocalStorage.removeItem('share_pass_expires_at');
                }
                if (responseJson.role === 'Teacher') {
                    if (responseJson.subject) {
                        const sName = responseJson.subject.schoolSubjectName || responseJson.subject.subjectName || responseJson.subject;
                        safeLocalStorage.setItem('teacher_subject', typeof sName === 'string' ? sName : JSON.stringify(sName));
                        safeLocalStorage.setItem('teacher_subject_name', typeof sName === 'string' ? sName : (responseJson.subject.schoolSubjectName || ''));
                    }
                    if (responseJson.assignedSystemList && Array.isArray(responseJson.assignedSystemList)) {
                        safeLocalStorage.setItem('teacher_assigned_systems', JSON.stringify(responseJson.assignedSystemList));
                    }
                }
                const route = ROLE_ROUTES[responseJson.role] || '/';
                window.location.href = route;
            } else {
                let errorMsg = responseJson.message;
                if (errorMsg === 'This email is not registered' || errorMsg === 'Incorrect password') {
                    errorMsg = 'Incorrect username or password';
                }
                setError(errorMsg);
                if (typeof showAlert === 'function') {
                    showAlert();
                }
            }
        })
        .catch((error) => {
            setError(error.message);
            if (typeof showAlert === 'function') {
                showAlert();
            }
        })
        .finally(() => {
            setLoading(false);
        });
};

export default login;
