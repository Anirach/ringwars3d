type Tone = { freq: number; dur: number; type?: OscillatorType; gain?: number };

class TinySFX {
  private ctx: AudioContext | null = null;
  private master = 0.8;
  private sfx = 0.9;

  private ensure() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  play(t: Tone) {
    const ctx = this.ensure();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = t.type ?? 'triangle';
    osc.frequency.setValueAtTime(t.freq, now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime((t.gain ?? 0.05) * this.master * this.sfx, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t.dur);

    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + t.dur + 0.02);
  }

  setMaster(v: number) { this.master = Math.max(0, Math.min(1, v)); }
  setSfx(v: number) { this.sfx = Math.max(0, Math.min(1, v)); }

  shoot() { this.play({ freq: 540, dur: 0.07, type: 'square', gain: 0.03 }); }
  hit() { this.play({ freq: 220, dur: 0.08, type: 'sawtooth', gain: 0.025 }); }
  kill() { this.play({ freq: 160, dur: 0.12, type: 'triangle', gain: 0.035 }); }
  gameOver() { this.play({ freq: 90, dur: 0.5, type: 'sine', gain: 0.04 }); }
  phaseShift(phase: number) {
    const base = phase >= 2 ? 420 : phase >= 1 ? 320 : 250;
    this.play({ freq: base, dur: 0.1, type: 'sawtooth', gain: 0.03 });
    this.play({ freq: base * 1.5, dur: 0.14, type: 'triangle', gain: 0.02 });
  }
}

export const sfx = new TinySFX();
