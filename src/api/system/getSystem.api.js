import API_BASE_URL from '../../config/api.config';

const URL = `${API_BASE_URL}/system/getAllSystem`;

const getSystem = (setLoading, setSystemData) => {
    setLoading(true)
    fetch(`${URL}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setLoading(false)
                setSystemData(responseJson.allSystem)
            } else {
                console.log(responseJson.message)
                setLoading(false)
            }
        })
        .catch((error) => {
            console.log(error.message)
            setLoading(false)
        });
}

export default getSystem;