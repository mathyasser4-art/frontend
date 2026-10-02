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

    // Ambient soundscape reference
    this.ambienceNodes = null;
    this.isAmbienceActive = false;

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

  // ── WUMPA ISLAND AUDIO SYSTEM (CRASH BANDICOOT STYLE, NO MUSIC) ──

  // 1. Juicy Wumpa Fruit pickup / star reward (bright ascending pop-chime)
  playWumpaFruit(volume = 0.16) {
    try {
      this.ensureInitialized();
      if (!this.audioContext) return;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const ctx = this.audioContext;
      const now = ctx.currentTime;

      const master = ctx.createGain();
      master.gain.setValueAtTime(volume, now);
      master.connect(ctx.destination);

      // Primary tone: juicy sine sweep (700Hz -> 1380Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(700, now);
      osc1.frequency.exponentialRampToValueAtTime(1380, now + 0.08);

      gain1.gain.setValueAtTime(0.75, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc1.connect(gain1);
      gain1.connect(master);

      // High sparkle overtone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1400, now);
      osc2.frequency.exponentialRampToValueAtTime(2760, now + 0.07);

      gain2.gain.setValueAtTime(0.35, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc2.connect(gain2);
      gain2.connect(master);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.16);
      osc2.stop(now + 0.16);
    } catch (e) {}
  }

  // 2. Hollow Wooden Crate / Tiki Wood Tap (Crash crate knock)
  playWoodenCrate(volume = 0.18) {
    try {
      this.ensureInitialized();
      if (!this.audioContext) return;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // Resonant wooden box body
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(390, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);

      oscGain.gain.setValueAtTime(volume, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(360, now);
      filter.Q.setValueAtTime(5.0, now);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(ctx.destination);

      // Sharp wooden impact transient
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'sine';
      click.frequency.setValueAtTime(750, now);
      click.frequency.exponentialRampToValueAtTime(150, now + 0.018);

      clickGain.gain.setValueAtTime(volume * 0.7, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

      click.connect(clickGain);
      clickGain.connect(ctx.destination);

      osc.start(now);
      click.start(now);
      osc.stop(now + 0.08);
      click.stop(now + 0.03);
    } catch (e) {}
  }

  // 3. Springy Cartoon Mascot Hop
  playMascotHop(volume = 0.14) {
    try {
      this.ensureInitialized();
      if (!this.audioContext) return;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const ctx = this.audioContext;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(460, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // 4. Celebratory Wooden Tiki Marimba Fanfare
  playTikiFanfare(volume = 0.16) {
    try {
      this.ensureInitialized();
      if (!this.audioContext) return;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const ctx = this.audioContext;
      const baseTime = ctx.currentTime;
      // C5, E5, G5, C6 (Tropical island arpeggio)
      const notes = [523.25, 659.25, 783.99, 1046.50];

      notes.forEach((freq, idx) => {
        const noteTime = baseTime + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(volume, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.24);
      });
    } catch (e) {}
  }

  // 5. Procedural Tropical Island Ambient Soundscape (Gentle ocean waves & soft breeze)
  startIslandAmbience(targetVolume = 0.035) {
    try {
      this.ensureInitialized();
      if (!this.audioContext) return;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      if (this.ambienceNodes) return; // Already running

      const ctx = this.audioContext;
      const bufferSize = Math.floor(ctx.sampleRate * 2.5); // 2.5 second noise buffer loop
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Pink/Brown noise calculation for smooth ocean waves
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }

      // Loop source
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Lowpass filter for ocean swell (waves washing up and receding)
      const waveFilter = ctx.createBiquadFilter();
      waveFilter.type = 'lowpass';
      waveFilter.frequency.setValueAtTime(420, ctx.currentTime);
      waveFilter.Q.setValueAtTime(2.0, ctx.currentTime);

      // LFO for slow, calming ocean waves (period ~8.5 seconds)
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(250, ctx.currentTime); // sweeps filter between ~170Hz and ~670Hz

      lfo.connect(lfoGain);
      lfoGain.connect(waveFilter.frequency);

      // Master ambient gain node with gentle fade-in
      const masterAmbienceGain = ctx.createGain();
      masterAmbienceGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterAmbienceGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, targetVolume), ctx.currentTime + 1.2);

      noiseSource.connect(waveFilter);
      waveFilter.connect(masterAmbienceGain);
      masterAmbienceGain.connect(ctx.destination);

      noiseSource.start();
      lfo.start();

      this.ambienceNodes = {
        noiseSource,
        lfo,
        waveFilter,
        masterGain: masterAmbienceGain,
      };
      this.isAmbienceActive = true;
    } catch (e) {
      console.warn('Could not start island ambience:', e);
    }
  }

  stopIslandAmbience() {
    if (!this.ambienceNodes) return;
    try {
      const { noiseSource, lfo, masterGain } = this.ambienceNodes;
      const ctx = this.audioContext;
      if (ctx && masterGain) {
        const now = ctx.currentTime;
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        setTimeout(() => {
          try {
            noiseSource.stop();
            lfo.stop();
            noiseSource.disconnect();
            lfo.disconnect();
          } catch (err) {}
        }, 700);
      }
    } catch (e) {}
    this.ambienceNodes = null;
    this.isAmbienceActive = false;
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
    playWinSound,
    playWumpaFruit: () => soundEffects.playWumpaFruit(),
    playWoodenCrate: () => soundEffects.playWoodenCrate(),
    playMascotHop: () => soundEffects.playMascotHop(),
    playTikiFanfare: () => soundEffects.playTikiFanfare(),
    startIslandAmbience: () => soundEffects.startIslandAmbience(),
    stopIslandAmbience: () => soundEffects.stopIslandAmbience()
  };
};