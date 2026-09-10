/**
 * Audio Library for SAMAJ CONNECT Status / Stories and Posts
 * Provides royalty-free community devotional, festive & morning melodies
 * synthesized via Web Audio API + royalty-free open tracks + custom user audio upload.
 * Strictly free of copyrighted commercial recordings.
 */

export const COMMUNITY_MUSIC_TRACKS = [
  {
    id: "track_morning_prabhatiya",
    title: "પ્રભાતિયા ભૈરવ ધૂન (Morning Prabhatiya)",
    artist: "સમાજ સંગીત મંડળ",
    category: "devotional",
    duration: 32,
    melodyType: "prabhatiya",
    cover: "🌅",
  },
  {
    id: "track_mandir_aarti",
    title: "મંદિર આરતી અને શંખનાદ (Mandir Aarti & Bells)",
    artist: "પરંપરાગત ધૂન",
    category: "devotional",
    duration: 30,
    melodyType: "aarti",
    cover: "🪔",
  },
  {
    id: "track_krishna_flute",
    title: "શ્રીકૃષ્ણ વાંસળી મધુર સૂર (Krishna Flute Harmony)",
    artist: "ભક્તિ સૂર",
    category: "peaceful",
    duration: 28,
    melodyType: "flute",
    cover: "🪈",
  },
  {
    id: "track_garba_dhol",
    title: "ગરબા ઢોલ અને શરણાઈ બીટ (Garba Dhol Beat)",
    artist: "ઉત્સવ ઢોલી",
    category: "festive",
    duration: 25,
    melodyType: "garba",
    cover: "🥁",
  },
  {
    id: "track_shanti_mantra",
    title: "ઓમ શાંતિ ૐ ધ્યાન ધ્વનિ (Peace Meditation)",
    artist: "આધ્યાત્મિક સૂર",
    category: "meditation",
    duration: 35,
    melodyType: "meditation",
    cover: "🕉️",
  },
  {
    id: "track_shehnai_shubh",
    title: "શુભ શરણાઈ મંગલ ધૂન (Mangal Shehnai)",
    artist: "મંગલ વાદન",
    category: "festive",
    duration: 26,
    melodyType: "shehnai",
    cover: "🎺",
  },
];

let globalAudioCtx = null;
let currentPreviewNode = null;
let currentAudioElem = null;

function getAudioContext() {
  if (!globalAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) globalAudioCtx = new AudioCtx();
  }
  if (globalAudioCtx && globalAudioCtx.state === "suspended") {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

/**
 * Play synthesizer preview of community melody or real audio URL
 */
export function playTrackPreview(track, volume = 0.8, onEnd) {
  stopTrackPreview();

  // If track has an external or user-uploaded audio URL
  if (track.url) {
    try {
      const audio = new Audio(track.url);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.onended = () => {
        currentAudioElem = null;
        onEnd?.();
      };
      audio.play().catch((e) => console.warn("Audio play error", e));
      currentAudioElem = audio;
      return () => stopTrackPreview();
    } catch (e) {
      console.warn(e);
    }
  }

  // Web Audio Synthesizer for community melodies
  const ctx = getAudioContext();
  if (!ctx) return () => {};

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume * 0.25, ctx.currentTime);
  masterGain.connect(ctx.destination);

  const activeOscillators = [];
  const melody = getMelodyNotes(track.melodyType || "flute");
  const now = ctx.currentTime;
  let noteTime = now + 0.05;

  // Play melody loop for 25 seconds
  const loops = 4;
  for (let l = 0; l < loops; l++) {
    for (const n of melody) {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = n.wave || "sine";
      osc.frequency.setValueAtTime(n.freq, noteTime);

      // Attack and release envelope
      noteGain.gain.setValueAtTime(0.0001, noteTime);
      noteGain.gain.exponentialRampToValueAtTime(n.vol || 0.4, noteTime + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + n.dur);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + n.dur + 0.1);
      activeOscillators.push(osc);

      noteTime += n.dur;
    }
  }

  currentPreviewNode = {
    stop: () => {
      activeOscillators.forEach((o) => {
        try {
          o.stop();
        } catch {}
      });
      try {
        masterGain.disconnect();
      } catch {}
    },
  };

  const timer = setTimeout(() => {
    stopTrackPreview();
    onEnd?.();
  }, (noteTime - now) * 1000);

  return () => {
    clearTimeout(timer);
    stopTrackPreview();
  };
}

export function stopTrackPreview() {
  if (currentAudioElem) {
    try {
      currentAudioElem.pause();
      currentAudioElem.currentTime = 0;
    } catch {}
    currentAudioElem = null;
  }
  if (currentPreviewNode) {
    try {
      currentPreviewNode.stop();
    } catch {}
    currentPreviewNode = null;
  }
}

