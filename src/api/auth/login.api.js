import API_BASE_URL from '../../config/api.config';

const URL = `${API_BASE_URL}/auth/login`;

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
                localStorage.setItem('O_authWEB', responseJson.userToken);
                localStorage.setItem('auth_role', responseJson.role);
                localStorage.setItem('pp_name', responseJson.userName);
                navigate('/dashboard');
            } else {
                setError(responseJson.message);
            }
        })
        .catch((error) => {
            setError(error.message);
        })
        .finally(() => {
            setLoading(false);
        });
};

export default login;