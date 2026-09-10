import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';

const URL = `${API_BASE_URL}/student/deleteStudent`;

const removeStudent = (studentID, setError, setLoadingOperation, closeRemovePopup, pageNumber, setAllStudent, setStudentNumber, setTotalPage) => {
    const Token = safeLocalStorage.getItem('O_authWEB');

    setLoadingOperation(true)
    fetch(`${URL}/${studentID}/${pageNumber}`, {
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
                setAllStudent(responseJson.allStudent)
                setStudentNumber(responseJson.numberOfStudent)
                setTotalPage(responseJson.totalPage)
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

export default removeStudent;