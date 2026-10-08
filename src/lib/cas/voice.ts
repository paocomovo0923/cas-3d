/**
 * CAS — Tom de voz: sintetizador "Simlish" com WebAudio.
 * Gera uma pequena sequência de sílabas cantadas cuja frequência
 * base é controlada pelo slider de tom de voz (grave ⇄ agudo).
 */
let ctx: AudioContext | null = null;

export function playSimlishVoice(pitch: number): void {
  // pitch: 0 (grave) → 1 (agudo)
  if (typeof window === 'undefined') return;
  try {
    ctx = ctx ?? new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime + 0.02;
    const base = 150 * Math.pow(2.1, pitch); // ~150Hz grave → ~315Hz agudo
    const syllables = 3 + Math.floor(Math.random() * 3);
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);

    let t = t0;
    for (let i = 0; i < syllables; i++) {
      const dur = 0.09 + Math.random() * 0.12;
      const f = base * (0.85 + Math.random() * 0.5);

      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * (0.8 + Math.random() * 0.5), t + dur);

      const vibrato = ctx.createOscillator();
      vibrato.frequency.value = 5.5 + Math.random() * 2;
      const vibGain = ctx.createGain();
      vibGain.gain.value = f * 0.02;
      vibrato.connect(vibGain).connect(osc.frequency);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = f * 2.2;
      filter.Q.value = 1.4;

      osc.connect(g).connect(filter).connect(master);
      osc.start(t);
      vibrato.start(t);
      osc.stop(t + dur + 0.02);
      vibrato.stop(t + dur + 0.02);
      t += dur + 0.03 + Math.random() * 0.05;
    }
  } catch {
    // áudio indisponível — ignora silenciosamente
  }
}
