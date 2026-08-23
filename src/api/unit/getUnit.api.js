import API_BASE_URL from '../../config/api.config';
import { filterVisibleUnits } from '../../utils/visibilityManager';

const URL = `${API_BASE_URL}/unit/getUnit`;

const getUnit = (setLoading, setUnitData, questionTypeID, subjectID, includeHidden = false) => {
    setLoading(true);
    fetch(`${URL}/${questionTypeID}/${subjectID}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setLoading(false);
                const allUnits = responseJson.allUnit || [];
                const finalUnits = includeHidden ? allUnits : filterVisibleUnits(allUnits);
                setUnitData(finalUnits);
            } else {
                console.log(responseJson.message);
                setLoading(false);
            }
        })
        .catch((error) => {
            console.log(error.message);
            setLoading(false);
        });
};

export default getUnit;