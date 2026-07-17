/** Small procedural synth — no audio assets, everything is generated with WebAudio oscillators/noise. */
export class SFX {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  private ensure() {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  resume() {
    const ctx = this.ensure();
    if (ctx.state === "suspended") ctx.resume();
  }

  private tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.3, glideTo?: number) {
    if (this.muted) return;
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(this.master!);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  private noiseBurst(dur: number, gain = 0.25) {
    if (this.muted) return;
    const ctx = this.ensure();
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(g);
    g.connect(this.master!);
    src.start();
  }

  flipper() {
    this.tone(220, 0.06, "square", 0.18, 140);
  }

  bumper() {
    this.tone(520, 0.14, "triangle", 0.3, 260);
    this.noiseBurst(0.05, 0.08);
  }

  slingshot() {
    this.tone(340, 0.09, "sawtooth", 0.22, 180);
  }

  target() {
    this.tone(720, 0.1, "square", 0.22, 480);
  }

  spinner() {
    this.tone(900, 0.04, "sine", 0.12, 700);
  }

  rollover() {
    this.tone(660, 0.09, "sine", 0.2, 880);
  }

  ramp() {
    this.tone(300, 0.35, "sawtooth", 0.2, 900);
  }

  launch() {
    this.tone(120, 0.28, "sawtooth", 0.28, 500);
  }

  drain() {
    this.tone(200, 0.5, "sine", 0.25, 60);
  }

  tilt() {
    this.tone(90, 0.6, "square", 0.3, 45);
    this.noiseBurst(0.4, 0.15);
  }

  ballSave() {
    this.tone(440, 0.12, "sine", 0.25, 880);
    setTimeout(() => this.tone(660, 0.16, "sine", 0.25, 1100), 90);
  }

  multiball() {
    [440, 554, 660, 880].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, "sine", 0.25), i * 70));
  }

  levelComplete() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.28, "triangle", 0.28), i * 110));
  }

  gameOver() {
    [392, 330, 262].forEach((f, i) => setTimeout(() => this.tone(f, 0.4, "sawtooth", 0.25), i * 180));
  }

  extraBall() {
    [660, 880, 1108].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, "square", 0.22), i * 90));
  }
}
