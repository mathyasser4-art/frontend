import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/navbar/Navbar'
import MobileNav from '../../components/mobileNav/MobileNav'
import ProfileLoading from '../../components/profileLoading/ProfileLoading'
import NotLogin from '../../components/notLogin/NotLogin'
import avatarDefault from '../../img/avatar.png'
import userInfo from '../../api/authorize/userInfo.api'
import updateProfile from '../../api/user/updateProfile.api'
import '../../reusable.css'
import './User.css'

const HERO_AVATARS = [
    { id: 'chick', emoji: '🐣', label: 'Baby Hero' },
    { id: 'star', emoji: '🌟', label: 'Soroban Star' },
    { id: 'lightning', emoji: '⚡️', label: 'Flash Anzan' },
    { id: 'rocket', emoji: '🚀', label: 'Math Racer' },
    { id: 'trophy', emoji: '🏆', label: 'Champion' },
    { id: 'king', emoji: '👑', label: 'Grandmaster' },
    { id: 'ninja', emoji: '🥷', label: 'Math Ninja' },
    { id: 'hero_boy', emoji: '🦸‍♂️', label: 'Super Hero' },
    { id: 'hero_girl', emoji: '🦸‍♀️', label: 'Super Girl' }
]

function User() {
    const { t, i18n } = useTranslation()
    const [userData, setUserData] = useState()
    const [loading, setLoading] = useState(true)
    const [editUserName, setEditUserName] = useState('')
    const [editPassword, setEditPassword] = useState('')
    const [error, setError] = useState(null)
    const [loadingOperation, setLoadingOperation] = useState(false)
    
    // Avatar state (Custom photo URL/base64 or emoji string)
    const [currentAvatar, setCurrentAvatar] = useState(
        localStorage.getItem('user_profile_avatar') || avatarDefault
    )

    const fileInputRef = useRef(null)
    const isAuth = localStorage.getItem('O_authWEB')
    const role = localStorage.getItem('auth_role')
    const isArabic = i18n.language === 'ar'

    const openEditPopup = () => {
        setEditUserName(userData?.userName || '')
        setEditPassword('')
        setError(null)
        const popup = document.querySelector('.edit-profile-popup')
        const container = document.querySelector('.edit-profile-container')
        popup?.classList.replace('d-none', 'd-flex')
        setTimeout(() => {
            popup?.classList.remove('profile-popup-hide')
            container?.classList.remove('update-top')
        }, 50);
    }

    const closeEditPopup = () => {
        const popup = document.querySelector('.edit-profile-popup')
        const container = document.querySelector('.edit-profile-container')
        popup?.classList.add('profile-popup-hide')
        container?.classList.add('update-top')
        setTimeout(() => {
            popup?.classList.replace('d-flex', 'd-none')
        }, 300);
    }

    const showPassword = () => {
        const inputPassword = document.querySelector('.input-password')
        if (inputPassword && inputPassword.type === 'password')
            inputPassword.type = 'text'
        else if (inputPassword)
            inputPassword.type = 'password'
    }

    // Handle selecting local photo file
    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 4 * 1024 * 1024) {
                setError(isArabic ? 'حجم الصورة يجب أن يكون أقل من 4 ميجابايت' : 'Image size must be less than 4MB')
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64Img = reader.result
                setCurrentAvatar(base64Img)
                localStorage.setItem('user_profile_avatar', base64Img)
            }
            reader.readAsDataURL(file)
        }
    }

    // Handle selecting preset hero avatar emoji
    const handleSelectHeroPreset = (emoji) => {
        setCurrentAvatar(emoji)
        localStorage.setItem('user_profile_avatar', emoji)
    }

    const handleUpdateProfile = () => {
        if (editUserName === '') {
            setError(isArabic ? 'اسم المستخدم مطلوب!' : 'Username is required!')
        } else {
            const data = { 
                userName: editUserName, 
                password: editPassword !== '' ? editPassword : undefined,
                avatar: currentAvatar
            }
            updateProfile(data, setError, setLoadingOperation, closeEditPopup, setUserData)
        }
    }

    useEffect(() => {
        const userToken = localStorage.getItem('O_authWEB')
        const getUserInfo = async () => {
            await userInfo(userToken, setLoading, (data) => {
                setUserData(data)
                if (data?.avatar) {
                    setCurrentAvatar(data.avatar)
                    localStorage.setItem('user_profile_avatar', data.avatar)
                }
            })
        }
        if (userToken) {
            getUserInfo()
        }
    }, [])

    const logOut = () => {
        localStorage.removeItem('O_authWEB')
        localStorage.removeItem('auth_role')
        localStorage.removeItem('pp_name')
        localStorage.removeItem('user_profile_avatar')
        window.location.reload();
    }

    if (!isAuth) return (<>
        <MobileNav role={role} />
        <NotLogin />
    </>)

    const isEmojiAvatar = typeof currentAvatar === 'string' && currentAvatar.length <= 6 && !currentAvatar.startsWith('data:') && !currentAvatar.startsWith('http');

    return (
        <>
            <Navbar />
            <MobileNav role={role} />
            {loading ? <ProfileLoading /> : (
                <div className={`user-container d-flex justify-content-center align-items-center flex-direction-column ${isArabic ? 'rtl-mode' : ''}`}>
                    
                    {/* Hero Avatar Badge with Camera Click Uploader */}
                    <div className="profile-avatar-wrapper">
                        <div 
                            className="profile-avatar-card"
                            onClick={() => fileInputRef.current?.click()}
                            title={isArabic ? 'اضغط لتغيير الصورة' : 'Click to change photo'}
                        >
                            {isEmojiAvatar ? (
                                <span className="profile-emoji-display">{currentAvatar}</span>
                            ) : (
                                <img src={currentAvatar} alt="Profile" className="profile-img-display" />
                            )}
                            <div className="avatar-upload-overlay">
                                <span>📷</span>
                            </div>
                        </div>

                        {/* File Input */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handlePhotoSelect} 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                        />

                        <button 
                            className="change-photo-btn"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <span>📷 {isArabic ? 'رفع صورة جديدة' : 'Upload Photo'}</span>
                        </button>
                    </div>

                    {/* Hero Cartoon Avatars Selector Grid */}
                    <div className="hero-presets-section">
                        <p className="hero-presets-title">
                            {isArabic ? 'أو اختر شخصيتك من أبطال الأباكس 🦸‍♂️' : 'Or Pick Your Abacus Hero Avatar 🦸‍♂️'}
                        </p>
                        <div className="hero-presets-grid">
                            {HERO_AVATARS.map(hero => (
                                <div 
                                    key={hero.id} 
                                    className={`hero-preset-item ${currentAvatar === hero.emoji ? 'active-preset' : ''}`}
                                    onClick={() => handleSelectHeroPreset(hero.emoji)}
                                    title={hero.label}
                                >
                                    <span className="hero-preset-emoji">{hero.emoji}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* User Info Header */}
                    <div className="user-name">
                        <h2>{userData?.userName}</h2>
                        <p>{isArabic ? 'أهلاً بك في منصة أبطال الأباكس 🧮' : 'Welcome to Abacus Heroes Platform 🧮'}</p>
                    </div>

                    <div className="user-info">
                        <div className="info d-flex align-items-center">
                            <i className="fa fa-user-o" aria-hidden="true"></i>
                            <p>{userData?.userName}</p>
                        </div>

                        <div className="info d-flex align-items-center">
                            <i className="fa fa-id-card-o" aria-hidden="true"></i>
                            <p>{userData?.role}</p>
                        </div>
                        {(userData?.role !== 'User') ? userData?.role !== 'School' ? (
                            <div className="info d-flex align-items-center">
                                <i className="fa fa-university" aria-hidden="true"></i>
                                <p>{userData?.createdBy?.userName}</p>
                            </div>
                        ) : null : null}
                    </div>

                    <div onClick={openEditPopup} className="user-btn" style={{marginTop: '2rem'}}>
                        {isArabic ? 'تعديل البيانات ✏️' : 'Edit Profile ✏️'}
                        <div className="user-btn2"></div>
                    </div>
                    
                    <div onClick={logOut} className="user-btn" style={{marginTop: '1rem', background: 'linear-gradient(-45deg, #ff3131, #ff6b6b, #ff3131, #ff6b6b)'}}>
                        {isArabic ? 'تسجيل الخروج 🚪' : 'Log Out 🚪'}
                        <div className="user-btn2"></div>
                    </div>

                    <div className="user-footer">
                        <p>Abacus Heroes Management</p>
                        <p>{isArabic ? 'نتمنى لك دوام التوفيق والتميز العلمي!' : 'Wishing you continued progress and success!'}</p>
                    </div>
                </div>
            )}

            {/* Edit Profile Popup */}
            <div className="edit-profile-popup profile-popup-hide d-none justify-content-center align-items-center">
                <div className='edit-profile-container update-top'>
                    <div className="update-popup-head">
                        <p>{isArabic ? 'تعديل الحساب' : 'Edit Profile'}</p>
                    </div>
                    {error ? <div className="error error-dengare">{error}</div> : null}
                    <div className="update-popup-body">
                        <label>{isArabic ? 'اسم المستخدم الجديد' : 'New Username'}</label>
                        <input value={editUserName} onChange={(e) => setEditUserName(e.target.value)} type="text" placeholder='Your Name' />
                        <label>{isArabic ? 'كلمة المرور الجديدة (اختياري)' : 'New Password (Optional)'}</label>
                        <input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className='input-password' type="password" placeholder='Leave blank to keep current' />
                        <div className="show-password d-flex align-items-center">
                            <input type="checkbox" onClick={showPassword} />
                            <p>{isArabic ? 'إظهار كلمة المرور' : 'Show Password'}</p>
                        </div>
                    </div>
                    <div className="update-popup-footer">
                        <button className='button popup-btn' onClick={closeEditPopup}>{isArabic ? 'إلغاء' : 'Cancel'}</button>
                        <button className='button popup-btn2' onClick={handleUpdateProfile}>{loadingOperation ? <span className="loader"></span> : (isArabic ? 'حفظ' : 'Save')}</button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default User