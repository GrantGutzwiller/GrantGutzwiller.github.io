(() => {
  const MODES = {
    caseWork: { label: 'Case Work', durationSeconds: 45 * 60 },
    presentation: { label: 'Presentation', durationSeconds: 5 * 60 }
  };

  const state = {
    mode: 'caseWork',
    remainingSeconds: MODES.caseWork.durationSeconds,
    isRunning: false,
    endTimeMs: 0,
    intervalId: null,
    audioContext: null
  };

  const elements = {
    modeButtons: [...document.querySelectorAll('.mode-button')],
    modeLabel: document.getElementById('timerModeLabel'),
    timerDisplay: document.getElementById('timerDisplay'),
    timerStatus: document.getElementById('timerStatus'),
    progressFill: document.getElementById('progressFill'),
    startPauseButton: document.getElementById('startPauseButton'),
    resetButton: document.getElementById('resetButton'),
    minusMinuteButton: document.getElementById('minusMinuteButton'),
    plusMinuteButton: document.getElementById('plusMinuteButton')
  };

  function formatTime(totalSeconds) {
    const safe = Math.max(0, totalSeconds);
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function getModeDuration() {
    return MODES[state.mode].durationSeconds;
  }

  function syncRemainingFromClock() {
    if (!state.isRunning) {
      return;
    }

    const deltaMs = state.endTimeMs - Date.now();
    state.remainingSeconds = Math.max(0, Math.ceil(deltaMs / 1000));
  }

  function renderStatus() {
    if (state.isRunning) {
      elements.timerStatus.textContent = 'Running...';
      return;
    }

    if (state.remainingSeconds === 0) {
      elements.timerStatus.textContent = 'Time is up.';
      return;
    }

    if (state.remainingSeconds === getModeDuration()) {
      elements.timerStatus.textContent = 'Ready to start.';
      return;
    }

    elements.timerStatus.textContent = 'Paused.';
  }

  function render() {
    const duration = getModeDuration();
    const progressRatio = duration > 0 ? state.remainingSeconds / duration : 0;
    const progressPercent = Math.max(0, Math.min(100, progressRatio * 100));

    elements.modeLabel.textContent = MODES[state.mode].label;
    elements.timerDisplay.textContent = formatTime(state.remainingSeconds);
    elements.progressFill.style.width = `${progressPercent}%`;
    elements.startPauseButton.textContent = state.isRunning ? 'Pause' : 'Start';
    elements.startPauseButton.setAttribute('aria-pressed', state.isRunning ? 'true' : 'false');

    elements.modeButtons.forEach((button) => {
      const isActive = button.dataset.mode === state.mode;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    renderStatus();
  }

  function clearTicking() {
    if (state.intervalId !== null) {
      window.clearInterval(state.intervalId);
      state.intervalId = null;
    }
  }

  function stopTimer() {
    syncRemainingFromClock();
    state.isRunning = false;
    clearTicking();
  }

  function playEndSound() {
    if (!state.audioContext) {
      return;
    }

    const context = state.audioContext;
    const now = context.currentTime;
    const totalBeeps = 4;

    for (let i = 0; i < totalBeeps; i += 1) {
      const toneStart = now + i * 0.35;
      const toneEnd = toneStart + 0.2;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(i % 2 === 0 ? 920 : 740, toneStart);
      gain.gain.setValueAtTime(0.0001, toneStart);
      gain.gain.exponentialRampToValueAtTime(0.22, toneStart + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, toneEnd);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(toneStart);
      oscillator.stop(toneEnd);
    }
  }

  function finishTimer() {
    state.remainingSeconds = 0;
    state.isRunning = false;
    clearTicking();
    render();
    playEndSound();
  }

  function tick() {
    syncRemainingFromClock();
    if (state.remainingSeconds <= 0) {
      finishTimer();
      return;
    }
    render();
  }

  async function ensureAudioContext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      return;
    }

    if (!state.audioContext) {
      state.audioContext = new Ctx();
    }

    if (state.audioContext.state === 'suspended') {
      try {
        await state.audioContext.resume();
      } catch (error) {
        // Browser can refuse resume if interaction conditions are not met.
      }
    }
  }

  async function toggleStartPause() {
    await ensureAudioContext();

    if (state.isRunning) {
      stopTimer();
      render();
      return;
    }

    if (state.remainingSeconds <= 0) {
      state.remainingSeconds = getModeDuration();
    }

    state.isRunning = true;
    state.endTimeMs = Date.now() + state.remainingSeconds * 1000;
    clearTicking();
    state.intervalId = window.setInterval(tick, 200);
    render();
  }

  function resetTimer() {
    stopTimer();
    state.remainingSeconds = getModeDuration();
    render();
  }

  function setMode(nextMode) {
    if (!Object.prototype.hasOwnProperty.call(MODES, nextMode)) {
      return;
    }

    stopTimer();
    state.mode = nextMode;
    state.remainingSeconds = getModeDuration();
    render();
  }

  function adjustMinutes(deltaMinutes) {
    const deltaSeconds = deltaMinutes * 60;

    if (state.isRunning) {
      state.endTimeMs += deltaSeconds * 1000;
      if (state.endTimeMs < Date.now()) {
        state.endTimeMs = Date.now();
      }
      syncRemainingFromClock();
      if (state.remainingSeconds <= 0) {
        finishTimer();
        return;
      }
      render();
      return;
    }

    state.remainingSeconds = Math.max(0, state.remainingSeconds + deltaSeconds);
    render();
  }

  function bindEvents() {
    elements.modeButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        await ensureAudioContext();
        setMode(button.dataset.mode);
      });
    });

    elements.startPauseButton.addEventListener('click', toggleStartPause);
    elements.resetButton.addEventListener('click', resetTimer);
    elements.minusMinuteButton.addEventListener('click', () => adjustMinutes(-1));
    elements.plusMinuteButton.addEventListener('click', () => adjustMinutes(1));
  }

  bindEvents();
  render();
})();
