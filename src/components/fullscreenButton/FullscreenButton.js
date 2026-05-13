import React from 'react';
import { Maximize, Minimize } from 'lucide-react';
import soundEffects from '../../utils/soundEffects';
import './FullscreenButton.css';

const FullscreenButton = ({ targetRef }) => {
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    const toggleFullscreen = () => {
        soundEffects.playClick();
        if (!document.fullscreenElement) {
            targetRef.current.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <button 
            className="fullscreen-toggle-btn" 
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            <span>{isFullscreen ? "Exit Fullscreen" : "Full Screen"}</span>
        </button>
    );
};

export default FullscreenButton;
