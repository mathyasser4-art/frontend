import API_BASE_URL from '../../config/api.config';

const URL = `${API_BASE_URL}/auth/login`

const login = (userData, setError, setLoading, navigate, showAlert) => {
    setLoading(true)
    fetch(`${URL}`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                localStorage.setItem('O_authWEB', responseJson.userToken)
                localStorage.setItem('auth_role', responseJson.role)
                localStorage.setItem('pp_name', responseJson.userName)
                window.location.reload();
            } else if (responseJson.isVerify === false) {
                setLoading(false)
                setError('')
                showAlert()
                setTimeout(() => {
                    navigate(`/verify/${userData.email}`)
                }, 3600);
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

export default login;