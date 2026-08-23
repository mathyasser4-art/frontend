import API_BASE_URL from '../../config/api.config';
import { filterVisibleSystems } from '../../utils/visibilityManager';

const getSystem = (setLoading, setSystemData, questionTypeID, includeHidden = false) => {
    setLoading(true)
    // Load all systems without filtering by questionTypeID
    const URL = `${API_BASE_URL}/system/getAllSystem`;
    
    fetch(`${URL}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setLoading(false)
                const allSystems = responseJson.allSystem || [];
                const finalSystems = includeHidden ? allSystems : filterVisibleSystems(allSystems);
                setSystemData(finalSystems)
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