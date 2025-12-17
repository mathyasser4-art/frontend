const URL = 'https://abacus-2ntk.onrender.com/student/search'
const Token = localStorage.getItem('O_authWEB')

const searchStudent = (setLoading, setAllStudent, searchKey) => {
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
                setAllStudent(responseJson.allStudent)
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

export default searchStudent;