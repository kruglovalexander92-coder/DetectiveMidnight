/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private isPlaying: boolean = false;
  private bassInterval: any = null;
  private drumInterval: any = null;
  private melodyInterval: any = null;
  private rainNode: AudioWorkletNode | ScriptProcessorNode | null = null;

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterVolume = this.ctx.createGain();
    this.masterVolume.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.masterVolume.connect(this.ctx.destination);
  }

  setMute(mute: boolean) {
    if (!this.ctx) this.init();
    if (!this.ctx || !this.masterVolume) return;

    if (mute) {
      this.masterVolume.gain.setValueAtTime(0, this.ctx.currentTime);
    } else {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.masterVolume.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.startAmbientMusic();
    }
  }

  private startAmbientMusic() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Start rain synthesis
    this.startRainNoise();

    let step = 0;
    const bassScale = [43.65, 51.91, 48.99, 58.27, 38.89, 43.65, 55.0, 65.41]; // F1, A#1, G1, C2, D#1, F1, A1, C2 in Hz
    const bassRhythm = [1, 0, 1, 0, 1, 1, 0, 1];

    // Bass line loop
    this.bassInterval = setInterval(() => {
      if (!this.ctx || this.ctx.state === 'suspended') return;
      if (bassRhythm[step % bassRhythm.length] === 1) {
        const noteIndex = Math.floor(step / 2) % bassScale.length;
        this.playBassNote(bassScale[noteIndex]);
      }
      step++;
    }, 600); // 100 BPM swing eighth feel

    // Brush snare/hi-hat loop (soft noise bursts)
    this.drumInterval = setInterval(() => {
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const beat = step % 4;
      if (beat === 0) {
        this.playBrushSnare(0.04);
      } else if (beat === 2) {
        this.playBrushSnare(0.08); // Accent on 2 and 4 (backbeat)
      } else if (beat === 3) {
        // Swing eighth snare
        setTimeout(() => this.playBrushSnare(0.03), 200);
      }
    }, 600);

    // Random moody piano melody notes
    this.melodyInterval = setInterval(() => {
      if (!this.ctx || this.ctx.state === 'suspended') return;
      if (Math.random() > 0.6) {
        // Pentatonic minor scale in F (F3, Ab3, Bb3, C4, Eb4, F4)
        const scale = [174.61, 207.65, 233.08, 261.63, 311.13, 349.23, 415.30, 466.16];
        const freq = scale[Math.floor(Math.random() * scale.length)];
        this.playPianoMelody(freq);
      }
    }, 2400);
  }

  stopAmbientMusic() {
    this.isPlaying = false;
    if (this.bassInterval) clearInterval(this.bassInterval);
    if (this.drumInterval) clearInterval(this.drumInterval);
    if (this.melodyInterval) clearInterval(this.melodyInterval);
    if (this.rainNode) {
      try {
        this.rainNode.disconnect();
      } catch (e) {}
      this.rainNode = null;
    }
  }

  private startRainNoise() {
    if (!this.ctx || !this.masterVolume) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise filter to sound like soft heavy rain
      output[i] = (lastOut * 0.99 + white * 0.01) / 1.0;
      lastOut = output[i];
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(this.masterVolume);

    rainSource.start(0);
    this.rainNode = rainSource as any; // Storing as any to allow stopping later
  }

  private playBassNote(frequency: number) {
    if (!this.ctx || !this.masterVolume) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Triangle wave for soft organic bass sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    // Mild lowpass to remove high harmonics
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.3);
  }

  private playBrushSnare(vol: number) {
    if (!this.ctx || !this.masterVolume) return;

    // Synthesize brush snare from white noise
    const bufferSize = 0.15 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(6000, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    noiseSource.start();
    noiseSource.stop(this.ctx.currentTime + 0.15);
  }

  private playPianoMelody(frequency: number) {
    if (!this.ctx || !this.masterVolume) return;
    const now = this.ctx.currentTime;

    // Use two sine oscillators with slight detune for a rich electric piano/rhodes vibe
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(frequency, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2.01, now); // Add an octave + slight detune for charm

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.08); // soft attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5); // long sustain

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.6);
    osc2.stop(now + 2.6);
  }

  // SOUND EFFECTS
  playMeow() {
    this.init();
    if (!this.ctx || !this.masterVolume) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Classic cat meow frequency bend (starts mid, dips, sweeps high)
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(850, now + 0.35);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(1500, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playPurr() {
    this.init();
    if (!this.ctx || !this.masterVolume) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(25, now);

    // Modulate amplitude rapidly to sound like a purr
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    modulator.frequency.setValueAtTime(12, now); // 12 Hz rumble
    modGain.gain.setValueAtTime(0.5, now);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(80, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playScratch() {
    this.init();
    if (!this.ctx || !this.masterVolume) return;

    const now = this.ctx.currentTime;
    // Fast scratching loops
    for (let i = 0; i < 3; i++) {
      const startTime = now + i * 0.12;
      const bufferSize = 0.08 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let j = 0; j < bufferSize; j++) {
        output[j] = Math.random() * 2 - 1;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, startTime);
      filter.Q.setValueAtTime(4, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterVolume);

      noiseSource.start(startTime);
      noiseSource.stop(startTime + 0.08);
    }
  }

  playClick() {
    this.init();
    if (!this.ctx || !this.masterVolume) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterVolume);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  playCrash() {
    this.init();
    if (!this.ctx || !this.masterVolume) return;

    const now = this.ctx.currentTime;

    // Heavy low rumble
    const rumbleOsc = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumbleOsc.type = 'triangle';
    rumbleOsc.frequency.setValueAtTime(80, now);
    rumbleOsc.frequency.exponentialRampToValueAtTime(10, now + 0.4);

    rumbleGain.gain.setValueAtTime(0.3, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(this.masterVolume);
    rumbleOsc.start(now);
    rumbleOsc.stop(now + 0.5);

    // High frequency impact noise
    const bufferSize = 0.5 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    noiseSource.start(now);
    noiseSource.stop(now + 0.5);
  }

  playClueFound() {
    this.init();
    if (!this.ctx || !this.masterVolume) return;

    const now = this.ctx.currentTime;
    const chords = [261.63, 311.13, 392.00, 493.88, 587.33]; // C minor maj7 (C4, Eb4, G4, B4, D5)

    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08); // Arpeggiated chord

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 1.8);

      const panner = this.ctx!.createStereoPanner ? this.ctx!.createStereoPanner() : null;
      if (panner) {
        panner.pan.setValueAtTime((idx / (chords.length - 1)) * 2 - 1, now);
        osc.connect(panner);
        panner.connect(gain);
      } else {
        osc.connect(gain);
      }

      gain.connect(this.masterVolume!);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.9);
    });
  }
}

export const gameAudio = new AudioEngine();
