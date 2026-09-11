import React, { useState, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import logo from '../../img/logo-login.png'
import verifyAccount from '../../api/loginSystem/verifyAccount.api'
import resendCode from '../../api/loginSystem/resendCode.api'
import '../../reusable.css'
import './VerifyAccount.css'
import { safeLocalStorage } from '../../utils/safeStorage';

function VerifyAccount() {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { email } = useParams()
  const navigate = useNavigate()

  const showAlert = () => {
    document.querySelector('.alert')?.classList.add('alert-active')
    setTimeout(() => {
      document.querySelector('.alert')?.classList.remove('alert-active')
    }, 3500);
  }

  const handleResendCode = () => {
    const data = { email }
    resendCode(data, showAlert)
  }

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
      handleVerify(e);
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

  const handleVerify = (e) => {
    if (e) e.preventDefault();
    const verificationCode = digits.join('');
    if (verificationCode.length < 6) {
      setError('Enter the 6-digit verification code')
    } else {
      const data = { email, verificationCode }
      verifyAccount(data, setError, setLoading, navigate)
    }
  }

  return (
    <div className='verify d-flex flex-direction-column justify-content-center align-items-center'>
      <div className="verify-logo">
        <Link to={'/'}><img src={isTopsoroban ? '/img/topsoroban_abacusheroes_logo.png' : logo} alt="" /></Link>
      </div>
      <div className="verify-title">
        <p>Enter Verification Code</p>
      </div>
      {error ? <div className="error">{error}</div> : null}
      <form onSubmit={handleVerify} className="verify-form d-flex flex-direction-column align-items-center">
        <div className="verify-input" onPaste={handlePaste}>
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
        <div className='verify-btn d-flex justify-content-center'>
          <button type="submit">{loading ? <span className="loader"></span> : "Verify"}</button>
        </div>
      </form>
      <div className='verify-footer'>
        <p>Didn't receive code?</p>
        <p onClick={handleResendCode} style={{ cursor: 'pointer' }}>Send verification code again</p>
      </div>
      <div className="alert">Success! Check your email. We have sent you a new verification code.</div>
    </div>
  )
}

export default VerifyAccount;