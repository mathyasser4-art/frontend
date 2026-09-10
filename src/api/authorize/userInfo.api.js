import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';

const URL = `${API_BASE_URL}/user/userAuthorize`;

const userInfo = (userToken, setLoading, setUserData) => {
    setLoading(true)
    fetch(`${URL}/${userToken}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setLoading(false)
                setUserData(responseJson.userInfo)
                if (responseJson.userInfo?.role === 'School') {
                    safeLocalStorage.setItem('school_name', responseJson.userInfo.userName)
                } else if (responseJson.userInfo?.createdBy?.userName) {
                    safeLocalStorage.setItem('school_name', responseJson.userInfo.createdBy.userName)
                }
                if (responseJson.remainingDays !== undefined && responseJson.remainingDays !== null) {
                    safeLocalStorage.setItem('trial_remaining_days', responseJson.remainingDays);
                } else if (responseJson.userInfo?.remainingDays !== undefined && responseJson.userInfo?.remainingDays !== null) {
                    safeLocalStorage.setItem('trial_remaining_days', responseJson.userInfo.remainingDays);
                }
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

export default userInfo;