import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../img/logo-login.png'
import resetPassEmail from '../../api/loginSystem/resetPassEmail.api'
import '../../reusable.css'
import './ResPasEmail.css'
import { safeLocalStorage } from '../../utils/safeStorage';

function ResPasEmail() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const schoolName = safeLocalStorage.getItem('school_name') || '';
    const isTopsoroban = (schoolName.toLowerCase() === 'topsoroban') || email.toLowerCase().includes('topsoroban');

    const handleResetPassEmail = (e) => {
        if (e) e.preventDefault();
        if (email.trim() === '') {
            setError('Email is required!')
        } else {
            const data = { email: email.trim() }
            resetPassEmail(data, setError, setLoading, navigate)
        }
    }

    return (
        <div className='res-pas-email d-flex flex-direction-column justify-content-center align-items-center'>
            <div className="res-pas-email-logo">
                <Link to={'/'}><img src={isTopsoroban ? '/img/topsoroban_abacusheroes_logo.png' : logo} alt="" /></Link>
            </div>
            <div className="res-pas-email-title">
                <p>Reset your password</p>
            </div>
            {error ? <div className="error">{error}</div> : null}
            <form onSubmit={handleResetPassEmail} className="res-pas-email-form d-flex flex-direction-column align-items-center">
                <div className="res-pas-email-input">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder='Enter your email' />
                </div>
                <div className="res-pas-email-btn">
                    <button type="submit" className="res-email-btn" style={{ border: 'none', font: 'inherit' }}>
                        {loading ? <span className="loader"></span> : "Reset Your Password"}
                        <div className="res-email-btn2"></div>
                    </button>
                </div>
            </form>
            <div style={{ marginTop: '1.5rem' }}>
                <Link to="/auth/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
                    ← Back to Login
                </Link>
            </div>
        </div>
    )
}

export default ResPasEmail