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
                if (responseJson.userInfo?.isPaid !== undefined) {
                    safeLocalStorage.setItem('is_paid', responseJson.userInfo.isPaid ? 'true' : 'false');
                }
                if (responseJson.userInfo?.trialEndsAt) {
                    safeLocalStorage.setItem('trial_ends_at', responseJson.userInfo.trialEndsAt);
                }
                if (responseJson.userInfo?.phone) {
                    safeLocalStorage.setItem('user_phone', responseJson.userInfo.phone);
                }
                if (responseJson.remainingDays !== undefined && responseJson.remainingDays !== null) {
                    safeLocalStorage.setItem('trial_remaining_days', responseJson.remainingDays);
                } else if (responseJson.userInfo?.remainingDays !== undefined && responseJson.userInfo?.remainingDays !== null) {
                    safeLocalStorage.setItem('trial_remaining_days', responseJson.userInfo.remainingDays);
                }
                if (responseJson.userInfo?.referralCode) {
                    safeLocalStorage.setItem('referral_code', responseJson.userInfo.referralCode);
                }
                if (responseJson.userInfo?.featuresUnlockedUntil) {
                    safeLocalStorage.setItem('features_unlocked_until', responseJson.userInfo.featuresUnlockedUntil);
                } else {
                    safeLocalStorage.removeItem('features_unlocked_until');
                }
                if (responseJson.userInfo?.sharePassExpiresAt) {
                    safeLocalStorage.setItem('share_pass_expires_at', responseJson.userInfo.sharePassExpiresAt);
                } else {
                    safeLocalStorage.removeItem('share_pass_expires_at');
                }
                if (responseJson.userInfo?.isFeaturesUnlocked !== undefined) {
                    safeLocalStorage.setItem('is_features_unlocked', responseJson.userInfo.isFeaturesUnlocked ? 'true' : 'false');
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