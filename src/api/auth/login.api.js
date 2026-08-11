import API_BASE_URL from '../../config/api.config';

const URL = `${API_BASE_URL}/auth/login`;

const ROLE_ROUTES = {
    School: '/dashboard-school',
    IT: '/dashboard-school',
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
                localStorage.removeItem('isTrialMode')
                localStorage.removeItem('teacher_trial')

                localStorage.setItem('O_authWEB', responseJson.userToken);
                localStorage.setItem('auth_role', responseJson.role);
                localStorage.setItem('pp_name', responseJson.userName);
                if (responseJson.role === 'School') {
                    localStorage.setItem('school_name', responseJson.userName);
                } else if (responseJson.schoolName) {
                    localStorage.setItem('school_name', responseJson.schoolName);
                } else if (responseJson.school?.userName) {
                    localStorage.setItem('school_name', responseJson.school.userName);
                } else if (responseJson.createdBy?.userName) {
                    localStorage.setItem('school_name', responseJson.createdBy.userName);
                }
                
                if (responseJson.userID) {
                    localStorage.setItem('pp_id', responseJson.userID);
                }
                if (responseJson.createdBy?._id) {
                    localStorage.setItem('teacher_id', responseJson.createdBy._id);
                } else if (responseJson.createdBy) {
                    localStorage.setItem('teacher_id', responseJson.createdBy);
                }
                if (responseJson.remainingDays !== undefined && responseJson.remainingDays !== null) {
                    localStorage.setItem('trial_remaining_days', responseJson.remainingDays);
                } else {
                    localStorage.removeItem('trial_remaining_days');
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
