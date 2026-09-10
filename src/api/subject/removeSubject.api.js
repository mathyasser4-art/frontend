import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';

const URL = `${API_BASE_URL}/schoolSubject/removeSchoolSubject`;

const removeSubject = (subjectID, setError, setLoadingOperation, closeRemovePopup, setAllSubject) => {
    const Token = safeLocalStorage.getItem('O_authWEB');

    setLoadingOperation(true)
    fetch(`${URL}/${subjectID}`, {
        method: 'delete',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${Token}`
        },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setLoadingOperation(false)
                setAllSubject(responseJson.allSubject)
                closeRemovePopup()
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

export default removeSubject;