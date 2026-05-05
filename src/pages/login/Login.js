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
        document.querySelector('.alert').classList.add('alert-active')
        setTimeout(() => {
            document.querySelector('.alert').classList.remove('alert-active')
        }, 3500);
    }

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
                <Link to={'/'}><img src={logo} alt="" /></Link>
            </div>
            <div className="login-title">
                <p>Sign in to your account</p>
            </div>
            {error ? <div className="error">{error}</div> : null}
            <div className="login-form">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder='Enter your email or username' />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder='Password' />
                <Link to={'/resetPassword/email'}><p className='text-purple'>Forget Your Password?</p></Link>
            </div>
            <div className="login-btn-container">
                <div onClick={handleLogin} className="login-btn">{loading ? <span className="loader"></span> : "Login"}
                    <div className="login-btn2"></div>
                </div>
            </div>
        </div>
    )
}

export default Login