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

/** End-of-focus alarm: three rising tones (A5 → A5 → E6). ~1 second total. */
export function playPhaseAlarm(): void {
  playSequence([
    { freq: 880,  start: 0.0,  duration: 0.22 },
    { freq: 880,  start: 0.30, duration: 0.22 },
    { freq: 1318, start: 0.60, duration: 0.35, volume: 0.5 },
  ]);
}

/** Louder, more attention-grabbing alarm (used optionally for long breaks). */
export function playLongAlarm(): void {
  playSequence([
    { freq: 880,  start: 0.0,  duration: 0.18 },
    { freq: 1175, start: 0.25, duration: 0.18 },
    { freq: 1568, start: 0.50, duration: 0.18 },
    { freq: 1318, start: 0.85, duration: 0.18 },
    { freq: 1568, start: 1.10, duration: 0.40, volume: 0.5 },
  ]);
}

/** True if Web Audio is available in this environment (for UI gating). */
export function audioSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).AudioContext || (window as any).webkitAudioContext);
}
