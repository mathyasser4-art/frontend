import axios from "axios";

const updateProfile = async (data, setError, setLoadingOperation, closePopup, setUserData) => {
    try {
        setLoadingOperation(true)
        const userToken = localStorage.getItem('O_authWEB')
        let req = await axios.put(`${process.env.REACT_APP_BASE_URL}/user/updateProfile`, data, {
            headers: {
                Authorization: `abacus__${userToken}`
            }
        })
        let res = req.data
        if (res.message === 'success') {
            setUserData(prev => ({ ...prev, userName: res.userName }))
            // we update local storage pp_name just in case it is used by navbar
            localStorage.setItem('pp_name', res.userName)
            closePopup()
            setLoadingOperation(false)
            setError(null)
            window.location.reload()
        } else {
            setLoadingOperation(false)
            setError(res.message)
        }
    } catch (error) {
        setLoadingOperation(false)
        setError(error.message)
    }
}

export default updateProfile
