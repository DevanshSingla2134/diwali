/**
 * audioSynth.js - Self-contained Web Audio API Festive Sound Synthesizer
 * Generates celebratory Indian classical ambient melodies, temple bells,
 * firework whooshes, explosions, and sparkler sizzles without external audio files.
 */

class FestiveAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlayingMusic = false;
    this.musicTimer = null;
    this.musicGain = null;
    this.masterGain = null;
    // Pentatonic / Raga Yaman notes in Hz (Ni, Re, Ga, Ma#, Dha, Ni, Sa)
    this.ragaScale = [
      220.00, // A3
      246.94, // B3
      277.18, // C#4
      311.13, // D#4
      329.63, // E4
      369.99, // F#4
      415.30, // G#4
      440.00, // A4
      493.88, // B4
      554.37, // C#5
      659.25, // E5
      739.99  // F#5
    ];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play Sacred Temple Bell / Diya Chime
  playBell(freq = 587.33) { // D5
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Harmonics for rich bell resonance
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Overtone oscillator
    const overtone = this.ctx.createOscillator();
    const overGain = this.ctx.createGain();
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2.76, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

    overGain.gain.setValueAtTime(0, t);
    overGain.gain.linearRampToValueAtTime(0.2, t + 0.02);
    overGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    overtone.connect(overGain);
    overGain.connect(this.masterGain);

    osc.start(t);
    overtone.start(t);
    osc.stop(t + 2.6);
    overtone.stop(t + 1.3);
  }

  // Play Firework Launch Whoosh
  playRocketWhoosh() {
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(850, t + 0.6);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.65);
  }

  // Play Firework Explosion Boom & Crackle
  playExplosion() {
    this.init();
    const t = this.ctx.currentTime;

    // Sub-bass thump
    const osc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.45);

    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(subGain);
    subGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.65);

    // Noise burst for the crackle
    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.18));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.7);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
  }

  // Play Festive Santoor / Chime Arpeggio note
  playPluckNote(freq, duration = 1.2) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Add bright harmonic sparkle
    const sparkle = this.ctx.createOscillator();
    sparkle.type = 'triangle';
    sparkle.frequency.setValueAtTime(freq * 2, t);
    const spGain = this.ctx.createGain();

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    spGain.gain.setValueAtTime(0.08, t);
    spGain.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.6);

    osc.connect(gain);
    gain.connect(this.musicGain);

    sparkle.connect(spGain);
    spGain.connect(this.musicGain);

    osc.start(t);
    sparkle.start(t);
    osc.stop(t + duration);
    sparkle.stop(t + duration);
  }

  // Toggle Background Festive Ambient Music Loop
  toggleMusic() {
    this.init();
    if (this.isPlayingMusic) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  startMusic() {
    this.isPlayingMusic = true;
    let step = 0;
    
    // Ambient drone
    const drone = () => {
      if (!this.isPlayingMusic) return;
      this.playPluckNote(110.00, 3.5); // Low A2 Tanpura root
      this.playPluckNote(164.81, 3.5); // E3 Tanpura fifth
    };
    drone();
    this.droneInterval = setInterval(drone, 4000);

    const playSequence = () => {
      if (!this.isPlayingMusic) return;
      const noteIdx = Math.floor(Math.random() * this.ragaScale.length);
      const note = this.ragaScale[noteIdx];
      this.playPluckNote(note, 1.4);

      // Chance of harmonic chime accent
      if (step % 4 === 0) {
        this.playPluckNote(this.ragaScale[(noteIdx + 3) % this.ragaScale.length], 2.0);
      }

      step++;
      const nextDelay = [320, 480, 640, 960][Math.floor(Math.random() * 4)];
      this.musicTimer = setTimeout(playSequence, nextDelay);
    };

    playSequence();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) clearTimeout(this.musicTimer);
    if (this.droneInterval) clearInterval(this.droneInterval);
  }
}

// Global instance
window.festiveAudio = new FestiveAudioEngine();
