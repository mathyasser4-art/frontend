import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';

const URL = `${API_BASE_URL}/student/getStudent`;

const getStudent = (setLoading, setAllStudent, pageNumber, setStudentNumber, setTotalPage) => {
    const Token = safeLocalStorage.getItem('O_authWEB');

    setLoading(true)
    fetch(`${URL}/${pageNumber}`, {
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
                setAllStudent(responseJson.allStudent)
                setStudentNumber(responseJson.numberOfStudent)
                setTotalPage(responseJson.totalPage)
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

export default getStudent;