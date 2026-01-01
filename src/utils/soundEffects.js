// Sound effects utility for game-like interactions

class SoundEffects {
  constructor() {
    this.sounds = {
      click: new Audio('/audio/click.mp3'),
      correct: new Audio('/audio/correct.mp3'),
      wrong: new Audio('/audio/wrong.mp3')
    };
    
    // Preload all sounds - reduced volume by 40% (from 0.5 to 0.3)
    Object.values(this.sounds).forEach(sound => {
      sound.preload = 'auto';
      sound.volume = 0.3; // Reduced volume by 40%
    });

    // Initialize Web Audio API context for pitch shifting
    this.audioContext = null;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    } catch (e) {
      console.log('Web Audio API not supported');
    }
  }

  playClick() {
    this.playSound('click');
  }

  playCorrect() {
    this.playSound('correct');
  }

  playWrong() {
    this.playSound('wrong');
  }

  // Special softer, lower-pitched sound for number/button clicks
  playNumberClick() {
    this.playSoundWithPitch('click', 0.75, 0.15); // Much lower pitch (75%) and softer volume (15%)
  }

  // Ending sound when exam finishes
  playEndSound() {
    this.playSoundWithPitch('click', 0.6, 0.25); // Deep ending sound
  }

  // Winning/success sound when results appear
  playWinSound() {
    this.playSound('correct'); // Use the correct sound for winning
  }

  playSound(soundName) {
    const sound = this.sounds[soundName];
    if (sound) {
      // Clone the audio to allow multiple simultaneous plays
      const soundClone = sound.cloneNode();
      soundClone.volume = sound.volume;
      soundClone.play().catch(err => {
        // Ignore errors (e.g., if user hasn't interacted with page yet)
        console.log('Sound play failed:', err);
      });
    }
  }

  playSoundWithPitch(soundName, pitchRate = 1.0, volumeOverride = null) {
    const sound = this.sounds[soundName];
    if (!sound || !this.audioContext) {
      // Fallback to normal sound if Web Audio API not available
      this.playSound(soundName);
      return;
    }

    try {
      // Clone the audio element
      const soundClone = sound.cloneNode();
      soundClone.volume = volumeOverride !== null ? volumeOverride : sound.volume;
      
      // Use playbackRate to change pitch (lower pitch = lower playbackRate)
      soundClone.playbackRate = pitchRate;
      soundClone.preservesPitch = false; // Ensure pitch changes with playback rate
      
      soundClone.play().catch(err => {
        console.log('Sound play failed:', err);
      });
    } catch (err) {
      // Fallback to normal sound
      this.playSound(soundName);
    }
  }

  setVolume(volume) {
    // volume should be between 0 and 1
    Object.values(this.sounds).forEach(sound => {
      sound.volume = volume;
    });
  }
}

// Create and export a single instance
const soundEffects = new SoundEffects();

export default soundEffects;

// React Hook for easy usage in components
export const useSoundEffect = () => {
  const playClickSound = () => soundEffects.playClick();
  const playCorrectSound = () => soundEffects.playCorrect();
  const playWrongSound = () => soundEffects.playWrong();
  const playNumberClickSound = () => soundEffects.playNumberClick();
  const playEndSound = () => soundEffects.playEndSound();
  const playWinSound = () => soundEffects.playWinSound();

  return {
    playClickSound,
    playCorrectSound,
    playWrongSound,
    playNumberClickSound,
    playEndSound,
    playWinSound
  };
};