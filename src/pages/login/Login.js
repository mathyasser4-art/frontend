import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../logo.png'
import login from '../../api/auth/login.api'
import '../../reusable.css'
import './Login.css'
import { safeLocalStorage } from '../../utils/safeStorage';

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()

    const schoolName = safeLocalStorage.getItem('school_name') || '';
    const isTopsoroban = (schoolName.toLowerCase() === 'topsoroban') || email.toLowerCase().includes('topsoroban');

    const handleLogin = (e) => {
        if (e) e.preventDefault();
        if (email.trim() === '' || password.trim() === '') {
            setError('All fields are required!!')
        } else {
            const userData = { email: email.trim(), password }
            login(userData, setError, setLoading, navigate)
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
            <form onSubmit={handleLogin} className="login-form">
                <input 
                    type="text" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder='Enter your email or username'
                    autoComplete="username" 
                />
                <div style={{ position: 'relative', width: '100%' }}>
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder='Password'
                        autoComplete="current-password"
                        style={{ paddingRight: '45px' }}
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                            position: 'absolute',
                            right: '12px',
                            top: '40%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: 0
                        }}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? "👁️" : "🙈"}
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                    <Link to="/resetPassword/email" style={{ color: '#6366f1', fontSize: '0.88rem', textDecoration: 'none', fontWeight: '600' }}>
                        Forgot Password?
                    </Link>
                </div>

                <div className="login-btn-container">
                    <button type="submit" className="login-btn" style={{ border: 'none', font: 'inherit' }}>
                        {loading ? <span className="loader"></span> : "Login"}
                        <div className="login-btn2"></div>
                    </button>
                </div>
            </form>
        </div>
    )
}

export default Login