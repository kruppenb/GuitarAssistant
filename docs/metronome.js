"use strict";

const get = id => document.getElementById(id);
const defaults = { bpm: 64, beats: 4, accent: true, eighth: false, timed: false, minutes: 2, seconds: 0 };
const storageKey = "guitar-assistant.metronome.v1";

function integer(value, min, max, fallback) {
  if (value === "" || value == null || !Number.isFinite(Number(value))) return fallback;
  return Math.max(min, Math.min(max, Math.round(Number(value))));
}

function loadSettings() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { /* Private sessions are fine. */ }
  const settings = { ...defaults };
  settings.bpm = integer(saved.bpm, 20, 300, defaults.bpm);
  settings.beats = integer(saved.beats, 1, 16, defaults.beats);
  settings.minutes = integer(saved.minutes, 0, 999, defaults.minutes);
  settings.seconds = integer(saved.seconds, 0, 59, defaults.seconds);
  for (const key of ["accent", "eighth", "timed"]) {
    if (typeof saved[key] === "boolean") settings[key] = saved[key];
  }
  return settings;
}

const settings = loadSettings();
function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch { /* Storage is optional. */ }
}

// A native looping audio buffer keeps the pulse independent of animation frames
// and background-tab JavaScript timers. The end time is on the same audio clock.
function createBar(context, config) {
  const rate = 24000;
  const frames = Math.round(rate * 60 / config.bpm * config.beats);
  const buffer = context.createBuffer(1, frames, rate);
  const samples = buffer.getChannelData(0);
  function click(beat, pitch, volume) {
    const first = Math.round(beat * frames / config.beats);
    const count = Math.min(Math.ceil(rate * 0.042), frames - first);
    for (let i = 0; i < count; i++) {
      const t = i / rate;
      const attack = Math.min(1, t / 0.0014);
      const release = Math.min(1, (count - i - 1) / 32);
      const envelope = attack * release * Math.exp(-t * 125);
      const phase = 2 * Math.PI * pitch * t;
      samples[first + i] = volume * envelope * (0.8 * Math.sin(phase) + 0.2 * Math.sin(phase * 1.47));
    }
  }
  for (let beat = 0; beat < config.beats; beat++) {
    const accented = beat === 0 && config.accent;
    click(beat, accented ? 1420 : 960, accented ? 0.88 : 0.64);
    if (config.eighth) click(beat + 0.5, 710, 0.30);
  }
  return buffer;
}

let audio, voice, pending = false, frame = 0, lastBeat = -1;
let deadline = Infinity, timerEnd = Infinity, sessionStart = 0, lastClock = "";
const prefersStill = window.matchMedia("(prefers-reduced-motion: reduce)");
const runLength = () => settings.minutes * 60 + settings.seconds;
function formatTime(seconds) {
  return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
}

function controls() {
  get("bpm").value = settings.bpm;
  get("slider").value = settings.bpm;
  get("slower").disabled = settings.bpm <= 20;
  get("faster").disabled = settings.bpm >= 300;
  get("meter").value = settings.beats;
  for (const key of ["accent", "eighth", "timed"]) get(key).checked = settings[key];
  get("minutes").value = settings.minutes;
  get("seconds").value = String(settings.seconds).padStart(2, "0");
  const locked = Boolean(voice) || pending;
  get("timed").disabled = locked;
  get("minutes").disabled = get("seconds").disabled = locked || !settings.timed;
}

