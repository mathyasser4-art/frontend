const URL = 'https://abacus-2ntk.onrender.com/supervisor/getSupervisor'
const Token = localStorage.getItem('O_authWEB')

const getSupervisor = (setLoading, setAllSupervisor, setSupervisorNumber) => {
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
                setAllSupervisor(responseJson.allSupervisor)
                setSupervisorNumber(responseJson.numberOfSupervisor)
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

export default getSupervisor;