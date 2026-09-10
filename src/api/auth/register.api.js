import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';

const URL = `${API_BASE_URL}/auth/register`;

const register = (userData, setError, setLoading, navigate) => {
    setLoading(true)
    fetch(`${URL}`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                // If backend returns token directly, log the user in
                if (responseJson.userToken) {
                    // Clear any trial data when registering a real account
                    safeLocalStorage.removeItem('isTrialMode')
                    safeLocalStorage.removeItem('teacher_trial')
                    
                    safeLocalStorage.setItem('O_authWEB', responseJson.userToken)
                    safeLocalStorage.setItem('auth_role', responseJson.role)
                    safeLocalStorage.setItem('pp_name', responseJson.userName)
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 100);
                } else {
                    // Otherwise redirect to login page
                    navigate('/auth/login')
                }
            } else {
                setError(responseJson.message)
                setLoading(false)
            }
        })
        .catch((error) => {
            setError(error.message)
            setLoading(false)
        });
}

export default register;