function buildLamps() {
  const lights = get("lamps");
  lights.replaceChildren();
  lights.style.setProperty("--columns", settings.beats > 8 ? Math.ceil(settings.beats / 2) : settings.beats);
  for (let beat = 0; beat < settings.beats; beat++) {
    const lamp = document.createElement("span");
    lamp.textContent = beat + 1;
    lamp.classList.toggle("accent", beat === 0 && settings.accent);
    lights.append(lamp);
  }
  lastBeat = -1;
}
function setClock(message) {
  if (message !== lastClock) { get("clock").textContent = message; lastClock = message; }
}
function idleClock() { setClock(settings.timed ? formatTime(runLength()) + " set" : "Continuous"); }
function clearError() { get("error").hidden = true; get("error").textContent = ""; }
function showError(message) { get("error").textContent = message; get("error").hidden = false; }
function beatPosition(at) {
  return voice.phase + Math.max(0, at - voice.start) / voice.beatDuration;
}
function retire(source) {
  source.onended = null;
  source.stop();
  source.disconnect();
}
function stopPlayback(finished = false) {
  cancelAnimationFrame(frame);
  if (voice) retire(voice.source);
  voice = null;
  deadline = timerEnd = Infinity;
  document.body.classList.remove("playing");
  get("status").textContent = finished ? "Time’s up" : "Ready";
  get("play").querySelector("span").textContent = "Start";
  get("arm").style.removeProperty("transform");
  buildLamps(); controls();
  if (finished) setClock("0:00 remaining"); else idleClock();
}
function launchLoop(config) {
  const buffer = createBar(audio, config);
  const now = audio.currentTime;
  if (deadline <= now) { stopPlayback(true); return; }
  const phase = voice ? beatPosition(now) : 0;
  if (voice) retire(voice.source);
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(audio.destination);
  const beatDuration = buffer.duration / config.beats;
  voice = { source, start: now, phase, beatDuration };
  source.onended = () => { if (voice?.source === source) stopPlayback(true); };
  source.start(now, (phase % config.beats) * beatDuration);
  if (Number.isFinite(deadline)) source.stop(deadline);
}
function showFrame() {
  if (!voice) return;
  if (performance.now() >= timerEnd) { stopPlayback(true); return; }
  const phase = beatPosition(audio.currentTime);
  const beat = Math.floor(phase) % settings.beats;
  const lights = get("lamps").children;
  if (beat !== lastBeat) {
    lights[lastBeat]?.classList.remove("on");
    lights[beat]?.classList.add("on");
    lastBeat = beat;
  }
  if (!prefersStill.matches) get("arm").style.transform = "rotate(" + (-36 * Math.cos(phase * Math.PI)) + "deg)";
  if (settings.timed) setClock(formatTime(Math.max(0, Math.ceil((timerEnd - performance.now()) / 1000))) + " remaining");
  else setClock(formatTime(Math.floor((performance.now() - sessionStart) / 1000)) + " elapsed");
  frame = requestAnimationFrame(showFrame);
}
async function togglePlayback() {
  if (voice) { stopPlayback(); return; }
  if (pending) return;
  clearError();
  if (settings.timed && runLength() === 0) {
    showError("Set at least one second on the timer."); get("seconds").focus(); return;
  }
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) { showError("Open this page in a browser that supports audio playback."); return; }
  pending = true;
  get("play").disabled = true;
  try {
    if (!audio) {
      audio = new Audio({ latencyHint: "interactive" });
      audio.onstatechange = () => {
        if (voice && audio.state !== "running") stopPlayback();
      };
    }
    await audio.resume();
    sessionStart = performance.now();
    deadline = settings.timed ? audio.currentTime + runLength() : Infinity;
    timerEnd = settings.timed ? sessionStart + runLength() * 1000 : Infinity;
    launchLoop(settings);
    document.body.classList.add("playing");
    get("play").querySelector("span").textContent = "Stop";
    get("status").textContent = "Playing";
    showFrame();
  } catch {
    stopPlayback();
    showError("Audio could not start. Check your browser’s sound settings and try again.");
  } finally {
    pending = false; get("play").disabled = false; controls();
  }
}
function apply(key, value) {
  clearError();
  const changed = settings[key] !== value;
  settings[key] = value;
  if (changed) {
    save();
    if (key === "beats" || key === "accent") buildLamps();
    if (voice) launchLoop(settings);
  }
  controls();
  if (!voice) idleClock();
}

for (let n = 1; n <= 16; n++) get("meter").add(new Option(String(n), String(n)));
for (let i = -8; i <= 8; i++) {
  const tick = document.createElement("i");
  tick.className = "tick" + (i % 4 === 0 ? " major" : "");
  tick.style.setProperty("--angle", (i * 5) + "deg");
  get("scale").append(tick);
}
get("bpm").addEventListener("change", e => apply("bpm", integer(e.target.value, 20, 300, settings.bpm)));
get("bpm").addEventListener("keydown", e => { if (e.key === "Enter") e.target.blur(); });
get("slider").addEventListener("input", e => { get("bpm").value = e.target.value; });
get("slider").addEventListener("change", e => apply("bpm", Number(e.target.value)));
get("slower").addEventListener("click", () => apply("bpm", Math.max(20, settings.bpm - 1)));
get("faster").addEventListener("click", () => apply("bpm", Math.min(300, settings.bpm + 1)));
get("meter").addEventListener("change", e => apply("beats", Number(e.target.value)));
for (const key of ["accent", "eighth", "timed"]) get(key).addEventListener("change", e => apply(key, e.target.checked));
for (const [key, max] of [["minutes", 999], ["seconds", 59]]) {
  get(key).addEventListener("change", e => apply(key, integer(e.target.value, 0, max, 0)));
  get(key).addEventListener("keydown", e => { if (e.key === "Enter") e.target.blur(); });
}
get("play").addEventListener("click", togglePlayback);
document.addEventListener("keydown", e => {
  if (e.code === "Space" && !e.repeat && !e.altKey && !e.ctrlKey && !e.metaKey &&
      !e.target.closest("input, select, button, textarea, [contenteditable]")) {
    e.preventDefault(); togglePlayback();
  }
});
window.addEventListener("pagehide", () => { if (voice) stopPlayback(); });
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && voice && performance.now() >= timerEnd) stopPlayback(true);
});
controls(); buildLamps(); idleClock();
