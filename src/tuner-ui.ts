const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function nearestNote(freq: number): { name: string; octave: number; cents: number; freq: number } {
  const exact = 69 + 12 * Math.log2(freq / 440);
  const midi = Math.round(exact);
  const cents = Math.round((exact - midi) * 100);
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  const refFreq = Math.round(440 * Math.pow(2, (midi - 69) / 12));
  return { name, octave, cents, freq: refFreq };
}

function centsIndicator(cents: number): string {
  const half = 8;
  const offset = Math.round((cents / 50) * half);
  const clamped = Math.max(-half, Math.min(half, offset));

  if (clamped === 0) {
    return "━".repeat(half) + "●" + "━".repeat(half);
  }

  const chars: string[] = new Array(half * 2 + 1).fill("━");
  chars[half] = "┃";

  if (clamped < 0) {
    for (let i = half + clamped; i < half; i++) chars[i] = "█";
  } else {
    for (let i = half + 1; i <= half + clamped; i++) chars[i] = "█";
  }

  return chars.join("");
}

export function renderTunerDisplay(freq: number, confidence: number): string {
  if (confidence < 0.5 || freq < 20 || freq > 5000) {
    return "───\n" + "━".repeat(8) + "┃" + "━".repeat(8);
  }

  const note = nearestNote(freq);
  const sign = note.cents >= 0 ? "+" : "";
  const header = `${note.name}${note.octave} ${note.freq}Hz ${sign}${note.cents}c`;

  return `${header}\n${centsIndicator(note.cents)}`;
}
