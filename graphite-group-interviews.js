(() => {
  const STORAGE_KEY = 'graphite-group-interview-timer-v1';

  const DINO_START_SECONDS = 5 * 60 + 9.45;
  const DINO_HIT_MS = 9450;
  const DINO_END_MS = 10000;
  const DINO_HIDE_AFTER_START_MS = 15000;
  const CASE_WORK_MILESTONE_SECONDS = [15 * 60, 5 * 60 + 10, 60];

  const DVD_START_SECONDS = 40 * 60;
  const CORNER_HIT_SECONDS = 16 * 60;
  const DVD_END_SECONDS = 0;
  const FINAL_CORNER_HIT_SECONDS = 2;
  const DVD_EDGE_MARGIN = 0;
  const DVD_RETURN_DURATION_MS = 1400;
  const DVD_MIN_SCALE = 0.34;
  const DVD_MAX_SCALE = 1;
  const DVD_SCALE_DOWN_MS = 900;
  const DVD_PRE_HIT_VX = 208;
  const DVD_PRE_HIT_VY = 153;
  const DVD_POST_HIT_VX = 232;
  const DVD_POST_HIT_VY = 171;
  const DVD_CORNER_HITS = [
    { remainingSeconds: CORNER_HIT_SECONDS, speedX: DVD_PRE_HIT_VX, speedY: DVD_PRE_HIT_VY },
    { remainingSeconds: FINAL_CORNER_HIT_SECONDS, speedX: DVD_POST_HIT_VX, speedY: DVD_POST_HIT_VY }
  ];
  // graphite-logo-tight.png is graphite-logo-black-256.png cropped to the mark.
  const HEADER_LOGO_CROP = { widthRatio: 176 / 256, centerYRatio: 131 / 256 };
  const PERFECT_CORNER_TOLERANCE_PX = 0.8;
  const CORNER_FIREWORK_COOLDOWN_MS = 180;
  const MAX_CORNER_HIT_STEP_SECONDS = 1;

  const FIREWORK_PARTICLE_COUNT = 34;
  const FIREWORK_DURATION_MS = 780;
  const FINAL_FIREWORK_PARTICLE_COUNT = 90;
  const FINAL_FIREWORK_DURATION_MS = 3200;

  const MODES = {
    caseWork: { label: 'Case Work', durationSeconds: 45 * 60 },
    presentation: { label: 'Presentation', durationSeconds: 10 * 60 }
  };

  const state = {
    mode: 'caseWork',
    remainingSeconds: MODES.caseWork.durationSeconds,
    isRunning: false,
    endTimeMs: 0,
    pausedRemainingPrecise: null,
    intervalId: null,
    audioContext: null,
    wakeLock: null,
    wakeLockRequest: null,
    wakeLockDenied: false,

    dinoEndTimeoutId: null,
    dinoOverlayTimeoutId: null,
    dinoHideTimeoutId: null,
    dinoSequenceStarted: false,

    dvdActive: false,
    dvdPath: null,
    dvdPosition: { x: 0, y: 0 },
    dvdSize: { w: 75, h: 86 },
    dvdBounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
    dvdRafId: null,
    lastRemainingPrecise: null,
    dvdReturningActive: false,
    dvdReturnStartMs: null,
    dvdReturnFrom: null,
    dvdReturnTo: null,
    dvdScale: DVD_MAX_SCALE,
    dvdScaleAnimating: false,
    dvdScaleTweenStartMs: null,
    dvdScaleTweenDurationMs: 0,
    dvdScaleFrom: DVD_MAX_SCALE,
    dvdScaleTo: DVD_MAX_SCALE,
    lastObservedRemainingPrecise: null,
    dvdCurrentCornerContactKey: null,
    dvdLastCornerFireworkMs: null,
    lastMilestoneRemainingPrecise: null,

    fireworksActive: false,
    fireworksParticles: [],
    fireworksContext: null,
    fireworksRafId: null,
    fireworksLastFrameMs: null
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
    plusMinuteButton: document.getElementById('plusMinuteButton'),
    fullscreenButton: document.getElementById('fullscreenButton'),

    brandLogo: document.querySelector('.brand-logo'),
    dvdLogoLayer: document.getElementById('dvdLogoLayer'),
    dvdLogoFloating: document.getElementById('dvdLogoFloating'),
    fireworksLayer: document.getElementById('fireworksLayer'),

    dinoGifWrap: document.querySelector('.dino-gif-wrap'),
    dinoGif: document.querySelector('.dino-gif')
  };

  const BASE_TITLE = document.title;
  // The static page (graphite-group-interviews/static/) is just the timer: no bouncing logo, fireworks or dino.
  const EFFECTS_ENABLED = document.body.dataset.effects !== 'off';

  function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

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

  function getRemainingSecondsPrecise() {
    if (state.isRunning && state.endTimeMs > 0) {
      return Math.max(0, (state.endTimeMs - Date.now()) / 1000);
    }
    // While paused, keep the sub-second remainder the display rounds away.
    if (isFiniteNumber(state.pausedRemainingPrecise) && Math.ceil(state.pausedRemainingPrecise) === state.remainingSeconds) {
      return state.pausedRemainingPrecise;
    }
    return state.remainingSeconds;
  }

  function isFinalFiveCaseWork() {
    const remaining = getRemainingSecondsPrecise();
    return state.isRunning && state.mode === 'caseWork' && remaining > 0 && remaining <= DINO_START_SECONDS;
  }

  function isDvdPhaseRange(remaining) {
    return state.mode === 'caseWork' && remaining <= DVD_START_SECONDS && remaining > DVD_END_SECONDS;
  }

  function isUnitPoint(point) {
    return Boolean(point) && isFiniteNumber(point.u) && isFiniteNumber(point.v);
  }

  function isValidDvdPath(path) {
    return Array.isArray(path) && path.length > 0 && path.every((segment) => (
      Boolean(segment) &&
      isFiniteNumber(segment.startRemaining) &&
      isFiniteNumber(segment.endRemaining) &&
      isUnitPoint(segment.start) &&
      isUnitPoint(segment.velocity) &&
      isUnitPoint(segment.end)
    ));
  }

  function persistState() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode: state.mode,
          remainingSeconds: state.remainingSeconds,
          isRunning: state.isRunning,
          endTimeMs: state.endTimeMs,
          pausedRemainingPrecise: state.pausedRemainingPrecise,
          dvd: {
            path: state.dvdPath
          }
        })
      );
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function restoreState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const saved = JSON.parse(raw);
      if (!saved || !Object.prototype.hasOwnProperty.call(MODES, saved.mode)) {
        return;
      }

      state.mode = saved.mode;
      state.isRunning = Boolean(saved.isRunning);
      state.endTimeMs = Number(saved.endTimeMs) || 0;
      state.remainingSeconds = Math.max(0, Math.floor(Number(saved.remainingSeconds) || 0));

      if (state.isRunning && state.endTimeMs > 0) {
        syncRemainingFromClock();
        if (state.remainingSeconds <= 0) {
          state.remainingSeconds = 0;
          state.isRunning = false;
          state.endTimeMs = 0;
        }
      } else if (state.remainingSeconds === 0) {
        state.remainingSeconds = getModeDuration();
      } else if (isFiniteNumber(saved.pausedRemainingPrecise)) {
        state.pausedRemainingPrecise = saved.pausedRemainingPrecise;
      }

      // Paths saved by older versions were in pixels; those are dropped and re-planned.
      if (saved.dvd && isValidDvdPath(saved.dvd.path)) {
        state.dvdPath = saved.dvd.path;
      }
    } catch (error) {
      // Ignore malformed cached state.
    }
  }

  function isFullscreen() {
    return Boolean(document.fullscreenElement);
  }

  function updateFullscreenButtonLabel() {
    if (!elements.fullscreenButton) {
      return;
    }

    elements.fullscreenButton.textContent = isFullscreen() ? 'Exit Fullscreen' : 'Fullscreen';
  }

  function renderStatus() {
    if (isFinalFiveCaseWork()) {
      elements.timerStatus.textContent = 'Final 5 minutes.';
      return;
    }

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

  function playMilestoneChime(frequencies) {
    if (!state.audioContext || !Array.isArray(frequencies) || frequencies.length === 0) {
      return;
    }

    const context = state.audioContext;
    const scheduleChime = () => {
      const now = context.currentTime + 0.02;
      frequencies.forEach((frequency, index) => {
        const toneStart = now + index * 0.16;
        const toneEnd = toneStart + 0.26;
        const baseOsc = context.createOscillator();
        const sparkleOsc = context.createOscillator();
        const baseGain = context.createGain();
        const sparkleGain = context.createGain();

        baseOsc.type = 'triangle';
        sparkleOsc.type = 'sine';
        baseOsc.frequency.setValueAtTime(frequency, toneStart);
        sparkleOsc.frequency.setValueAtTime(frequency * 2, toneStart);

        baseGain.gain.setValueAtTime(0.0001, toneStart);
        baseGain.gain.exponentialRampToValueAtTime(0.36, toneStart + 0.014);
        baseGain.gain.exponentialRampToValueAtTime(0.0001, toneEnd);

        sparkleGain.gain.setValueAtTime(0.0001, toneStart);
        sparkleGain.gain.exponentialRampToValueAtTime(0.09, toneStart + 0.018);
        sparkleGain.gain.exponentialRampToValueAtTime(0.0001, toneEnd);

        baseOsc.connect(baseGain);
        sparkleOsc.connect(sparkleGain);
        baseGain.connect(context.destination);
        sparkleGain.connect(context.destination);

        baseOsc.start(toneStart);
        sparkleOsc.start(toneStart);
        baseOsc.stop(toneEnd);
        sparkleOsc.stop(toneEnd);
      });
    };

    if (context.state === 'suspended') {
      context.resume().then(scheduleChime).catch(() => {});
      return;
    }

    scheduleChime();
  }

  function maybePlayMilestoneChimes(remainingPrecise) {
    const previous = state.lastMilestoneRemainingPrecise;
    if (!state.isRunning || state.mode !== 'caseWork' || !isFiniteNumber(previous)) {
      state.lastMilestoneRemainingPrecise = remainingPrecise;
      return;
    }

    CASE_WORK_MILESTONE_SECONDS.forEach((threshold) => {
      if (previous > threshold && remainingPrecise <= threshold) {
        if (threshold === 15 * 60) {
          playMilestoneChime([523.25, 659.25, 783.99]);
          return;
        }
        if (threshold === 5 * 60 + 10) {
          playMilestoneChime([587.33, 739.99, 987.77]);
          return;
        }
        playMilestoneChime([392.0, 523.25, 659.25]);
      }
    });

    state.lastMilestoneRemainingPrecise = remainingPrecise;
  }

  function resetDinoScene() {
    if (state.dinoEndTimeoutId !== null) {
      window.clearTimeout(state.dinoEndTimeoutId);
      state.dinoEndTimeoutId = null;
    }
    if (state.dinoOverlayTimeoutId !== null) {
      window.clearTimeout(state.dinoOverlayTimeoutId);
      state.dinoOverlayTimeoutId = null;
    }
    if (state.dinoHideTimeoutId !== null) {
      window.clearTimeout(state.dinoHideTimeoutId);
      state.dinoHideTimeoutId = null;
    }
    state.dinoSequenceStarted = false;

    if (elements.dinoGifWrap) {
      elements.dinoGifWrap.classList.remove('show-overlay');
      elements.dinoGifWrap.classList.remove('dino-ended');
      elements.dinoGifWrap.classList.remove('dino-hidden');
    }
  }

  function startDinoSequence() {
    if (!elements.dinoGifWrap || !elements.dinoGif || state.dinoSequenceStarted) {
      return;
    }

    state.dinoSequenceStarted = true;
    elements.dinoGifWrap.classList.remove('show-overlay');
    elements.dinoGifWrap.classList.remove('dino-ended');
    elements.dinoGifWrap.classList.remove('dino-hidden');

    const cleanSrc = elements.dinoGif.src.split('?')[0];
    elements.dinoGif.src = `${cleanSrc}?v=${Date.now()}`;

    state.dinoOverlayTimeoutId = window.setTimeout(() => {
      if (!isFinalFiveCaseWork()) {
        return;
      }
      elements.dinoGifWrap.classList.add('show-overlay');
      state.dinoOverlayTimeoutId = null;
    }, DINO_HIT_MS);

    state.dinoEndTimeoutId = window.setTimeout(() => {
      if (!isFinalFiveCaseWork()) {
        return;
      }
      elements.dinoGifWrap.classList.add('dino-ended');
      state.dinoEndTimeoutId = null;
    }, DINO_END_MS);

    state.dinoHideTimeoutId = window.setTimeout(() => {
      if (!isFinalFiveCaseWork()) {
        return;
      }
      elements.dinoGifWrap.classList.add('dino-hidden');
      state.dinoHideTimeoutId = null;
    }, DINO_HIDE_AFTER_START_MS);
  }

  function updateDinoScene() {
    if (isFinalFiveCaseWork()) {
      startDinoSequence();
      return;
    }

    resetDinoScene();
  }

  function clampUnit(value) {
    return Math.max(0, Math.min(1, value));
  }

  function getViewportSize() {
    const root = document.documentElement;
    return {
      w: root.clientWidth || window.innerWidth,
      h: root.clientHeight || window.innerHeight
    };
  }

  function getCssSize(element, property) {
    const size = parseFloat(window.getComputedStyle(element)[property]);
    return isFiniteNumber(size) ? size : 0;
  }

  function updateDvdSize() {
    if (!elements.dvdLogoFloating) {
      return;
    }

    // The CSS size ignores the scale transform and, unlike offsetHeight, keeps
    // fractional pixels. The logo always bounces at DVD_MIN_SCALE.
    const logo = elements.dvdLogoFloating;
    const width = getCssSize(logo, 'width') || Math.min(window.innerWidth * 0.56, 220);
    const aspect = logo.naturalWidth > 0 ? logo.naturalHeight / logo.naturalWidth : 1;
    const height = getCssSize(logo, 'height') || width * aspect;
    state.dvdSize = { w: width * DVD_MIN_SCALE, h: height * DVD_MIN_SCALE };
  }

  function updateDvdBounds() {
    const viewport = getViewportSize();
    const minX = DVD_EDGE_MARGIN + state.dvdSize.w / 2;
    const maxX = viewport.w - DVD_EDGE_MARGIN - state.dvdSize.w / 2;
    const minY = DVD_EDGE_MARGIN + state.dvdSize.h / 2;
    const maxY = viewport.h - DVD_EDGE_MARGIN - state.dvdSize.h / 2;

    state.dvdBounds = {
      minX,
      maxX: Math.max(minX, maxX),
      minY,
      maxY: Math.max(minY, maxY)
    };
  }

  // The path is planned in unit coordinates (0 to 1 across the bounce area), so the
  // corner hits stay exact when the viewport changes size mid-run.
  function toScreenPoint(point) {
    const { minX, maxX, minY, maxY } = state.dvdBounds;
    return {
      x: minX + point.u * (maxX - minX),
      y: minY + point.v * (maxY - minY)
    };
  }

  function toUnitPoint(point) {
    const { minX, maxX, minY, maxY } = state.dvdBounds;
    return {
      u: maxX > minX ? clampUnit((point.x - minX) / (maxX - minX)) : 0,
      v: maxY > minY ? clampUnit((point.y - minY) / (maxY - minY)) : 0
    };
  }

  function applyDvdPosition() {
    if (!elements.dvdLogoFloating) {
      return;
    }

    elements.dvdLogoFloating.style.transform = (
      `translate3d(${state.dvdPosition.x}px, ${state.dvdPosition.y}px, 0) translate(-50%, -50%) scale(${state.dvdScale})`
    );
  }

  function getHeaderLogoCenter() {
    if (elements.brandLogo) {
      const rect = elements.brandLogo.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height * HEADER_LOGO_CROP.centerYRatio };
      }
    }

    return { x: window.innerWidth / 2, y: Math.max(120, window.innerHeight * 0.16) };
  }

  function getHeaderLogoScale() {
    // The scale at which the floating logo exactly covers the header mark.
    const headerWidth = elements.brandLogo ? getCssSize(elements.brandLogo, 'width') : 0;
    const logoWidth = elements.dvdLogoFloating ? getCssSize(elements.dvdLogoFloating, 'width') : 0;
    if (headerWidth > 0 && logoWidth > 0) {
      return (headerWidth * HEADER_LOGO_CROP.widthRatio) / logoWidth;
    }
    return DVD_MAX_SCALE;
  }

  function easeInOutCubic(t) {
    if (t < 0.5) {
      return 4 * t * t * t;
    }
    return 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function setDvdScaleImmediate(scale) {
    state.dvdScale = scale;
    state.dvdScaleAnimating = false;
    state.dvdScaleTweenStartMs = null;
    state.dvdScaleTweenDurationMs = 0;
    state.dvdScaleFrom = scale;
    state.dvdScaleTo = scale;
  }

  function beginDvdScaleTween(targetScale, durationMs, now) {
    const startMs = isFiniteNumber(now) ? now : performance.now();
    state.dvdScaleAnimating = true;
    state.dvdScaleTweenStartMs = startMs;
    state.dvdScaleTweenDurationMs = Math.max(1, durationMs);
    state.dvdScaleFrom = state.dvdScale;
    state.dvdScaleTo = targetScale;
  }

  function updateDvdScale(now) {
    if (!state.dvdScaleAnimating || !isFiniteNumber(state.dvdScaleTweenStartMs)) {
      return;
    }

    const elapsed = now - state.dvdScaleTweenStartMs;
    const t = Math.max(0, Math.min(1, elapsed / state.dvdScaleTweenDurationMs));
    const eased = easeInOutCubic(t);
    state.dvdScale = state.dvdScaleFrom + (state.dvdScaleTo - state.dvdScaleFrom) * eased;

    if (t >= 1) {
      setDvdScaleImmediate(state.dvdScaleTo);
    }
  }

  function startDvdReturnAnimation(now) {
    if (!state.dvdActive || state.dvdReturningActive) {
      return;
    }

    state.dvdReturningActive = true;
    state.dvdReturnStartMs = now;
    state.dvdReturnFrom = { x: state.dvdPosition.x, y: state.dvdPosition.y };
    state.dvdReturnTo = getHeaderLogoCenter();
    beginDvdScaleTween(getHeaderLogoScale(), DVD_RETURN_DURATION_MS, now);
  }

  function cancelDvdReturnAnimation() {
    state.dvdReturningActive = false;
    state.dvdReturnStartMs = null;
    state.dvdReturnFrom = null;
    state.dvdReturnTo = null;
  }

  function updateDvdReturnAnimation(now) {
    if (!state.dvdReturningActive || !state.dvdReturnFrom || !state.dvdReturnTo || !isFiniteNumber(state.dvdReturnStartMs)) {
      return true;
    }

    const elapsed = now - state.dvdReturnStartMs;
    const t = Math.max(0, Math.min(1, elapsed / DVD_RETURN_DURATION_MS));
    const eased = easeInOutCubic(t);

    state.dvdPosition.x = state.dvdReturnFrom.x + (state.dvdReturnTo.x - state.dvdReturnFrom.x) * eased;
    state.dvdPosition.y = state.dvdReturnFrom.y + (state.dvdReturnTo.y - state.dvdReturnFrom.y) * eased;
    applyDvdPosition();

    if (t >= 1) {
      cancelDvdReturnAnimation();
      return true;
    }

    return false;
  }

  function clearFireworks() {
    state.fireworksParticles = [];
    state.fireworksActive = false;
    document.body.classList.remove('fireworks-active');

    if (state.fireworksRafId !== null) {
      window.cancelAnimationFrame(state.fireworksRafId);
      state.fireworksRafId = null;
    }
    state.fireworksLastFrameMs = null;

    if (state.fireworksContext) {
      state.fireworksContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  function resizeFireworksCanvas() {
    if (!elements.fireworksLayer) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(window.innerWidth));
    const height = Math.max(1, Math.floor(window.innerHeight));

    elements.fireworksLayer.width = Math.floor(width * dpr);
    elements.fireworksLayer.height = Math.floor(height * dpr);
    elements.fireworksLayer.style.width = `${width}px`;
    elements.fireworksLayer.style.height = `${height}px`;

    state.fireworksContext = elements.fireworksLayer.getContext('2d');
    if (state.fireworksContext) {
      state.fireworksContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.fireworksContext.clearRect(0, 0, width, height);
    }
  }

  function triggerFireworks(x, y, options = {}) {
    if (!elements.fireworksLayer) {
      return;
    }

    const particleCount = isFiniteNumber(options.particleCount) ? Math.max(1, Math.floor(options.particleCount)) : FIREWORK_PARTICLE_COUNT;
    const durationMs = isFiniteNumber(options.durationMs) ? Math.max(80, options.durationMs) : FIREWORK_DURATION_MS;
    const speedMultiplier = isFiniteNumber(options.speedMultiplier) ? options.speedMultiplier : 1;
    const sizeMultiplier = isFiniteNumber(options.sizeMultiplier) ? options.sizeMultiplier : 1;
    // A direction confines the burst to one quadrant, e.g. back into the screen from a corner.
    const direction = options.direction || null;
    const arc = direction ? Math.PI / 2 : Math.PI * 2;

    resizeFireworksCanvas();
    state.fireworksParticles = [];

    for (let i = 0; i < particleCount; i += 1) {
      const angle = Math.random() * arc;
      const speed = (95 + Math.random() * 220) * speedMultiplier;
      state.fireworksParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed * (direction ? direction.x : 1),
        vy: Math.sin(angle) * speed * (direction ? direction.y : 1),
        ageMs: 0,
        durationMs: durationMs * (0.82 + Math.random() * 0.38),
        size: (1.2 + Math.random() * 2.1) * sizeMultiplier
      });
    }

    state.fireworksActive = true;
    document.body.classList.add('fireworks-active');

    if (state.fireworksRafId === null) {
      state.fireworksLastFrameMs = null;
      state.fireworksRafId = window.requestAnimationFrame(fireworksFrame);
    }
  }

  function updateFireworks(deltaSec) {
    if (!state.fireworksActive || !state.fireworksContext) {
      return;
    }

    const ctx = state.fireworksContext;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    state.fireworksParticles = state.fireworksParticles.filter((particle) => {
      particle.ageMs += deltaSec * 1000;
      if (particle.ageMs >= particle.durationMs) {
        return false;
      }

      particle.vy += 350 * deltaSec;
      particle.x += particle.vx * deltaSec;
      particle.y += particle.vy * deltaSec;

      const alpha = Math.max(0, 1 - particle.ageMs / particle.durationMs);
      ctx.fillStyle = `rgba(245, 245, 245, ${alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      return true;
    });

    if (state.fireworksParticles.length === 0) {
      clearFireworks();
    }
  }

  // Fireworks run on their own loop so they finish even while the logo flies home or the timer is paused.
  function fireworksFrame(now) {
    state.fireworksRafId = null;
    if (!state.fireworksActive) {
      return;
    }

    if (state.fireworksLastFrameMs === null) {
      state.fireworksLastFrameMs = now;
    }

    const deltaSec = Math.min(0.05, Math.max(0, (now - state.fireworksLastFrameMs) / 1000));
    state.fireworksLastFrameMs = now;
    updateFireworks(deltaSec);

    if (state.fireworksActive) {
      state.fireworksRafId = window.requestAnimationFrame(fireworksFrame);
    }
  }

  function reflectUnit(start, velocity, elapsedSeconds) {
    const unfolded = start + velocity * elapsedSeconds;
    const phase = ((unfolded % 2) + 2) % 2;
    return phase <= 1 ? phase : 2 - phase;
  }

  function solveUnitVelocityToEdge(start, targetIsMin, durationSeconds, desiredSpeed) {
    if (durationSeconds <= 0) {
      return 0;
    }

    // Unfolded, the target edge sits at edge + 2m; take the m whose speed is closest to desired.
    const edge = targetIsMin ? 0 : 1;
    const minSpeed = desiredSpeed * 0.2;
    let best = null;

    [1, -1].forEach((direction) => {
      const center = Math.round((start + direction * desiredSpeed * durationSeconds - edge) / 2);
      for (let k = -2; k <= 2; k += 1) {
        const velocity = (edge + 2 * (center + k) - start) / durationSeconds;
        if (Math.abs(velocity) < minSpeed) {
          continue;
        }
        const deviation = Math.abs(Math.abs(velocity) - desiredSpeed);
        if (!best || deviation < best.deviation) {
          best = { velocity, deviation };
        }
      }
    });

    return best ? best.velocity : (edge - start) / durationSeconds;
  }

  function pickBestCornerPath(start, durationSeconds, targetSpeedX, targetSpeedY) {
    const spanX = Math.max(1, state.dvdBounds.maxX - state.dvdBounds.minX);
    const spanY = Math.max(1, state.dvdBounds.maxY - state.dvdBounds.minY);
    let best = null;

    [0, 1].forEach((cornerU) => {
      [0, 1].forEach((cornerV) => {
        const velocity = {
          u: solveUnitVelocityToEdge(start.u, cornerU === 0, durationSeconds, targetSpeedX / spanX),
          v: solveUnitVelocityToEdge(start.v, cornerV === 0, durationSeconds, targetSpeedY / spanY)
        };
        const speedPenalty = (
          Math.abs(Math.abs(velocity.u) * spanX - targetSpeedX) +
          Math.abs(Math.abs(velocity.v) * spanY - targetSpeedY)
        );

        if (!best || speedPenalty < best.speedPenalty) {
          best = { corner: { u: cornerU, v: cornerV }, velocity, speedPenalty };
        }
      });
    });

    return best;
  }

  function planDvdPath(anchor, anchorRemaining) {
    const path = [];
    let start = anchor;
    let startRemaining = anchorRemaining;

    DVD_CORNER_HITS.forEach((hit) => {
      if (startRemaining <= hit.remainingSeconds) {
        return;
      }

      const best = pickBestCornerPath(start, startRemaining - hit.remainingSeconds, hit.speedX, hit.speedY);
      path.push({
        startRemaining,
        endRemaining: hit.remainingSeconds,
        start,
        velocity: best.velocity,
        end: best.corner
      });
      start = best.corner;
      startRemaining = hit.remainingSeconds;
    });

    state.dvdPath = path.length > 0 ? path : null;
  }

  function getDvdUnitPoint(remaining) {
    const path = state.dvdPath;
    const segment = path.find((candidate) => remaining > candidate.endRemaining);
    if (!segment) {
      return path[path.length - 1].end;
    }

    const elapsed = segment.startRemaining - remaining;
    return {
      u: reflectUnit(segment.start.u, segment.velocity.u, elapsed),
      v: reflectUnit(segment.start.v, segment.velocity.v, elapsed)
    };
  }

  function getCornerKey(corner) {
    return `${corner.v < 0.5 ? 't' : 'b'}${corner.u < 0.5 ? 'l' : 'r'}`;
  }

  function getCornerContact(position) {
    const atLeft = Math.abs(position.x - state.dvdBounds.minX) <= PERFECT_CORNER_TOLERANCE_PX;
    const atRight = Math.abs(position.x - state.dvdBounds.maxX) <= PERFECT_CORNER_TOLERANCE_PX;
    const atTop = Math.abs(position.y - state.dvdBounds.minY) <= PERFECT_CORNER_TOLERANCE_PX;
    const atBottom = Math.abs(position.y - state.dvdBounds.maxY) <= PERFECT_CORNER_TOLERANCE_PX;

    if (!(atLeft || atRight) || !(atTop || atBottom)) {
      return null;
    }

    return { u: atLeft ? 0 : 1, v: atTop ? 0 : 1 };
  }

  function triggerCornerFireworks(corner, options = {}) {
    const now = performance.now();
    const withinCooldown = (
      !options.force &&
      isFiniteNumber(state.dvdLastCornerFireworkMs) &&
      now - state.dvdLastCornerFireworkMs < CORNER_FIREWORK_COOLDOWN_MS
    );

    if (withinCooldown) {
      return;
    }

    // Burst from the screen corner the logo just hit, spraying back into the screen.
    const viewport = getViewportSize();
    const atLeft = corner.u < 0.5;
    const atTop = corner.v < 0.5;
    triggerFireworks(
      atLeft ? DVD_EDGE_MARGIN : viewport.w - DVD_EDGE_MARGIN,
      atTop ? DVD_EDGE_MARGIN : viewport.h - DVD_EDGE_MARGIN,
      { ...options, direction: { x: atLeft ? 1 : -1, y: atTop ? 1 : -1 } }
    );
    state.dvdLastCornerFireworkMs = now;
    state.dvdCurrentCornerContactKey = getCornerKey(corner);
  }

  function maybeTriggerPlannedCornerFireworks(remaining) {
    const previous = state.lastRemainingPrecise;
    // A +/- minute jump across a hit is not a hit.
    if (!isFiniteNumber(previous) || previous - remaining > MAX_CORNER_HIT_STEP_SECONDS) {
      return;
    }

    state.dvdPath.forEach((segment) => {
      if (previous > segment.endRemaining && remaining <= segment.endRemaining) {
        const isFinale = segment.endRemaining === FINAL_CORNER_HIT_SECONDS;
        triggerCornerFireworks(segment.end, isFinale
          ? {
            force: true,
            particleCount: FINAL_FIREWORK_PARTICLE_COUNT,
            durationMs: FINAL_FIREWORK_DURATION_MS,
            speedMultiplier: 1.42,
            sizeMultiplier: 1.95
          }
          : { force: true });
      }
    });
  }

  function maybeTriggerPerfectCornerFireworks() {
    const contact = getCornerContact(state.dvdPosition);
    if (!contact) {
      state.dvdCurrentCornerContactKey = null;
      return;
    }

    if (state.dvdCurrentCornerContactKey !== getCornerKey(contact)) {
      triggerCornerFireworks(contact);
    }
  }

  function updateDvdPhysics(remaining) {
    state.dvdPosition = toScreenPoint(getDvdUnitPoint(remaining));
    maybeTriggerPlannedCornerFireworks(remaining);
    maybeTriggerPerfectCornerFireworks();
    applyDvdPosition();
    state.lastRemainingPrecise = remaining;
  }

  function stopDvdAnimationLoop() {
    if (state.dvdRafId !== null) {
      window.cancelAnimationFrame(state.dvdRafId);
      state.dvdRafId = null;
    }
  }

  function scheduleDvdFrame() {
    if (state.dvdRafId === null) {
      state.dvdRafId = window.requestAnimationFrame(dvdFrame);
    }
  }

  function clearDvdRunState() {
    state.dvdPath = null;
    state.lastRemainingPrecise = null;
    cancelDvdReturnAnimation();
    state.dvdCurrentCornerContactKey = null;
    state.dvdLastCornerFireworkMs = null;
  }

  function resetDvdRunState() {
    clearDvdRunState();
    state.lastObservedRemainingPrecise = null;
    state.lastMilestoneRemainingPrecise = null;
  }

  function deactivateDvdPhase() {
    state.dvdActive = false;
    stopDvdAnimationLoop();
    document.body.classList.remove('dvd-active');
    clearDvdRunState();
  }

  // Visible while running in the window, and frozen in place while paused inside it.
  function shouldShowDvd(remaining) {
    return isDvdPhaseRange(remaining) && (state.isRunning || state.dvdPath !== null);
  }

  function dvdFrame(now) {
    state.dvdRafId = null;
    if (!state.dvdActive) {
      return;
    }

    const remaining = getRemainingSecondsPrecise();
    if (!shouldShowDvd(remaining)) {
      startDvdReturnAnimation(now);
    } else if (state.dvdReturningActive) {
      // Time was added back into the window mid-return; pick the bounce back up.
      cancelDvdReturnAnimation();
      if (!state.dvdPath) {
        planDvdPath(toUnitPoint(state.dvdPosition), remaining);
        state.lastRemainingPrecise = remaining;
      }
      beginDvdScaleTween(DVD_MIN_SCALE, DVD_SCALE_DOWN_MS, now);
    }

    updateDvdScale(now);

    if (state.dvdReturningActive) {
      if (updateDvdReturnAnimation(now)) {
        deactivateDvdPhase();
        return;
      }
      scheduleDvdFrame();
      return;
    }

    updateDvdPhysics(remaining);

    if (state.isRunning || state.dvdScaleAnimating) {
      scheduleDvdFrame();
    }
  }

  function activateDvdPhase(enteredFromStart) {
    const wasActive = state.dvdActive;
    if (!wasActive) {
      state.dvdActive = true;
      document.body.classList.add('dvd-active');
      updateDvdSize();
      updateDvdBounds();
    }

    if (enteredFromStart || !state.dvdPath) {
      // Lift off from wherever the logo is: the header mark, or mid-flight home.
      const remaining = getRemainingSecondsPrecise();
      if (!wasActive) {
        state.dvdPosition = getHeaderLogoCenter();
        setDvdScaleImmediate(getHeaderLogoScale());
        applyDvdPosition();
      }
      cancelDvdReturnAnimation();
      planDvdPath(toUnitPoint(state.dvdPosition), remaining);
      state.lastRemainingPrecise = remaining;
      state.dvdCurrentCornerContactKey = null;
      beginDvdScaleTween(DVD_MIN_SCALE, DVD_SCALE_DOWN_MS, performance.now());
    } else if (!wasActive) {
      setDvdScaleImmediate(DVD_MIN_SCALE);
    }

    scheduleDvdFrame();
  }

  function updateDvdPhase() {
    const remaining = getRemainingSecondsPrecise();
    const crossedIntoDvd = (
      state.isRunning &&
      state.mode === 'caseWork' &&
      isFiniteNumber(state.lastObservedRemainingPrecise) &&
      state.lastObservedRemainingPrecise > DVD_START_SECONDS &&
      remaining <= DVD_START_SECONDS
    );

    if (shouldShowDvd(remaining)) {
      activateDvdPhase(crossedIntoDvd);
      return;
    }

    if (state.dvdActive) {
      // dvdFrame flies the logo back into the header.
      scheduleDvdFrame();
      return;
    }

    clearDvdRunState();
  }

  function handleViewportChange() {
    resizeFireworksCanvas();

    if (!state.dvdActive) {
      return;
    }

    updateDvdSize();
    updateDvdBounds();

    if (state.dvdReturningActive) {
      state.dvdReturnTo = getHeaderLogoCenter();
    } else if (state.dvdPath) {
      state.dvdPosition = toScreenPoint(getDvdUnitPoint(getRemainingSecondsPrecise()));
      applyDvdPosition();
    }
  }

  function renderDocumentTitle() {
    const isIdle = !state.isRunning && state.remainingSeconds === getModeDuration();
    document.title = isIdle
      ? BASE_TITLE
      : `${formatTime(state.remainingSeconds)} · ${MODES[state.mode].label}`;
  }

  // Keeps the display awake while the timer runs; the browser drops the lock when the tab is hidden.
  function syncWakeLock() {
    if (!navigator.wakeLock) {
      return;
    }

    const shouldHold = state.isRunning && document.visibilityState === 'visible';
    if (!shouldHold) {
      if (state.wakeLock) {
        state.wakeLock.release().catch(() => {});
        state.wakeLock = null;
      }
      return;
    }

    if (state.wakeLock || state.wakeLockRequest || state.wakeLockDenied) {
      return;
    }

    state.wakeLockRequest = navigator.wakeLock.request('screen')
      .then((lock) => {
        state.wakeLockRequest = null;
        state.wakeLock = lock;
        lock.addEventListener('release', () => {
          if (state.wakeLock === lock) {
            state.wakeLock = null;
          }
        });
        syncWakeLock();
      })
      .catch(() => {
        // Retried on the next start or when the tab comes back into view.
        state.wakeLockRequest = null;
        state.wakeLockDenied = true;
      });
  }

  function render() {
    const remainingPrecise = getRemainingSecondsPrecise();
    const duration = getModeDuration();
    const progressRatio = duration > 0 ? state.remainingSeconds / duration : 0;
    const progressPercent = Math.max(0, Math.min(100, progressRatio * 100));

    elements.modeLabel.textContent = MODES[state.mode].label;
    elements.timerDisplay.textContent = formatTime(state.remainingSeconds);
    elements.progressFill.style.width = `${progressPercent}%`;
    elements.startPauseButton.textContent = state.isRunning ? 'Pause' : 'Start';
    elements.startPauseButton.setAttribute('aria-pressed', state.isRunning ? 'true' : 'false');

    document.body.classList.toggle('final-five', isFinalFiveCaseWork());

    elements.modeButtons.forEach((button) => {
      const isActive = button.dataset.mode === state.mode;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    updateFullscreenButtonLabel();
    renderStatus();
    renderDocumentTitle();
    syncWakeLock();
    maybePlayMilestoneChimes(remainingPrecise);
    if (EFFECTS_ENABLED) {
      updateDvdPhase();
      updateDinoScene();
    }
    state.lastObservedRemainingPrecise = remainingPrecise;
    persistState();
  }

  function clearTicking() {
    if (state.intervalId !== null) {
      window.clearInterval(state.intervalId);
      state.intervalId = null;
    }
  }

  function stopTimer() {
    if (state.isRunning && state.endTimeMs > 0) {
      state.pausedRemainingPrecise = Math.max(0, (state.endTimeMs - Date.now()) / 1000);
    }
    syncRemainingFromClock();
    state.isRunning = false;
    clearTicking();
    state.endTimeMs = 0;
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
    state.pausedRemainingPrecise = null;
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
        // Ignore resume failures.
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
      state.pausedRemainingPrecise = null;
      resetDvdRunState();
    }

    const startFromSeconds = getRemainingSecondsPrecise();
    state.isRunning = true;
    state.endTimeMs = Date.now() + startFromSeconds * 1000;
    state.pausedRemainingPrecise = null;
    state.wakeLockDenied = false;
    clearTicking();
    state.intervalId = window.setInterval(tick, 200);
    render();
  }

  function resetTimer() {
    stopTimer();
    state.remainingSeconds = getModeDuration();
    state.pausedRemainingPrecise = null;
    resetDvdRunState();
    render();
  }

  function setMode(nextMode) {
    if (!Object.prototype.hasOwnProperty.call(MODES, nextMode)) {
      return;
    }

    stopTimer();
    state.mode = nextMode;
    state.remainingSeconds = getModeDuration();
    state.pausedRemainingPrecise = null;
    resetDvdRunState();
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
    if (isFiniteNumber(state.pausedRemainingPrecise)) {
      state.pausedRemainingPrecise = Math.max(0, state.pausedRemainingPrecise + deltaSeconds);
    }
    render();
  }

  async function toggleFullscreen() {
    try {
      if (isFullscreen()) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      // Ignore fullscreen API rejections.
    }
    updateFullscreenButtonLabel();
  }

  function handleShortcut(event) {
    if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey || typeof event.key !== 'string') {
      return;
    }

    const shortcuts = {
      ' ': toggleStartPause,
      r: resetTimer,
      f: toggleFullscreen
    };
    const action = shortcuts[event.key.toLowerCase()];
    if (!action) {
      return;
    }

    event.preventDefault();
    // Otherwise Space would also click whichever button still has focus.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    action();
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

    if (elements.fullscreenButton) {
      elements.fullscreenButton.addEventListener('click', toggleFullscreen);
    }

    document.addEventListener('fullscreenchange', () => {
      updateFullscreenButtonLabel();
      handleViewportChange();
    });

    window.addEventListener('resize', handleViewportChange);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        state.wakeLockDenied = false;
      }
      syncWakeLock();
    });

    document.addEventListener('keydown', handleShortcut);
  }

  restoreState();
  bindEvents();
  resizeFireworksCanvas();

  if (state.isRunning && state.remainingSeconds > 0) {
    if (state.endTimeMs <= 0) {
      state.endTimeMs = Date.now() + state.remainingSeconds * 1000;
    }
    clearTicking();
    state.intervalId = window.setInterval(tick, 200);
  }

  render();
})();