function getMelodyNotes(type) {
  // Traditional Indian Raga scales: Sa, Re, Ga, Ma, Pa, Dha, Ni
  // C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25
  switch (type) {
    case "prabhatiya":
      // Bhairav morning scale: Sa Re(flat) Ga Ma Pa Dha(flat) Ni Sa
      return [
        { freq: 261.63, dur: 0.6, wave: "triangle", vol: 0.35 },
        { freq: 277.18, dur: 0.5, wave: "triangle", vol: 0.35 },
        { freq: 329.63, dur: 0.8, wave: "triangle", vol: 0.4 },
        { freq: 349.23, dur: 0.6, wave: "triangle", vol: 0.35 },
        { freq: 392.0, dur: 1.0, wave: "sine", vol: 0.45 },
        { freq: 415.3, dur: 0.6, wave: "triangle", vol: 0.35 },
        { freq: 493.88, dur: 0.6, wave: "triangle", vol: 0.35 },
        { freq: 523.25, dur: 1.2, wave: "sine", vol: 0.4 },
        { freq: 392.0, dur: 0.8, wave: "sine", vol: 0.4 },
      ];
    case "flute":
      // Krishna Flute melody (Mohanam / Bhoop raga: Sa Re Ga Pa Dha Sa)
      return [
        { freq: 523.25, dur: 0.5, wave: "sine", vol: 0.4 },
        { freq: 587.33, dur: 0.5, wave: "sine", vol: 0.4 },
        { freq: 659.25, dur: 0.7, wave: "sine", vol: 0.45 },
        { freq: 783.99, dur: 0.9, wave: "sine", vol: 0.5 },
        { freq: 880.0, dur: 0.6, wave: "sine", vol: 0.45 },
        { freq: 783.99, dur: 0.7, wave: "sine", vol: 0.4 },
        { freq: 659.25, dur: 0.8, wave: "sine", vol: 0.4 },
        { freq: 587.33, dur: 0.6, wave: "sine", vol: 0.35 },
        { freq: 523.25, dur: 1.2, wave: "sine", vol: 0.45 },
      ];
    case "garba":
      // Festive Dhol & Shehnai tempo
      return [
        { freq: 196.0, dur: 0.25, wave: "sawtooth", vol: 0.3 }, // Dhol stroke
        { freq: 392.0, dur: 0.25, wave: "triangle", vol: 0.4 },
        { freq: 440.0, dur: 0.25, wave: "triangle", vol: 0.4 },
        { freq: 493.88, dur: 0.3, wave: "triangle", vol: 0.4 },
        { freq: 587.33, dur: 0.5, wave: "triangle", vol: 0.45 },
        { freq: 523.25, dur: 0.3, wave: "triangle", vol: 0.4 },
        { freq: 440.0, dur: 0.3, wave: "triangle", vol: 0.35 },
        { freq: 392.0, dur: 0.6, wave: "triangle", vol: 0.4 },
      ];
    case "aarti":
      // Bell and Aarti tune
      return [
        { freq: 783.99, dur: 0.4, wave: "sine", vol: 0.4 },
        { freq: 880.0, dur: 0.4, wave: "sine", vol: 0.4 },
        { freq: 987.77, dur: 0.7, wave: "sine", vol: 0.45 },
        { freq: 1046.5, dur: 0.9, wave: "sine", vol: 0.45 },
        { freq: 783.99, dur: 0.5, wave: "sine", vol: 0.4 },
        { freq: 659.25, dur: 0.8, wave: "sine", vol: 0.35 },
      ];
    case "shehnai":
      return [
        { freq: 440.0, dur: 0.35, wave: "sawtooth", vol: 0.25 },
        { freq: 493.88, dur: 0.35, wave: "sawtooth", vol: 0.25 },
        { freq: 554.37, dur: 0.6, wave: "sawtooth", vol: 0.3 },
        { freq: 659.25, dur: 0.8, wave: "sawtooth", vol: 0.3 },
        { freq: 554.37, dur: 0.4, wave: "sawtooth", vol: 0.25 },
        { freq: 440.0, dur: 0.7, wave: "sawtooth", vol: 0.25 },
      ];
    case "meditation":
    default:
      // Calm Om drone
      return [
        { freq: 130.81, dur: 2.0, wave: "sine", vol: 0.4 }, // Low C
        { freq: 196.0, dur: 2.0, wave: "sine", vol: 0.35 }, // G
        { freq: 261.63, dur: 2.2, wave: "sine", vol: 0.3 }, // C4
        { freq: 329.63, dur: 2.0, wave: "sine", vol: 0.25 }, // E4
      ];
  }
}
