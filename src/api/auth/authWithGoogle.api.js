const URL = 'https://abacus-2ntk.onrender.com/auth/google'

const authWithGoogle = (data) => {
    fetch(`${URL}`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                localStorage.setItem('O_authWEB', responseJson.userToken)
                window.location.reload();
            } else {
                console.log(responseJson.message)
            }
        })
        .catch((error) => {
            console.log(error.message)
        });
}

export default authWithGoogle;