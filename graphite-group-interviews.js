(() => {
  const STORAGE_KEY = 'graphite-group-interview-timer-v1';

  const DINO_START_SECONDS = 5 * 60 + 9.45;
  const DINO_HIT_MS = 9450;
  const DINO_END_MS = 10000;
  const DINO_HIDE_AFTER_START_MS = 15000;

  const DVD_START_SECONDS = 40 * 60;
  const CORNER_HIT_SECONDS = 16 * 60;
  const DVD_END_SECONDS = 15 * 60;
  const STEER_WINDOW_MS = 3000;
  const DVD_BASE_SPEED = 260;
  const DVD_SAFE_MARGIN = 8;
  const DVD_RETURN_DURATION_MS = 1200;
  const DVD_MIN_SCALE = 0.34;
  const DVD_MAX_SCALE = 1;
  const DVD_SCALE_DOWN_MS = 900;

  const FIREWORK_PARTICLE_COUNT = 34;
  const FIREWORK_DURATION_MS = 780;

  const MODES = {
    caseWork: { label: 'Case Work', durationSeconds: 45 * 60 },
    presentation: { label: 'Presentation', durationSeconds: 10 * 60 }
  };

  const state = {
    mode: 'caseWork',
    remainingSeconds: MODES.caseWork.durationSeconds,
    isRunning: false,
    endTimeMs: 0,
    intervalId: null,
    audioContext: null,

    dinoEndTimeoutId: null,
    dinoOverlayTimeoutId: null,
    dinoHideTimeoutId: null,
    dinoSequenceStarted: false,

    dvdActive: false,
    dvdPosition: { x: 0, y: 0 },
    dvdVelocity: { vx: DVD_BASE_SPEED, vy: DVD_BASE_SPEED * 0.72 },
    dvdSize: { w: 180, h: 180 },
    dvdBounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
    dvdRafId: null,
    dvdLastFrameMs: null,
    dvdSteeringActive: false,
    dvdCornerTarget: null,
    dvdCornerHitTriggered: false,
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

    fireworksActive: false,
    fireworksParticles: [],
    fireworksContext: null
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
    return state.remainingSeconds;
  }

  function isFinalFiveCaseWork() {
    const remaining = getRemainingSecondsPrecise();
    return state.isRunning && state.mode === 'caseWork' && remaining > 0 && remaining <= DINO_START_SECONDS;
  }

  function isDvdPhaseRange(remaining) {
    return state.mode === 'caseWork' && remaining <= DVD_START_SECONDS && remaining > DVD_END_SECONDS;
  }

  function isDvdPhaseActive() {
    const remaining = getRemainingSecondsPrecise();
    return state.isRunning && isDvdPhaseRange(remaining);
  }

  function isSteerWindow(remaining) {
    const steerStart = CORNER_HIT_SECONDS + STEER_WINDOW_MS / 1000;
    return !state.dvdCornerHitTriggered && remaining > CORNER_HIT_SECONDS && remaining <= steerStart;
  }

  function isCornerHitMoment(remaining) {
    return (
      !state.dvdCornerHitTriggered &&
      state.lastRemainingPrecise !== null &&
      state.lastRemainingPrecise > CORNER_HIT_SECONDS &&
      remaining <= CORNER_HIT_SECONDS
    );
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
          dvd: {
            active: state.dvdActive,
            position: state.dvdPosition,
            velocity: state.dvdVelocity,
            cornerHitTriggered: state.dvdCornerHitTriggered,
            scale: state.dvdScale
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
      }

      if (saved.dvd && typeof saved.dvd === 'object') {
        const position = saved.dvd.position || {};
        const velocity = saved.dvd.velocity || {};

        if (isFiniteNumber(position.x) && isFiniteNumber(position.y)) {
          state.dvdPosition = { x: position.x, y: position.y };
        }

        if (isFiniteNumber(velocity.vx) && isFiniteNumber(velocity.vy)) {
          state.dvdVelocity = { vx: velocity.vx, vy: velocity.vy };
        }

        state.dvdCornerHitTriggered = Boolean(saved.dvd.cornerHitTriggered);

        if (isFiniteNumber(saved.dvd.scale)) {
          setDvdScaleImmediate(saved.dvd.scale);
        } else {
          setDvdScaleImmediate(DVD_MIN_SCALE);
        }
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

  function updateDvdSize() {
    if (!elements.dvdLogoFloating) {
      return;
    }

    const rect = elements.dvdLogoFloating.getBoundingClientRect();
    const width = rect.width || Math.min(window.innerWidth * 0.56, 220);
    const height = rect.height || width;
    state.dvdSize = { w: width, h: height };
  }

  function updateDvdBounds() {
    const margin = Math.max(DVD_SAFE_MARGIN, window.innerWidth * 0.008);
    const minX = margin + state.dvdSize.w / 2;
    const maxX = window.innerWidth - margin - state.dvdSize.w / 2;
    const minY = margin + state.dvdSize.h / 2;
    const maxY = window.innerHeight - margin - state.dvdSize.h / 2;

    state.dvdBounds = {
      minX,
      maxX: Math.max(minX, maxX),
      minY,
      maxY: Math.max(minY, maxY)
    };
  }

  function clampDvdPosition() {
    state.dvdPosition.x = Math.max(state.dvdBounds.minX, Math.min(state.dvdBounds.maxX, state.dvdPosition.x));
    state.dvdPosition.y = Math.max(state.dvdBounds.minY, Math.min(state.dvdBounds.maxY, state.dvdPosition.y));
  }

  function applyDvdPosition() {
    if (!elements.dvdLogoFloating) {
      return;
    }

    elements.dvdLogoFloating.style.left = `${state.dvdPosition.x}px`;
    elements.dvdLogoFloating.style.top = `${state.dvdPosition.y}px`;
    elements.dvdLogoFloating.style.transform = `translate(-50%, -50%) scale(${state.dvdScale})`;
  }

  function getHeaderLogoCenter() {
    if (elements.brandLogo) {
      const rect = elements.brandLogo.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
    }

    return { x: window.innerWidth / 2, y: Math.max(120, window.innerHeight * 0.16) };
  }

  function getCornerPoints() {
    return [
      { x: state.dvdBounds.minX, y: state.dvdBounds.minY },
      { x: state.dvdBounds.maxX, y: state.dvdBounds.minY },
      { x: state.dvdBounds.minX, y: state.dvdBounds.maxY },
      { x: state.dvdBounds.maxX, y: state.dvdBounds.maxY }
    ];
  }

  function chooseNearestCorner(position) {
    const corners = getCornerPoints();
    let winner = corners[0];
    let bestDistance = Number.POSITIVE_INFINITY;

    corners.forEach((corner) => {
      const dx = corner.x - position.x;
      const dy = corner.y - position.y;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        winner = corner;
      }
    });

    return winner;
  }

  function easeInOutCubic(t) {
    if (t < 0.5) {
      return 4 * t * t * t;
    }
    return 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
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
    if (!state.dvdActive) {
      return;
    }

    state.dvdReturningActive = true;
    state.dvdReturnStartMs = now;
    state.dvdReturnFrom = { x: state.dvdPosition.x, y: state.dvdPosition.y };
    state.dvdReturnTo = getHeaderLogoCenter();
    state.dvdSteeringActive = false;
    state.dvdCornerTarget = null;
    beginDvdScaleTween(DVD_MAX_SCALE, DVD_RETURN_DURATION_MS, now);
  }

  function updateDvdReturnAnimation(now) {
    if (!state.dvdReturningActive || !state.dvdReturnFrom || !state.dvdReturnTo || !isFiniteNumber(state.dvdReturnStartMs)) {
      return true;
    }

    const elapsed = now - state.dvdReturnStartMs;
    const t = Math.max(0, Math.min(1, elapsed / DVD_RETURN_DURATION_MS));
    const eased = easeOutBack(t);

    state.dvdPosition.x = state.dvdReturnFrom.x + (state.dvdReturnTo.x - state.dvdReturnFrom.x) * eased;
    state.dvdPosition.y = state.dvdReturnFrom.y + (state.dvdReturnTo.y - state.dvdReturnFrom.y) * eased;
    applyDvdPosition();

    if (t >= 1) {
      state.dvdReturningActive = false;
      state.dvdReturnStartMs = null;
      state.dvdReturnFrom = null;
      state.dvdReturnTo = null;
      return true;
    }

    return false;
  }

  function clearFireworks() {
    state.fireworksParticles = [];
    state.fireworksActive = false;
    document.body.classList.remove('fireworks-active');

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

  function triggerFireworks(x, y) {
    if (!elements.fireworksLayer) {
      return;
    }

    resizeFireworksCanvas();
    state.fireworksParticles = [];

    for (let i = 0; i < FIREWORK_PARTICLE_COUNT; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 95 + Math.random() * 220;
      state.fireworksParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ageMs: 0,
        durationMs: FIREWORK_DURATION_MS * (0.82 + Math.random() * 0.38),
        size: 1.2 + Math.random() * 2.1
      });
    }

    state.fireworksActive = true;
    document.body.classList.add('fireworks-active');
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

  function normalizeVelocity() {
    const speed = Math.hypot(state.dvdVelocity.vx, state.dvdVelocity.vy);
    if (speed < 90) {
      state.dvdVelocity.vx = state.dvdVelocity.vx >= 0 ? DVD_BASE_SPEED : -DVD_BASE_SPEED;
      state.dvdVelocity.vy = state.dvdVelocity.vy >= 0 ? DVD_BASE_SPEED * 0.72 : -DVD_BASE_SPEED * 0.72;
      return;
    }

    const maxSpeed = 580;
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      state.dvdVelocity.vx *= scale;
      state.dvdVelocity.vy *= scale;
    }
  }

  function applySteeringIfNeeded(remaining, deltaSec) {
    if (!isSteerWindow(remaining)) {
      state.dvdSteeringActive = false;
      state.dvdCornerTarget = null;
      return;
    }

    if (!state.dvdCornerTarget) {
      state.dvdCornerTarget = chooseNearestCorner(state.dvdPosition);
    }

    state.dvdSteeringActive = true;

    const timeToHit = Math.max(0.06, remaining - CORNER_HIT_SECONDS);
    const desiredVx = (state.dvdCornerTarget.x - state.dvdPosition.x) / timeToHit;
    const desiredVy = (state.dvdCornerTarget.y - state.dvdPosition.y) / timeToHit;
    const blend = Math.min(1, deltaSec * 4.8);

    state.dvdVelocity.vx += (desiredVx - state.dvdVelocity.vx) * blend;
    state.dvdVelocity.vy += (desiredVy - state.dvdVelocity.vy) * blend;
  }

  function setVelocityAfterCornerHit(corner) {
    const speed = Math.max(Math.hypot(state.dvdVelocity.vx, state.dvdVelocity.vy), DVD_BASE_SPEED);
    const horizontal = corner.x <= state.dvdBounds.minX + 1 ? 1 : -1;
    const vertical = corner.y <= state.dvdBounds.minY + 1 ? 1 : -1;

    state.dvdVelocity.vx = horizontal * speed * 0.78;
    state.dvdVelocity.vy = vertical * speed * 0.64;
  }

  function maybeTriggerCornerHit(remaining) {
    if (!isCornerHitMoment(remaining)) {
      return;
    }

    const corner = state.dvdCornerTarget || chooseNearestCorner(state.dvdPosition);
    const dx = corner.x - state.dvdPosition.x;
    const dy = corner.y - state.dvdPosition.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 14) {
      state.dvdPosition = { x: corner.x, y: corner.y };
    }

    state.dvdSteeringActive = false;
    state.dvdCornerTarget = null;
    state.dvdCornerHitTriggered = true;

    setVelocityAfterCornerHit(corner);
    triggerFireworks(corner.x, corner.y);
  }

  function updateDvdPhysics(remaining, deltaSec) {
    applySteeringIfNeeded(remaining, deltaSec);
    maybeTriggerCornerHit(remaining);

    normalizeVelocity();

    state.dvdPosition.x += state.dvdVelocity.vx * deltaSec;
    state.dvdPosition.y += state.dvdVelocity.vy * deltaSec;

    if (state.dvdPosition.x <= state.dvdBounds.minX) {
      state.dvdPosition.x = state.dvdBounds.minX;
      state.dvdVelocity.vx = Math.abs(state.dvdVelocity.vx);
    } else if (state.dvdPosition.x >= state.dvdBounds.maxX) {
      state.dvdPosition.x = state.dvdBounds.maxX;
      state.dvdVelocity.vx = -Math.abs(state.dvdVelocity.vx);
    }

    if (state.dvdPosition.y <= state.dvdBounds.minY) {
      state.dvdPosition.y = state.dvdBounds.minY;
      state.dvdVelocity.vy = Math.abs(state.dvdVelocity.vy);
    } else if (state.dvdPosition.y >= state.dvdBounds.maxY) {
      state.dvdPosition.y = state.dvdBounds.maxY;
      state.dvdVelocity.vy = -Math.abs(state.dvdVelocity.vy);
    }

    applyDvdPosition();
    state.lastRemainingPrecise = remaining;
  }

  function stopDvdAnimationLoop() {
    if (state.dvdRafId !== null) {
      window.cancelAnimationFrame(state.dvdRafId);
      state.dvdRafId = null;
    }
    state.dvdLastFrameMs = null;
  }

  function resetDvdRunState() {
    state.dvdSteeringActive = false;
    state.dvdCornerTarget = null;
    state.dvdCornerHitTriggered = false;
    state.lastRemainingPrecise = null;
    state.dvdReturningActive = false;
    state.dvdReturnStartMs = null;
    state.dvdReturnFrom = null;
    state.dvdReturnTo = null;
    state.lastObservedRemainingPrecise = null;
    setDvdScaleImmediate(DVD_MAX_SCALE);
  }

  function deactivateDvdPhase(preserveProgress) {
    state.dvdActive = false;
    stopDvdAnimationLoop();
    document.body.classList.remove('dvd-active');
    clearFireworks();

    if (!preserveProgress) {
      resetDvdRunState();
    }
  }

  function ensureDvdReady() {
    if (!elements.dvdLogoFloating) {
      return;
    }

    updateDvdSize();
    updateDvdBounds();

    if (!isFiniteNumber(state.dvdPosition.x) || !isFiniteNumber(state.dvdPosition.y) || state.dvdPosition.x === 0 || state.dvdPosition.y === 0) {
      state.dvdPosition = getHeaderLogoCenter();
    }

    if (!isFiniteNumber(state.dvdVelocity.vx) || !isFiniteNumber(state.dvdVelocity.vy)) {
      state.dvdVelocity = { vx: DVD_BASE_SPEED, vy: DVD_BASE_SPEED * 0.72 };
    }

    clampDvdPosition();
    applyDvdPosition();
  }

  function dvdFrame(now) {
    if (!state.dvdActive) {
      return;
    }

    const remaining = getRemainingSecondsPrecise();
    if (state.dvdReturningActive) {
      if (state.isRunning && isDvdPhaseRange(remaining)) {
        state.dvdReturningActive = false;
        state.dvdReturnStartMs = null;
        state.dvdReturnFrom = null;
        state.dvdReturnTo = null;
        setDvdScaleImmediate(DVD_MIN_SCALE);
        state.dvdLastFrameMs = now;
      } else {
        updateDvdScale(now);
        const finished = updateDvdReturnAnimation(now);
        if (finished) {
          deactivateDvdPhase(false);
          return;
        }
        state.dvdRafId = window.requestAnimationFrame(dvdFrame);
        return;
      }
    }

    const shouldReturnToCenter = state.isRunning && state.mode === 'caseWork' && remaining <= DVD_END_SECONDS && remaining > 0;
    if (shouldReturnToCenter) {
      startDvdReturnAnimation(now);
      state.dvdRafId = window.requestAnimationFrame(dvdFrame);
      return;
    }

    if (!state.isRunning || state.mode !== 'caseWork' || !isDvdPhaseRange(remaining)) {
      const preserveProgress = !state.isRunning && isDvdPhaseRange(remaining) && state.mode === 'caseWork';
      deactivateDvdPhase(preserveProgress);
      return;
    }

    if (state.dvdLastFrameMs === null) {
      state.dvdLastFrameMs = now;
    }

    const deltaSec = Math.min(0.05, Math.max(0, (now - state.dvdLastFrameMs) / 1000));
    state.dvdLastFrameMs = now;

    updateDvdScale(now);
    updateDvdPhysics(remaining, deltaSec);
    updateFireworks(deltaSec);

    state.dvdRafId = window.requestAnimationFrame(dvdFrame);
  }

  function activateDvdPhase(enteredFromStart) {
    if (state.dvdActive) {
      document.body.classList.add('dvd-active');
      return;
    }

    state.dvdActive = true;
    document.body.classList.add('dvd-active');

    ensureDvdReady();

    if (state.lastRemainingPrecise === null) {
      state.lastRemainingPrecise = getRemainingSecondsPrecise();
    }

    if (enteredFromStart) {
      setDvdScaleImmediate(DVD_MAX_SCALE);
      beginDvdScaleTween(DVD_MIN_SCALE, DVD_SCALE_DOWN_MS, performance.now());
    } else if (!state.dvdReturningActive && !state.dvdScaleAnimating) {
      setDvdScaleImmediate(DVD_MIN_SCALE);
    }

    applyDvdPosition();

    stopDvdAnimationLoop();
    state.dvdRafId = window.requestAnimationFrame(dvdFrame);
  }

  function updateDvdPhase() {
    const remaining = getRemainingSecondsPrecise();
    const withinRange = isDvdPhaseRange(remaining);
    const crossedIntoDvd = (
      state.isRunning &&
      state.mode === 'caseWork' &&
      isFiniteNumber(state.lastObservedRemainingPrecise) &&
      state.lastObservedRemainingPrecise > DVD_START_SECONDS &&
      remaining <= DVD_START_SECONDS
    );

    if (state.isRunning && withinRange) {
      activateDvdPhase(crossedIntoDvd);
      return;
    }

    const shouldReturnToCenter = state.dvdActive && state.mode === 'caseWork' && state.isRunning && remaining <= DVD_END_SECONDS && remaining > 0;
    if (shouldReturnToCenter || state.dvdReturningActive) {
      if (state.dvdRafId === null) {
        state.dvdRafId = window.requestAnimationFrame(dvdFrame);
      }
      return;
    }

    const preserveProgress = !state.isRunning && withinRange;
    deactivateDvdPhase(preserveProgress);
  }

  function handleViewportChange() {
    resizeFireworksCanvas();

    if (!state.dvdActive) {
      return;
    }

    updateDvdSize();
    updateDvdBounds();
    clampDvdPosition();
    applyDvdPosition();
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
    updateDvdPhase();
    updateDinoScene();
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
      resetDvdRunState();
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
  }

  restoreState();
  bindEvents();
  resizeFireworksCanvas();

  if (state.isRunning && state.remainingSeconds > 0) {
    state.endTimeMs = Date.now() + state.remainingSeconds * 1000;
    clearTicking();
    state.intervalId = window.setInterval(tick, 200);
  }

  render();
})();
