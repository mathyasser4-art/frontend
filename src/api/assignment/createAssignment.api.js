import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';

const URL = `${API_BASE_URL}/assignment/createAssignment`;

const createAssignment = (data, setError, setLoadingOperation, setPocketNumber, setQuestionList, closeQuestionList, setTimer, setTitle, setClassesBox, setForceFlashMode, setAssignmentFlashSpeed) => {
    const Token = safeLocalStorage.getItem('O_authWEB');

    setLoadingOperation(true)
    fetch(`${URL}`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${Token}`
        },
        body: JSON.stringify(data)
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setLoadingOperation(false)
                setPocketNumber(0)
                setQuestionList([])
                setTimer('')
                setTitle('')
                setClassesBox([])
                if (setForceFlashMode) setForceFlashMode(false)
                if (setAssignmentFlashSpeed) setAssignmentFlashSpeed(1.0)
                closeQuestionList()
                safeLocalStorage.removeItem('cartona')
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

export default createAssignment;