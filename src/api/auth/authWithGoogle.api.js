import API_BASE_URL from '../../config/api.config';

const URL = `${API_BASE_URL}/auth/google`;

const ROLE_ROUTES = {
    School: '/dashboard-school',
    IT: '/dashboard-school',
    Teacher: '/dashboard/teacher',
    Student: '/dashboard/student',
    Supervisor: '/dashboard/supervisor',
};

const authWithGoogle = (data, navigate) => {
    fetch(`${URL}`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                // Clear any trial data when logging in with Google
                localStorage.removeItem('isTrialMode')
                localStorage.removeItem('teacher_trial')
                
                localStorage.setItem('O_authWEB', responseJson.userToken)
                localStorage.setItem('auth_role', responseJson.role)
                localStorage.setItem('pp_name', responseJson.userName)
                if (responseJson.userID) {
                    localStorage.setItem('pp_id', responseJson.userID)
                }
                const route = ROLE_ROUTES[responseJson.role] || '/'
                navigate(route)
            } else {
                console.log(responseJson.message)
            }
        })
        .catch((error) => {
            console.log(error.message)
        });
}

export default authWithGoogle;
