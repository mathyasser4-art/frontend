import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';

const URL = `${API_BASE_URL}/supervisor/supervisorDeatails`;

const supervisorDeatails = (setLoading, setSupervisorName, setTeacherList) => {
    const Token = safeLocalStorage.getItem('O_authWEB');

    setLoading(true)
    fetch(URL, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${Token}`
        },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setLoading(false)
                setSupervisorName(responseJson.supervisor?.userName)
                setTeacherList(responseJson.supervisor?.teacherList)
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

export default supervisorDeatails;