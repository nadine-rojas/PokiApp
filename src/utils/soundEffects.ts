// Utilidades de sonido (Web Audio API) y narración en voz alta (Web Speech API)

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playRewardSound(type: 'correct' | 'wrong' | 'fanfare' | 'pop') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'correct') {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.16, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.26);
      });
    } else if (type === 'wrong') {
      const notes = [311.13, 277.18]; // D#4 -> C#4 suave
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.14, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.24);
      });
    } else if (type === 'fanfare') {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.2, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.4);
      });
    } else if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.06);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  } catch {
    // Ignore audio errors on restricted environments
  }
}

export const PIANO_NOTES: {
  note: string;
  label: string;
  solfege: string;
  freq: number;
  isSharp?: boolean;
}[] = [
  { note: 'C4', label: 'Do', solfege: 'Do', freq: 261.63 },
  { note: 'C#4', label: 'Do#', solfege: 'Do#', freq: 277.18, isSharp: true },
  { note: 'D4', label: 'Re', solfege: 'Re', freq: 293.66 },
  { note: 'D#4', label: 'Re#', solfege: 'Re#', freq: 311.13, isSharp: true },
  { note: 'E4', label: 'Mi', solfege: 'Mi', freq: 329.63 },
  { note: 'F4', label: 'Fa', solfege: 'Fa', freq: 349.23 },
  { note: 'F#4', label: 'Fa#', solfege: 'Fa#', freq: 369.99, isSharp: true },
  { note: 'G4', label: 'Sol', solfege: 'Sol', freq: 392.0 },
  { note: 'G#4', label: 'Sol#', solfege: 'Sol#', freq: 415.3, isSharp: true },
  { note: 'A4', label: 'La', solfege: 'La', freq: 440.0 },
  { note: 'A#4', label: 'La#', solfege: 'La#', freq: 466.16, isSharp: true },
  { note: 'B4', label: 'Si', solfege: 'Si', freq: 493.88 },
  { note: 'C5', label: 'Do+', solfege: 'Do agudo', freq: 523.25 },
];

export function playPianoNote(freq: number) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2, now);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.06, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(gain);
    overtone.connect(overtoneGain);
    overtoneGain.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 0.78);
    overtone.stop(now + 0.55);
  } catch {
    // Ignore audio context errors
  }
}

export function speakSpanishText(
  text: string,
  onEnd?: () => void
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    playRewardSound('pop');
    if (onEnd) {
      const timer = setTimeout(onEnd, 1500);
      return () => clearTimeout(timer);
    }
    return () => {};
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.92;
    utterance.pitch = 1.08;
    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }
    window.speechSynthesis.speak(utterance);
    return () => {
      window.speechSynthesis.cancel();
    };
  } catch {
    if (onEnd) onEnd();
    return () => {};
  }
}

export function speakEnglishText(
  text: string,
  onEnd?: () => void
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    playRewardSound('pop');
    if (onEnd) {
      const timer = setTimeout(onEnd, 1500);
      return () => clearTimeout(timer);
    }
    return () => {};
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }
    window.speechSynthesis.speak(utterance);
    return () => {
      window.speechSynthesis.cancel();
    };
  } catch {
    if (onEnd) onEnd();
    return () => {};
  }
}

