const URL = 'https://abacus-2ntk.onrender.com/class/getAllClass'
const Token = localStorage.getItem('O_authWEB')

const getClass = (setLoading, setAllClass) => {
    setLoading(true)
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
                setLoading(false)
                setAllClass(responseJson.allClasses)
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

export default getClass;