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
    this.wildlifeTimer = null;
    this.activeWildlifeNodes = new Set();

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

  // 5. Procedural Tropical Island Ambient Soundscape (Ocean waves + Little birds, Elephant, Monkeys, Parrots)
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

      // Ocean wave loop source
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

      // Start the lively island wildlife sound scheduler (birds, elephant, monkeys)
      if (this.wildlifeTimer) {
        clearTimeout(this.wildlifeTimer);
      }
      // First cheerful bird greets the player after 1.2 seconds
      this.wildlifeTimer = setTimeout(() => {
        if (this.isAmbienceActive) {
          this.playBirdChirp();
          this.scheduleNextWildlife();
        }
      }, 1200);
    } catch (e) {
      console.warn('Could not start island ambience:', e);
    }
  }

  // Schedule periodic wildlife sounds (birds, elephant, monkeys, parrots)
  scheduleNextWildlife() {
    if (!this.isAmbienceActive) return;
    // Dynamic interval: pleasant calls every 3.5 to 6.5 seconds
    const interval = 3500 + Math.random() * 3200;
    this.wildlifeTimer = setTimeout(() => {
      if (!this.isAmbienceActive) return;
      this.playRandomWildlife();
      this.scheduleNextWildlife();
    }, interval);
  }

  // Play a random lively jungle animal / bird sound
  playRandomWildlife() {
    if (!this.audioContext) return;
    const roll = Math.random();
    if (roll < 0.44) {
      // 44% Little birds chirping (most frequent, sweet canopy twittering)
      this.playBirdChirp();
    } else if (roll < 0.68) {
      // 24% Distant majestic elephant trumpet
      this.playElephantTrumpet();
    } else if (roll < 0.86) {
      // 18% Playful jungle monkey / chimp chatter
      this.playMonkeyChatter();
    } else {
      // 14% Exotic tropical parrot squawk
      this.playParrotCall();
    }
  }

  // ── Procedural Tropical Birds (Sweet Twittering, Chirping & Melodic Trills) ──
  playBirdChirp(volume = 0.065) {
    try {
      this.ensureInitialized();
      if (!this.audioContext) return;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const ctx = this.audioContext;
      const baseTime = ctx.currentTime;

      // Select between 3 natural bird song motifs
      const motif = Math.floor(Math.random() * 3);

      const master = ctx.createGain();
      master.gain.setValueAtTime(volume, baseTime);

      // Stereo panning across the island canopy
      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime((Math.random() * 1.4) - 0.7, baseTime);
        master.connect(panner);
        panner.connect(ctx.destination);
      } else {
        master.connect(ctx.destination);
      }

      if (motif === 0) {
        // Motif 0: Double sweet chirp ("tweet-tweet!")
        const chirps = [
          { start: 0, dur: 0.08, f0: 3100, f1: 4300, f2: 3600 },
          { start: 0.12, dur: 0.09, f0: 3400, f1: 4700, f2: 3900 }
        ];

        chirps.forEach(({ start, dur, f0, f1, f2 }) => {
          const t = baseTime + start;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(f0, t);
          osc.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.45);
          osc.frequency.exponentialRampToValueAtTime(f2, t + dur);

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.85, t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

          osc.connect(gain);
          gain.connect(master);

          osc.start(t);
          osc.stop(t + dur + 0.01);
        });
      } else if (motif === 1) {
        // Motif 1: 3-note melodic canopy cascade
        const notes = [
          { start: 0, dur: 0.065, f0: 2900, f1: 3800 },
          { start: 0.08, dur: 0.065, f0: 3600, f1: 4400 },
          { start: 0.16, dur: 0.085, f0: 4400, f1: 3300 }
        ];

        notes.forEach(({ start, dur, f0, f1 }) => {
          const t = baseTime + start;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(f0, t);
          osc.frequency.exponentialRampToValueAtTime(f1, t + dur);

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.75, t + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

          osc.connect(gain);
          gain.connect(master);

          osc.start(t);
          osc.stop(t + dur + 0.01);
        });
      } else {
        // Motif 2: Fast playful canopy trill
        const t = baseTime;
        const dur = 0.22;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(3600, t);
        osc.frequency.exponentialRampToValueAtTime(4200, t + dur * 0.5);
        osc.frequency.exponentialRampToValueAtTime(3400, t + dur);

        // Rapid trill vibrato
        lfo.frequency.setValueAtTime(26, t);
        lfoGain.gain.setValueAtTime(320, t);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.8, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gain);
        gain.connect(master);

        lfo.start(t);
        osc.start(t);
        lfo.stop(t + dur + 0.01);
        osc.stop(t + dur + 0.01);
      }
    } catch (e) {}
  }

  // ── Procedural Elephant Trumpet (Distant Majestic Island Jungle Call) ──
  playElephantTrumpet(volume = 0.075) {
    try {
      this.ensureInitialized();
      if (!this.audioContext) return;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const ctx = this.audioContext;
      const now = ctx.currentTime;
      const duration = 1.45;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.001, now);
      master.gain.linearRampToValueAtTime(volume, now + 0.18);
      master.gain.setValueAtTime(volume * 0.92, now + 0.65);
      master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // Stereo positioning (slightly off-center in the deep jungle)
      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime((Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.4), now);
        master.connect(panner);
        panner.connect(ctx.destination);
      } else {
        master.connect(ctx.destination);
      }

      // Primary brassy oscillator (Sawtooth for rich harmonic spectrum)
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';

      // Elephant trumpet pitch curve: low growl -> majestic high trumpet blast -> sliding roar
      osc.frequency.setValueAtTime(210, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.18);
      osc.frequency.linearRampToValueAtTime(510, now + 0.55);
      osc.frequency.exponentialRampToValueAtTime(250, now + duration);

      // Second harmonic oscillator (Square wave for resonant trunk nasal cavity)
      const osc2 = ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(212, now);
      osc2.frequency.exponentialRampToValueAtTime(444, now + 0.18);
      osc2.frequency.linearRampToValueAtTime(514, now + 0.55);
      osc2.frequency.exponentialRampToValueAtTime(252, now + duration);

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.24, now);

      // LFO for trunk lip-flutter vibrato (~21 Hz flutter)
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(21, now);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(28, now); // ±28 Hz frequency flutter
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfoGain.connect(osc2.frequency);

      // Elephant trunk vocal formant bandpass filter
      const trunkFilter = ctx.createBiquadFilter();
      trunkFilter.type = 'bandpass';
      trunkFilter.frequency.setValueAtTime(820, now);
      trunkFilter.frequency.linearRampToValueAtTime(1160, now + 0.35);
      trunkFilter.frequency.exponentialRampToValueAtTime(640, now + duration);
      trunkFilter.Q.setValueAtTime(3.6, now);

      // Distant atmosphere warm lowpass filter
      const distFilter = ctx.createBiquadFilter();
      distFilter.type = 'lowpass';
      distFilter.frequency.setValueAtTime(2800, now);

      osc.connect(trunkFilter);
      osc2.connect(osc2Gain);
      osc2Gain.connect(trunkFilter);
      trunkFilter.connect(distFilter);
      distFilter.connect(master);

      osc.start(now);
      osc2.start(now);
      lfo.start(now);

      osc.stop(now + duration + 0.05);
      osc2.stop(now + duration + 0.05);
      lfo.stop(now + duration + 0.05);
    } catch (e) {}
  }

  // ── Procedural Jungle Monkey / Chimp Chatter ("Ooh-ooh Aah-aah!") ──
  playMonkeyChatter(volume = 0.065) {
    try {
      this.ensureInitialized();
      if (!this.audioContext) return;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const ctx = this.audioContext;
      const baseTime = ctx.currentTime;

      const master = ctx.createGain();
      master.gain.setValueAtTime(volume, baseTime);

      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime((Math.random() * 1.2) - 0.6, baseTime);
        master.connect(panner);
        panner.connect(ctx.destination);
      } else {
        master.connect(ctx.destination);
      }

      // 4 quick playful chatter bursts
      const calls = [
        { start: 0, dur: 0.065, f0: 490, f1: 660 },
        { start: 0.11, dur: 0.065, f0: 530, f1: 720 },
        { start: 0.23, dur: 0.075, f0: 690, f1: 940 },
        { start: 0.35, dur: 0.085, f0: 740, f1: 1010 }
      ];

      calls.forEach(({ start, dur, f0, f1 }) => {
        const t = baseTime + start;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f0, t);
        osc.frequency.exponentialRampToValueAtTime(f1, t + dur);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1150, t);
        filter.Q.setValueAtTime(4.0, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.85, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        osc.start(t);
        osc.stop(t + dur + 0.01);
      });
    } catch (e) {}
  }

  // ── Procedural Exotic Tropical Parrot Squawk ──
  playParrotCall(volume = 0.055) {
    try {
      this.ensureInitialized();
      if (!this.audioContext) return;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const ctx = this.audioContext;
      const baseTime = ctx.currentTime;

      const master = ctx.createGain();
      master.gain.setValueAtTime(volume, baseTime);

      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime((Math.random() * 1.4) - 0.7, baseTime);
        master.connect(panner);
        panner.connect(ctx.destination);
      } else {
        master.connect(ctx.destination);
      }

      const squawks = [
        { start: 0, dur: 0.11, f0: 1650, f1: 1100 },
        { start: 0.16, dur: 0.14, f0: 1850, f1: 1200 }
      ];

      squawks.forEach(({ start, dur, f0, f1 }) => {
        const t = baseTime + start;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Modulator for raspy squawk texture
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        mod.frequency.setValueAtTime(36, t);
        modGain.gain.setValueAtTime(110, t);
        mod.connect(modGain);
        modGain.connect(osc.frequency);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f0, t);
        osc.frequency.exponentialRampToValueAtTime(f1, t + dur);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.Q.setValueAtTime(3.0, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.7, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        mod.start(t);
        osc.start(t);
        mod.stop(t + dur + 0.01);
        osc.stop(t + dur + 0.01);
      });
    } catch (e) {}
  }

  stopIslandAmbience() {
    this.isAmbienceActive = false;
    if (this.wildlifeTimer) {
      clearTimeout(this.wildlifeTimer);
      this.wildlifeTimer = null;
    }
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