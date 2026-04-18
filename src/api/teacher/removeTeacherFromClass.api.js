import API_BASE_URL from '../../config/api.config';

const URL = `${API_BASE_URL}/teacher/removeTeacherFromClass`;

const removeTeacherFromClass = (setLoadingOperation, setError, setTeacherList, classID, teacherID, setAllClass) => {
    const token = localStorage.getItem('O_authWEB')
    setLoadingOperation(true)
    fetch(`${URL}/${teacherID}/${classID}`, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${token}`
        },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setLoadingOperation(false)
                setTeacherList(responseJson.newClass.teachers)
                setAllClass(responseJson.allClasses)
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

export default removeTeacherFromClass;
