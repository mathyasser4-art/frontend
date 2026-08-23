// Sound effects utility with Web Audio API for low-latency playback

class SoundEffects {
  constructor() {
    // Audio file paths
    this.soundPaths = {
      click: '/audio/click.mp3',
      correct: '/audio/correct.mp3',
      wrong: '/audio/wrong.mp3'
    };
    
    // AudioBuffers for instant playback
    this.buffers = {};
    
    // Default volumes (further reduced as requested)
    this.defaultVolumes = {
      click: 0.08,      // Further reduced for navigation clicks
      correct: 0.12,    // Quieter correct sound
      wrong: 0.12       // Quieter wrong sound
    };

    // Initialize Web Audio API lazily
    this.audioContext = null;
    this.isReady = false;
    this.isLoading = false;
    
    // Unlock audio on first user interaction (required for mobile)
    this.setupAudioUnlock();
  }

  ensureInitialized() {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    if (!this.isReady && !this.isLoading) {
      this.loadAllSounds();
    }
  }

  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    } catch (e) {
      console.error('Web Audio API not supported:', e);
    }
  }

  setupAudioUnlock() {
    // Mobile browsers require user interaction before playing audio
    const unlockAudio = () => {
      this.ensureInitialized();
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('Audio context unlocked');
        });
      }
      // Remove listeners after first interaction
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('touchend', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };

    document.addEventListener('touchstart', unlockAudio, { passive: true });
    document.addEventListener('touchend', unlockAudio, { passive: true });
    document.addEventListener('click', unlockAudio, { passive: true });
  }

  async loadAllSounds() {
    if (!this.audioContext) return;
    this.isLoading = true;

    const loadPromises = Object.entries(this.soundPaths).map(async ([name, path]) => {
      try {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.buffers[name] = audioBuffer;
      } catch (error) {
        console.error(`Failed to load sound ${name}:`, error);
      }
    });

    await Promise.all(loadPromises);
    this.isReady = true;
    this.isLoading = false;
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

  // Soft, satisfying game hover pop / chime for system and level cards
  playCardHover() {
    try {
      this.ensureInitialized();
      if (!this.audioContext) return;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      // Crisp upward melodic pitch bend (580Hz -> 820Hz)
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.07);

      // Smooth subtle volume envelope
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      // Audio context might fail silently if not allowed
    }
  }

  // Special softer, lower-pitched sound for number/button clicks
  playNumberClick() {
    this.playSoundWithOptions('click', { 
      playbackRate: 0.75, 
      volume: 0.08     // Even quieter for keyboard numbers
    });
  }

  // Ending sound when exam finishes (simpler and quieter)
  playEndSound() {
    this.playSoundWithOptions('click', { 
      playbackRate: 0.8,   // Higher pitch for simpler sound
      volume: 0.08         // Much quieter ending sound
    });
  }

  // Winning/success sound when results appear (quieter and simpler)
  playWinSound() {
    this.playSoundWithOptions('correct', { 
      playbackRate: 1.0,
      volume: 0.1      // Much quieter win sound
    });
  }

  playSound(soundName, volume = null) {
    this.ensureInitialized();
    if (!this.audioContext || !this.buffers[soundName]) {
      return;
    }

    try {
      // Create buffer source (one-time use)
      const source = this.audioContext.createBufferSource();
      source.buffer = this.buffers[soundName];

      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      const finalVolume = volume !== null ? volume : this.defaultVolumes[soundName];
      gainNode.gain.value = finalVolume;

      // Connect nodes: source -> gain -> destination
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Play immediately
      source.start(0);
    } catch (error) {
      console.error(`Error playing sound ${soundName}:`, error);
    }
  }

  playSoundWithOptions(soundName, options = {}) {
    if (!this.audioContext || !this.buffers[soundName]) {
      console.warn(`Sound ${soundName} not ready yet`);
      return;
    }

    const {
      playbackRate = 1.0,
      volume = null
    } = options;

    try {
      // Create buffer source
      const source = this.audioContext.createBufferSource();
      source.buffer = this.buffers[soundName];
      source.playbackRate.value = playbackRate;

      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      const finalVolume = volume !== null ? volume : this.defaultVolumes[soundName];
      gainNode.gain.value = finalVolume;

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Play immediately
      source.start(0);
    } catch (error) {
      console.error(`Error playing sound ${soundName}:`, error);
    }
  }

  setVolume(volume) {
    // Update default volumes for all sounds (volume should be between 0 and 1)
    Object.keys(this.defaultVolumes).forEach(key => {
      this.defaultVolumes[key] = volume;
    });
  }

  // Check if audio system is ready
  isAudioReady() {
    return this.isReady && this.audioContext && this.audioContext.state === 'running';
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

  const playCardHoverSound = () => soundEffects.playCardHover();

  return {
    playClickSound,
    playCorrectSound,
    playWrongSound,
    playCardHoverSound,
    playNumberClickSound,
    playEndSound,
    playWinSound
  };
};