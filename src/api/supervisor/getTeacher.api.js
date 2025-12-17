const URL = 'https://abacus-2ntk.onrender.com/supervisor/getAllTeachers'
const Token = localStorage.getItem('O_authWEB')

const getTeacher = (setAllTecaher) => {
    fetch(`${URL}`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${Token}`
        },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setAllTecaher(responseJson.allTeachers)
            } else {
                console.log(responseJson.message)
            }
        })
        .catch((error) => {
            console.log(error.message)
        });
}

export default getTeacher;