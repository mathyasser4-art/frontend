const URL = 'https://abacus-2ntk.onrender.com/auth/register'

const register = (userData, setError, setLoading, navigate) => {
    setLoading(true)
    fetch(`${URL}`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                navigate(`/verify/${userData.email}`)
            } else {
                setError(responseJson.message)
                setLoading(false)
            }
        })
        .catch((error) => {
            setError(error.message)
            setLoading(false)
        });
}

export default register;