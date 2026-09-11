import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/navbar/Navbar'
import MobileNav from '../../components/mobileNav/MobileNav'
import googlePlay from '../../img/google-play.png'
import appStore from '../../img/app-store.png'
import appIcon from '../../img/icon-app.png'
import isoIcon from '../../img/ios-icon.png'
import { safeLocalStorage } from '../../utils/safeStorage'
import '../../reusable.css'
import './ContactMobile.css'

function ContactMobile() {
    const { t } = useTranslation();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [showIosModal, setShowIosModal] = useState(false);
    const deferredPromptRef = useRef(null);
    const role = safeLocalStorage.getItem('auth_role');

    useEffect(() => {
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            deferredPromptRef.current = e;
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const send = () => {
        if (!message.trim()) {
            alert('You must write your message first');
            return;
        }

        let fullText = '';
        if (fullName.trim()) fullText += `Name: ${fullName.trim()}\n`;
        if (email.trim()) fullText += `Email: ${email.trim()}\n`;
        if (fullText) fullText += `\n`;
        fullText += `Message:\n${message.trim()}`;

        const encoded = encodeURIComponent(fullText);
        window.open(`https://wa.me/201202281023?text=${encoded}`, '_blank');
    };

    const androidApp = async () => {
        if (deferredPromptRef.current) {
            try {
                deferredPromptRef.current.prompt();
                const { outcome } = await deferredPromptRef.current.userChoice;
                if (outcome === 'accepted') {
                    deferredPromptRef.current = null;
                }
            } catch (err) {
                console.error('Install prompt error:', err);
            }
        } else {
            alert('To install on Android: open Chrome menu (⋮) and tap "Add to Home screen" or "Install app"');
        }
    };

    const iosApp = () => {
        setShowIosModal(true);
    };

    const closeIosApp = () => {
        setShowIosModal(false);
    };

    return (
        <>
            <Navbar />
            <MobileNav role={role} />
            <div className='contact-mobile'>
                <div className="contact-box">
                    <div className="contact-mobile-container">
                        <div className="contact-mobile-info d-flex align-items-center">
                            <div className="icon d-flex justify-content-center align-items-center">
                                <i className="fa fa-envelope-o" aria-hidden="true"></i>
                            </div>
                            <div className="info">
                                <p>Email</p>
                                <a href="mailto:abacusheroes@gmail.com" style={{ textDecoration: 'none' }} className='text-gray'>abacusheroes@gmail.com</a>
                            </div>
                        </div>
                        <div className="contact-mobile-info d-flex align-items-center">
                            <div className="icon d-flex justify-content-center align-items-center">
                                <i className="fa fa-phone" aria-hidden="true"></i>
                            </div>
                            <div className="info">
                                <p>Phone / WhatsApp</p>
                                <a href="https://wa.me/201202281023" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }} className='text-gray'>+20 120 228 1023</a>
                            </div>
                        </div>
                        <div className="contact-mobile-info d-flex align-items-center">
                            <div className="icon d-flex justify-content-center align-items-center">
                                <i className="fa fa-link" aria-hidden="true"></i>
                            </div>
                            <div className="info contact-link">
                                <p>Social Media</p>
                                <div className='social-link'>
                                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fa fa-facebook text-gray" aria-hidden="true"></i></a>
                                    <a href="https://wa.me/201202281023" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><i className="fa fa-whatsapp text-gray" aria-hidden="true"></i></a>
                                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i className="fa fa-linkedin-square text-gray" aria-hidden="true"></i></a>
                                    <a href="mailto:abacusheroes@gmail.com" aria-label="Email"><i className="fa fa-google text-gray" aria-hidden="true"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="contact-mobile-form">
                        <p>Send Message</p>
                        <div>
                            <label>Full Name</label><br />
                            <input 
                                type="text" 
                                value={fullName} 
                                onChange={e => setFullName(e.target.value)} 
                                placeholder="Your full name" 
                            />
                        </div>
                        <div>
                            <label>Email</label><br />
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                placeholder="Your email address" 
                            />
                        </div>
                        <div>
                            <label>Type your message...</label><br />
                            <input 
                                className='last-mobile-input' 
                                value={message} 
                                onChange={e => setMessage(e.target.value)} 
                                type="text" 
                                placeholder="How can we help you?" 
                            />
                        </div>
                        <div className="contact-mobile-btn" onClick={send}>Send
                            <div className="contact-mobile-btn2"></div>
                        </div>
                    </div>
                </div>
                <div className="d-flex download-app">
                    <img onClick={androidApp} src={googlePlay} alt="Google Play / Install Android" style={{ cursor: 'pointer' }} />
                    <img onClick={iosApp} src={appStore} alt="App Store / Install iOS" style={{ cursor: 'pointer' }} />
                </div>
                <div className={`install-ios ${showIosModal ? '' : 'install-down'} d-flex justify-content-center align-items-center`}>
                    <div className="install-container">
                        <div className="install-header d-flex justify-content-center align-items-center flex-direction-column">
                            <img src={appIcon} alt="" />
                            <p>Install AbacusHeroes</p>
                        </div>
                        <div className="install-body d-flex justify-content-center align-items-center">
                            <p>Install this app to your iPhone for easy access and a better experience.</p>
                        </div>
                        <div className="install-footer d-flex justify-content-center align-items-center">
                            <p>Tap</p>
                            <img src={isoIcon} alt="" />
                            <p>then "Add to Home Screen"</p>
                        </div>
                        <div onClick={closeIosApp} className="close-install">
                            <p>x</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ContactMobile