let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playTone(frequency, duration, type = "sine") {
  if (!gameConfig.soundEnabled) return;

  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(context.destination);

  gain.gain.setValueAtTime(0.12, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function playCorrectSound() {
  playTone(600, 0.15);
  setTimeout(() => playTone(850, 0.25), 130);
}

function playWrongSound() {
  playTone(220, 0.35, "sawtooth");
}

function playTimeoutSound() {
  playTone(180, 0.5, "square");
}
