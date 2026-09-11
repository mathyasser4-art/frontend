import React, { useState, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import resetPassCode from '../../api/loginSystem/resetPassCode.api'
import logo from '../../img/logo-login.png'
import '../../reusable.css'
import './ResPasCode.css'
import { safeLocalStorage } from '../../utils/safeStorage';

function ResPasCode() {
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const { email } = useParams()
    const navigate = useNavigate()

    const schoolName = safeLocalStorage.getItem('school_name') || '';
    const isTopsoroban = (schoolName.toLowerCase() === 'topsoroban') || (email && email.toLowerCase().includes('topsoroban'));

    const handleDigitChange = (index, value) => {
        const char = value.slice(-1);
        const newDigits = [...digits];
        newDigits[index] = char;
        setDigits(newDigits);

        if (char && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!digits[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'Enter') {
            handleResetPassCode(e);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (!pastedData) return;

        const chars = pastedData.slice(0, 6).split('');
        const newDigits = [...digits];
        chars.forEach((c, i) => {
            if (i < 6) newDigits[i] = c;
        });
        setDigits(newDigits);

        const focusIdx = Math.min(chars.length, 5);
        inputRefs.current[focusIdx]?.focus();
    };

    const handleResetPassCode = (e) => {
        if (e) e.preventDefault();
        const resetPasswordCode = digits.join('');
        if (resetPasswordCode.length < 6) {
            setError('Enter the 6-digit verification code')
        } else {
            const data = { email, resetPasswordCode }
            resetPassCode(data, setError, setLoading, navigate)
        }
    }

    return (
        <div className='res-pas-code d-flex flex-direction-column justify-content-center align-items-center'>
            <div className="res-pas-code-logo">
                <Link to={'/'}><img src={isTopsoroban ? '/img/topsoroban_abacusheroes_logo.png' : logo} alt="" /></Link>
            </div>
            <div className="res-pas-code-title">
                <p>Enter Verification Code</p>
            </div>
            {error ? <div className="error">{error}</div> : null}
            <form onSubmit={handleResetPassCode} className="res-pas-code-form d-flex flex-direction-column align-items-center">
                <div className="res-pas-code-input" onPaste={handlePaste}>
                    {digits.map((digit, i) => (
                        <input 
                            key={i}
                            ref={el => inputRefs.current[i] = el}
                            type="text" 
                            inputMode="numeric"
                            maxLength={1} 
                            value={digit} 
                            onChange={e => handleDigitChange(i, e.target.value)} 
                            onKeyDown={e => handleKeyDown(i, e)}
                        />
                    ))}
                </div>
                <div className='res-pas-code-btn d-flex justify-content-center'>
                    <button type="submit">{loading ? <span className="loader"></span> : "Submit"}</button>
                </div>
            </form>
        </div>
    )
}

export default ResPasCode