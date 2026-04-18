import API_BASE_URL from '../../config/api.config';

const URL = `${API_BASE_URL}/class/addClass`;

const addClass = (data, setError, setLoadingOperation, closeAddPopup, setAllClass) => {
    const token = localStorage.getItem('O_authWEB')
    setLoadingOperation(true)
    fetch(`${URL}`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${token}`
        },
        body: JSON.stringify(data)
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setLoadingOperation(false)
                setAllClass(responseJson.allClasses)
                closeAddPopup()
            } else {
                setError(responseJson.message)
                setLoadingOperation(false)
            }
        })
        .catch((error) => {
            setError(error.message)
            setLoadingOperation(false)
        });
}

export default addClass;
