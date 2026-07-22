import API_BASE_URL from '../../config/api.config';

const URL = `${API_BASE_URL}/teacher/search`;

const searchTeacher = (setLoading, setAllTeacher, searchKey) => {
    const Token = localStorage.getItem('O_authWEB');

    setLoading(true)
    fetch(`${URL}/${searchKey}`, {
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
                setAllTeacher(responseJson.allTeachers)
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

export default searchTeacher;