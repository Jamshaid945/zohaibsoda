/**
 * Tiny synthesized soda sound kit — no audio assets needed.
 * Every sound is tied to a visible event: can crack + fizz on flavor switch,
 * pop on poke / add-to-cart, tick on UI taps.
 */
class SodaAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  enabled = true;

  unlock() {
    try {
      if (!this.ctx) {
        const AC: typeof AudioContext | undefined =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.enabled ? 0.5 : 0;
        this.master.connect(this.ctx.destination);
        const len = Math.floor(this.ctx.sampleRate * 1.6);
        this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      /* audio unavailable — stay silent */
    }
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(v ? 0.5 : 0, this.ctx.currentTime, 0.02);
    }
  }

  private get ready() {
    this.unlock();
    return !!(this.ctx && this.master && this.noise && this.enabled);
  }

  /** Sharp tab-crack of a can opening. */
  crack() {
    if (!this.ready) return;
    const ctx = this.ctx!, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2700;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.85, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    src.connect(bp); bp.connect(g); g.connect(this.master!);
    src.start(t); src.stop(t + 0.1);

    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(340, t);
    o.frequency.exponentialRampToValueAtTime(85, t + 0.07);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.28, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(g2); g2.connect(this.master!);
    o.start(t); o.stop(t + 0.1);
  }

  /** Rising carbonation hiss. */
  fizz(dur = 1.25) {
    if (!this.ready) return;
    const ctx = this.ctx!, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.92;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(3600, t);
    hp.frequency.exponentialRampToValueAtTime(5600, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.17, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(hp); hp.connect(g); g.connect(this.master!);
    src.start(t); src.stop(t + dur + 0.05);
  }

  /** Soft bubble pop. */
  pop() {
    if (!this.ready) return;
    const ctx = this.ctx!, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(160, t + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    o.connect(g); g.connect(this.master!);
    o.start(t); o.stop(t + 0.12);
  }

  /** UI tick. */
  tick() {
    if (!this.ready) return;
    const ctx = this.ctx!, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = 1500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    o.connect(g); g.connect(this.master!);
    o.start(t); o.stop(t + 0.05);
  }
}

export const audio = new SodaAudio();
