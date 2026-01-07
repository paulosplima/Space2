
class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.3;
    this.initialized = true;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number, sweepFreq?: number) {
    if (!this.ctx || !this.masterGain) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (sweepFreq) {
      osc.frequency.exponentialRampToValueAtTime(sweepFreq, this.ctx.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playShoot() {
    this.playTone(880, 'sine', 0.1, 0.4, 110);
  }

  playMegaShoot() {
    this.playTone(440, 'square', 0.3, 0.5, 55);
  }

  playExplosion() {
    if (!this.ctx || !this.masterGain) return;
    const duration = 0.3;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + duration);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  playPlayerHit() {
    this.playTone(150, 'sawtooth', 0.5, 0.6, 40);
  }

  playOverdrive() {
    this.playTone(100, 'sine', 0.6, 0.5, 1200);
  }

  playDash() {
    this.playTone(600, 'triangle', 0.1, 0.3, 1200);
  }
}

export const audio = new AudioService();
