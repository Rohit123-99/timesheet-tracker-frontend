// Web Audio API alarm — no audio file needed, fully synthesised.
//
// Plays a 3-note chime that's clearly audible without being startling.
// Used when a Pomodoro phase ends so the user knows it's time to switch.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC() as AudioContext;
    }
    // Browsers suspend the context if it was created before any user gesture.
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

interface BeepSpec {
  freq: number;     // Hz
  start: number;    // seconds from now
  duration: number; // seconds
  volume?: number;  // 0..1
}

function playSequence(notes: BeepSpec[]): void {
  const ctx = getCtx();
  if (!ctx) return;

  for (const n of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = n.freq;

    const start = ctx.currentTime + n.start;
    const peak = n.volume ?? 0.45;
    // Quick ramp up, sustain, then fade out — avoids the "click" of a hard
    // start/stop on a square envelope.
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.duration);

    osc.start(start);
    osc.stop(start + n.duration + 0.05);
  }
}

/**
 * End-of-phase alarm — a 3-tone chime repeated 3 times with pauses between.
 * ~6 seconds total. Long enough to grab attention even if the user has
 * earbuds out, but not so long as to be obnoxious.
 */
export function playPhaseAlarm(): void {
  const cycle = (offset: number): BeepSpec[] => [
    { freq: 880,  start: offset + 0.0,  duration: 0.28 },
    { freq: 880,  start: offset + 0.38, duration: 0.28 },
    { freq: 1318, start: offset + 0.76, duration: 0.42, volume: 0.55 },
  ];
  playSequence([
    ...cycle(0.0),     // chime 1 (0.0 – 1.2s)
    ...cycle(1.7),     // chime 2 (1.7 – 2.9s)
    ...cycle(3.4),     // chime 3 (3.4 – 4.6s)
    // Final flourish to mark the end
    { freq: 1318, start: 5.0,  duration: 0.20 },
    { freq: 1568, start: 5.25, duration: 0.20 },
    { freq: 1976, start: 5.50, duration: 0.60, volume: 0.6 },
  ]);
}

/** Longer / more festive alarm used at the end of a long break. ~8 seconds. */
export function playLongAlarm(): void {
  const cycle = (offset: number): BeepSpec[] => [
    { freq: 880,  start: offset + 0.0,  duration: 0.20 },
    { freq: 1175, start: offset + 0.25, duration: 0.20 },
    { freq: 1568, start: offset + 0.50, duration: 0.20 },
    { freq: 1318, start: offset + 0.85, duration: 0.20 },
    { freq: 1568, start: offset + 1.10, duration: 0.40, volume: 0.55 },
  ];
  playSequence([
    ...cycle(0.0),
    ...cycle(2.0),
    ...cycle(4.0),
    { freq: 1976, start: 6.2, duration: 0.80, volume: 0.6 },
  ]);
}

/** True if Web Audio is available in this environment (for UI gating). */
export function audioSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).AudioContext || (window as any).webkitAudioContext);
}
