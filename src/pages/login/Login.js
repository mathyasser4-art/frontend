import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../logo.png'
import login from '../../api/auth/login.api'
import '../../reusable.css'
import './Login.css'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const showAlert = () => {
        const alertEl = document.querySelector('.alert')
        if (alertEl) {
            alertEl.classList.add('alert-active')
            setTimeout(() => {
                alertEl.classList.remove('alert-active')
            }, 3500);
        }
    }

    const schoolName = localStorage.getItem('school_name') || '';
    const isTopsoroban = (schoolName.toLowerCase() === 'topsoroban') || email.toLowerCase().includes('topsoroban');

    const handleLogin = () => {
        if (email === '' || password === '') {
            setError('All fields are required!!')
        } else {
            const userData = { email, password }
            login(userData, setError, setLoading, navigate, showAlert)
        }
    }

    return (
        <div className='login d-flex flex-direction-column justify-content-center align-items-center'>
            <div className="login-logo">
                <Link to={'/'}><img src={isTopsoroban ? '/img/topsoroban_abacusheroes_logo.png' : logo} alt="" /></Link>
            </div>
            <div className="login-title">
                <p>Sign in to your account</p>
            </div>
            {error ? <div className="error">{error}</div> : null}
            <div className="login-form">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder='Enter your email or username' />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder='Password' />
            </div>
            


            <div className="login-btn-container" style={{ marginTop: '1.5rem' }}>
                <div onClick={handleLogin} className="login-btn">{loading ? <span className="loader"></span> : "Login"}
                    <div className="login-btn2"></div>
                </div>
            </div>
            
            {false && (
                <div className="login-footer" style={{ marginTop: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>
                    <p>Don't have a teacher account? <Link to={'/auth/register'} style={{ textDecoration: 'none' }}><span className='text-purple' style={{ color: '#2563eb', fontWeight: '800' }}>Sign Up</span></Link></p>
                </div>
            )}
        </div>
    )
}

export default Login