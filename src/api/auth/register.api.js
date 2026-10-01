import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';

const URL = `${API_BASE_URL}/auth/register`;

const register = (userData, setError, setLoading, navigate) => {
    setLoading(true);
    fetch(`${URL}`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                if (responseJson.userToken) {
                    safeLocalStorage.removeItem('isTrialMode');
                    safeLocalStorage.removeItem('teacher_trial');
                    
                    // Crucial: Set auth token so entire app recognizes user as authenticated
                    safeLocalStorage.setItem('O_authWEB', responseJson.userToken);

                    const assignedRole = userData.role || responseJson.role || 'Student';
                    safeLocalStorage.setItem('auth_role', assignedRole);
                    safeLocalStorage.setItem('pp_name', responseJson.userName || userData.userName);
                    if (responseJson.userID) {
                        safeLocalStorage.setItem('pp_id', responseJson.userID);
                    }
                    if (userData.phone || responseJson.phone) {
                        safeLocalStorage.setItem('user_phone', userData.phone || responseJson.phone);
                    }
                    safeLocalStorage.setItem('is_paid', responseJson.isPaid ? 'true' : 'false');

                    // 3-Day Free Trial default
                    const defaultTrialEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
                    safeLocalStorage.setItem('trial_ends_at', responseJson.trialEndsAt || defaultTrialEnd);
                    safeLocalStorage.setItem('trial_remaining_days', responseJson.remainingDays !== undefined ? responseJson.remainingDays : 3);

                    // School and academy storage
                    const effectiveSchoolName = responseJson.schoolName || responseJson.createdBy?.userName || userData.academy || '';
                    if (effectiveSchoolName) {
                        safeLocalStorage.setItem('school_name', effectiveSchoolName);
                    }
                    if (responseJson.schoolId) {
                        safeLocalStorage.setItem('school_id', responseJson.schoolId);
                    } else if (responseJson.createdBy?._id) {
                        safeLocalStorage.setItem('school_id', responseJson.createdBy._id);
                    } else if (responseJson.createdBy) {
                        safeLocalStorage.setItem('school_id', responseJson.createdBy);
                    }

                    const targetRoute = assignedRole === 'Teacher' ? '/dashboard/teacher' : '/dashboard/student';
                    setTimeout(() => {
                        window.location.href = targetRoute;
                    }, 150);
                } else {
                    navigate('/auth/login');
                }
            } else {
                let msg = responseJson.message;
                if (/email.*already/i.test(msg) || /already exists/i.test(msg)) {
                    msg = 'This username or phone number is already registered. Please log in.';
                }
                setError(msg);
                setLoading(false);
            }
        })
        .catch((error) => {
            setError(error.message);
            setLoading(false);
        });
};

export default register;