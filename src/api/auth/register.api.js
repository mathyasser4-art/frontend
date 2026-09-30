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
                // If backend returns token directly, log the user in with 3-day trial
                if (responseJson.userToken) {
                    safeLocalStorage.removeItem('isTrialMode');
                    safeLocalStorage.removeItem('teacher_trial');
                    
                    safeLocalStorage.setItem('O_authWEB', responseJson.userToken);
                    safeLocalStorage.setItem('auth_role', responseJson.role || 'Student');
                    safeLocalStorage.setItem('pp_name', responseJson.userName);
                    if (responseJson.userID) {
                        safeLocalStorage.setItem('pp_id', responseJson.userID);
                    }
                    if (responseJson.phone) {
                        safeLocalStorage.setItem('user_phone', responseJson.phone);
                    }
                    safeLocalStorage.setItem('is_paid', responseJson.isPaid ? 'true' : 'false');
                    if (responseJson.trialEndsAt) {
                        safeLocalStorage.setItem('trial_ends_at', responseJson.trialEndsAt);
                    }
                    if (responseJson.remainingDays !== undefined) {
                        safeLocalStorage.setItem('trial_remaining_days', responseJson.remainingDays);
                    }
                    setTimeout(() => {
                        window.location.href = '/dashboard/student';
                    }, 150);
                } else {
                    navigate('/auth/login');
                }
            } else {
                setError(responseJson.message);
                setLoading(false);
            }
        })
        .catch((error) => {
            setError(error.message);
            setLoading(false);
        });
};

export default register;