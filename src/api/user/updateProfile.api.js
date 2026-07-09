import API_BASE_URL from '../../config/api.config';

const URL = `${API_BASE_URL}/user/updateProfile`;

const updateProfile = (data, setError, setLoadingOperation, closePopup, setUserData) => {
    setLoadingOperation(true);
    const currentToken = localStorage.getItem('O_authWEB');
    fetch(URL, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${currentToken}`
        },
        body: JSON.stringify(data)
    })
    .then((response) => response.json())
    .then((responseJson) => {
        if (responseJson.message === 'success') {
            setUserData(prev => ({ ...prev, userName: responseJson.userName }));
            localStorage.setItem('pp_name', responseJson.userName);
            closePopup();
            setLoadingOperation(false);
            setError(null);
            window.location.reload();
        } else {
            setLoadingOperation(false);
            setError(responseJson.message);
        }
    })
    .catch((error) => {
        setLoadingOperation(false);
        setError(error.message);
    });
}

export default updateProfile;
