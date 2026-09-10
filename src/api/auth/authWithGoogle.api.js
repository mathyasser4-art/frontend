import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';

const URL = `${API_BASE_URL}/auth/google`;

const authWithGoogle = (data) => {
    fetch(`${URL}`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                // Clear any trial data when logging in with Google
                safeLocalStorage.removeItem('isTrialMode')
                safeLocalStorage.removeItem('teacher_trial')
                
                safeLocalStorage.setItem('O_authWEB', responseJson.userToken)
                window.location.reload();
            } else {
                console.log(responseJson.message)
            }
        })
        .catch((error) => {
            console.log(error.message)
        });
}

export default authWithGoogle;