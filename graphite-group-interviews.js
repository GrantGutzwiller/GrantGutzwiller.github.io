(() => {
  const STORAGE_KEY = 'graphite-group-interview-timer-v1';
  const FIREWORK_SOUND_STORAGE_KEY = 'graphite-group-interview-firework-sound-v1';

  const FINAL_FIVE_SECONDS = 5 * 60;
  // The dino run starts with the 5:10 chime and hits a cactus exactly at 5:00. Every frame
  // is drawn from the time left on the clock, so pausing and reloading keep it in sync.
  const DINO_RUN_START_SECONDS = 5 * 60 + 10;
  const DINO_RUN_SECONDS = DINO_RUN_START_SECONDS - FINAL_FIVE_SECONDS;
  const DINO_SCENE_SECONDS = 16;
  const DINO_SCENE_OPEN_LEAD_SECONDS = 0.35;
  const DINO_INTRO_SECONDS = 0.45;
  const DINO_STEP_SECONDS = 0.1;
  const DINO_SCENE_HEIGHT = 150;
  const DINO_X = 39;
  const DINO_GROUND_Y = 95;
  // An obstacle "arrives" when its left edge reaches the dino's snout.
  const DINO_CONTACT_X = 37;
  const DINO_HORIZON_Y = 131;
  const DINO_GROUND_LENGTH = 1200;
  const DINO_JUMP = { height: 70, seconds: 0.55 };
  // px/s; Chrome's game starts at 6px a frame.
  const DINO_SPEED = { start: 360, rampSeconds: 0.6, accel: 12 };
  // Rects in assets/graphite-dino-sprites.png, cut from a recording of Chrome's game; top is
  // where each sprite sits in the scene.
  const DINO_SPRITES = {
    trexRunA: { x: 0, y: 0, w: 40, h: 43 },
    trexRunB: { x: 42, y: 0, w: 40, h: 43 },
    trexJump: { x: 84, y: 0, w: 40, h: 43 },
    trexCrash: { x: 126, y: 0, w: 40, h: 43 },
    cactusLargeA: { x: 168, y: 0, w: 23, h: 46, top: 91 },
    cactusLargeB: { x: 193, y: 0, w: 23, h: 46, top: 91 },
    cactusSmallA: { x: 218, y: 0, w: 15, h: 33, top: 106 },
    cactusSmallB: { x: 235, y: 0, w: 15, h: 33, top: 106 },
    cloud: { x: 252, y: 0, w: 46, h: 13 },
    restart: { x: 300, y: 0, w: 34, h: 30 }
  };
  const DINO_OBSTACLES = [
    { at: 2.3, parts: ['cactusSmallA'] },
    { at: 4.0, parts: ['cactusLargeB'] },
    { at: 5.6, parts: ['cactusSmallA', 'cactusSmallB'] },
    { at: 7.1, parts: ['cactusLargeA'] },
    { at: 8.5, parts: ['cactusSmallB', 'cactusSmallA', 'cactusSmallB'] },
    // The one it doesn't jump.
    { at: DINO_RUN_SECONDS, parts: ['cactusLargeA', 'cactusLargeB'] }
  ];
  const DINO_CLOUDS = [
    { x: 130, y: 38 },
    { x: 330, y: 28 },
    { x: 560, y: 52 },
    { x: 790, y: 30 },
    { x: 1010, y: 46 }
  ];
  const DINO_CLOUD_SPAN = 1150;
  const DINO_CLOUD_PARALLAX = 0.2;
  const DINO_MESSAGE = '5 MINUTES LEFT';
  const DINO_EDGE_FADE = 28;
  const PIXEL_FONT = {
    '0': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
    '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
    '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.']
  };
  const MILESTONE_SECONDS = [15 * 60, 5 * 60 + 10, 60];

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
  // Two rigged near misses before the real hit: the logo bounces off one wall with the
  // neighbouring wall still DVD_NEAR_MISS_GAP_PX away, then off that wall a moment later.
  const DVD_NEAR_MISS_GAP_PX = 16;
  const DVD_WAYPOINTS = [
    { remainingSeconds: 28 * 60, nearMiss: true, speedX: DVD_PRE_HIT_VX, speedY: DVD_PRE_HIT_VY },
    { remainingSeconds: 21 * 60, nearMiss: true, speedX: DVD_PRE_HIT_VX, speedY: DVD_PRE_HIT_VY },
    { remainingSeconds: CORNER_HIT_SECONDS, speedX: DVD_PRE_HIT_VX, speedY: DVD_PRE_HIT_VY },
    { remainingSeconds: FINAL_CORNER_HIT_SECONDS, speedX: DVD_POST_HIT_VX, speedY: DVD_POST_HIT_VY }
  ];
  // Starts white to match the header mark, then cycles on every wall hit.
  const DVD_START_COLOR = '#ffffff';
  const DVD_COLORS = ['#7aa2ff', '#ff7ab6', '#ffd166', '#6ee7b7', '#c4a1ff', '#ff9f68'];
  const DVD_LOGO_ASPECT = 202 / 176;
  // graphite-logo-tight.png is graphite-logo-black-256.png cropped to the mark.
  const HEADER_LOGO_CROP = { widthRatio: 176 / 256, centerYRatio: 131 / 256 };
  const PERFECT_CORNER_TOLERANCE_PX = 0.8;
  const CORNER_FIREWORK_COOLDOWN_MS = 180;
  const MAX_CORNER_HIT_STEP_SECONDS = 1;

  const SPARK_RGB = '245, 245, 245';
  const FIREWORK_PARTICLE_COUNT = 34;
  const FIREWORK_DURATION_MS = 780;
  const FINAL_FIREWORK_PARTICLE_COUNT = 90;
  const FINAL_FIREWORK_DURATION_MS = 3200;
  const SHOCKWAVE_DURATION_MS = 750;
  const SHOW_ROCKET_GRAVITY = 520;
  // ms after the logo docks at 0:00; the last three go up together as the finale.
  const SHOW_ROCKET_LAUNCH_MS = [0, 330, 720, 1100, 1480, 1900, 2300, 2750, 3350, 3350, 3350];
  const SHOW_FINALE_ROCKETS = 3;

  const DURATION_SECONDS = 45 * 60;

  const state = {
    remainingSeconds: DURATION_SECONDS,
    isRunning: false,
    endTimeMs: 0,
    pausedRemainingPrecise: null,
    intervalId: null,
    audioContext: null,
    fireworkOutput: null,
    noiseBuffer: null,
    fireworkSounds: false,
    wakeLock: null,
    wakeLockRequest: null,
    wakeLockDenied: false,

    dinoSceneOpen: false,
    dinoRafId: null,
    dinoContext: null,
    dinoCanvasWidth: 0,
    dinoGround: null,

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
    dvdColor: null,
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
    fireworksLastFrameMs: null,
    fireworksClockMs: 0,
    fireworksQueue: [],
    celebrateOnLanding: false
  };

  const elements = {
    timerDisplay: document.getElementById('timerDisplay'),
    timerStatus: document.getElementById('timerStatus'),
    progressFill: document.getElementById('progressFill'),
    startPauseButton: document.getElementById('startPauseButton'),
    resetButton: document.getElementById('resetButton'),
    minusMinuteButton: document.getElementById('minusMinuteButton'),
    plusMinuteButton: document.getElementById('plusMinuteButton'),
    fullscreenButton: document.getElementById('fullscreenButton'),
    soundToggle: document.getElementById('soundToggle'),

    brandLogo: document.querySelector('.brand-logo'),
    dvdLogoLayer: document.getElementById('dvdLogoLayer'),
    dvdLogoFloating: document.getElementById('dvdLogoFloating'),
    fireworksLayer: document.getElementById('fireworksLayer'),

    dinoScene: document.getElementById('dinoScene'),
    dinoCanvas: document.getElementById('dinoCanvas'),
    dinoSprites: document.getElementById('dinoSprites')
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

  function isFinalFive() {
    const remaining = getRemainingSecondsPrecise();
    return state.isRunning && remaining > 0 && remaining <= FINAL_FIVE_SECONDS;
  }

  function isDvdPhaseRange(remaining) {
    return remaining <= DVD_START_SECONDS && remaining > DVD_END_SECONDS;
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
      // Saves from the removed 10-minute Presentation mode don't carry over.
      if (!saved || (saved.mode !== undefined && saved.mode !== 'caseWork')) {
        return;
      }

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
        state.remainingSeconds = DURATION_SECONDS;
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
    if (isFinalFive()) {
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

    if (state.remainingSeconds === DURATION_SECONDS) {
      elements.timerStatus.textContent = 'Ready to start.';
      return;
    }

    elements.timerStatus.textContent = 'Paused.';
  }

  // Firework sounds go through their own gain node, so turning them off also silences any
  // already playing. The chimes and end beeps always play.
  function getFireworkOutput() {
    const context = state.audioContext;
    if (!state.fireworkOutput) {
      state.fireworkOutput = context.createGain();
      state.fireworkOutput.connect(context.destination);
    }
    state.fireworkOutput.gain.value = state.fireworkSounds ? 1 : 0;
    return state.fireworkOutput;
  }

  function playSound(schedule, { firework = false } = {}) {
    const context = state.audioContext;
    if (!context || (firework && !state.fireworkSounds)) {
      return;
    }

    const play = () => schedule(context, firework ? getFireworkOutput() : context.destination);
    if (context.state === 'suspended') {
      context.resume().then(play).catch(() => {});
      return;
    }

    play();
  }

  function getNoiseBuffer(context) {
    if (!state.noiseBuffer) {
      const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      state.noiseBuffer = buffer;
    }
    return state.noiseBuffer;
  }

  function playNoise(context, output, { at, duration, peak, filterType, frequency, frequencyEnd, q = 0.8 }) {
    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    noise.buffer = getNoiseBuffer(context);
    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(frequency, at);
    if (frequencyEnd) {
      filter.frequency.exponentialRampToValueAtTime(frequencyEnd, at + duration);
    }
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + Math.min(0.006, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    noise.start(at, Math.random() * 0.8, duration + 0.02);
  }

  // A soft firework pop: a puff of filtered noise over a low thump, optionally trailed by crackle.
  function playPop({ strength = 0.7, pitch = 1, crackle = false } = {}) {
    playSound((context, output) => {
      const now = context.currentTime + 0.01;
      playNoise(context, output, {
        at: now,
        duration: 0.22,
        peak: 0.3 * strength,
        filterType: 'bandpass',
        frequency: 1400 * pitch,
        frequencyEnd: 380 * pitch
      });

      const thump = context.createOscillator();
      const thumpGain = context.createGain();
      thump.type = 'sine';
      thump.frequency.setValueAtTime(160 * pitch, now);
      thump.frequency.exponentialRampToValueAtTime(55 * pitch, now + 0.12);
      thumpGain.gain.setValueAtTime(0.0001, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.26 * strength, now + 0.008);
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      thump.connect(thumpGain);
      thumpGain.connect(output);
      thump.start(now);
      thump.stop(now + 0.18);

      if (crackle) {
        for (let i = 0; i < 9; i += 1) {
          playNoise(context, output, {
            at: now + 0.12 + Math.random() * 0.55,
            duration: 0.03,
            peak: 0.06 * strength * (0.4 + Math.random() * 0.6),
            filterType: 'highpass',
            frequency: 2500 + Math.random() * 2500
          });
        }
      }
    }, { firework: true });
  }

  function playMilestoneChime(frequencies) {
    if (!Array.isArray(frequencies) || frequencies.length === 0) {
      return;
    }

    playSound((context, output) => {
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
        baseGain.connect(output);
        sparkleGain.connect(output);

        baseOsc.start(toneStart);
        sparkleOsc.start(toneStart);
        baseOsc.stop(toneEnd);
        sparkleOsc.stop(toneEnd);
      });
    });
  }

  function maybePlayMilestoneChimes(remainingPrecise) {
    const previous = state.lastMilestoneRemainingPrecise;
    if (!state.isRunning || !isFiniteNumber(previous)) {
      state.lastMilestoneRemainingPrecise = remainingPrecise;
      return;
    }

    MILESTONE_SECONDS.forEach((threshold) => {
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

  function getDinoSpeed(t) {
    const { start, rampSeconds, accel } = DINO_SPEED;
    if (t <= 0) {
      return 0;
    }
    if (t <= rampSeconds) {
      return (start * t) / rampSeconds;
    }
    return start + accel * (t - rampSeconds);
  }

  function getDinoDistance(t) {
    const { start, rampSeconds, accel } = DINO_SPEED;
    if (t <= 0) {
      return 0;
    }
    if (t <= rampSeconds) {
      return (start * t * t) / (2 * rampSeconds);
    }
    const cruise = t - rampSeconds;
    return (start * rampSeconds) / 2 + start * cruise + (accel * cruise * cruise) / 2;
  }

  function getObstacleWidth(obstacle) {
    return obstacle.parts.reduce((width, part) => width + DINO_SPRITES[part].w, 0) + obstacle.parts.length - 1;
  }

  // One intro hop at the start, then a jump over every obstacle but the last, timed so the top
  // of the arc lines up with the middle of the obstacle passing underneath.
  function getDinoJumpHeight(t) {
    const starts = [0];
    DINO_OBSTACLES.forEach((obstacle) => {
      if (obstacle.at < DINO_RUN_SECONDS) {
        const passSeconds = (getObstacleWidth(obstacle) + DINO_CONTACT_X) / getDinoSpeed(obstacle.at);
        starts.push(obstacle.at + passSeconds / 2 - DINO_JUMP.seconds / 2);
      }
    });

    const start = starts.find((jumpStart) => t >= jumpStart && t < jumpStart + DINO_JUMP.seconds);
    if (start === undefined) {
      return 0;
    }
    const progress = (t - start) / DINO_JUMP.seconds;
    return 4 * DINO_JUMP.height * progress * (1 - progress);
  }

  function buildDinoGround() {
    const strip = document.createElement('canvas');
    strip.width = DINO_GROUND_LENGTH;
    strip.height = 10;
    const ctx = strip.getContext('2d');
    ctx.fillStyle = '#ffffff';

    // A fixed seed keeps the same ground under every run.
    let seed = 0x5eed;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    // The horizon sits on row 2, with the odd bump and dip like Chrome's.
    let x = 0;
    while (x < DINO_GROUND_LENGTH) {
      const roll = random();
      if (roll < 0.035 && x < DINO_GROUND_LENGTH - 8) {
        ctx.fillRect(x, 2, 1, 1);
        ctx.fillRect(x + 1, 1, 1, 1);
        ctx.fillRect(x + 2, 0, 3, 1);
        ctx.fillRect(x + 5, 1, 1, 1);
        ctx.fillRect(x + 6, 2, 1, 1);
        x += 7;
      } else if (roll < 0.06 && x < DINO_GROUND_LENGTH - 7) {
        ctx.fillRect(x, 2, 1, 1);
        ctx.fillRect(x + 1, 3, 4, 1);
        ctx.fillRect(x + 5, 2, 1, 1);
        x += 6;
      } else {
        ctx.fillRect(x, 2, 1, 1);
        x += 1;
      }
    }

    for (let i = 0; i < DINO_GROUND_LENGTH / 9; i += 1) {
      const length = 1 + Math.floor(random() * 3);
      ctx.fillRect(Math.floor(random() * (DINO_GROUND_LENGTH - length)), 4 + Math.floor(random() * 5), length, 1);
    }

    return strip;
  }

  function sizeDinoCanvas() {
    const canvas = elements.dinoCanvas;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(canvas.clientWidth));

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(DINO_SCENE_HEIGHT * dpr);
    state.dinoCanvasWidth = width;
    state.dinoContext = canvas.getContext('2d');
    state.dinoContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.dinoContext.imageSmoothingEnabled = false;
  }

  function drawDinoSprite(ctx, name, x, y) {
    const sprite = DINO_SPRITES[name];
    ctx.drawImage(elements.dinoSprites, sprite.x, sprite.y, sprite.w, sprite.h, Math.round(x), Math.round(y), sprite.w, sprite.h);
  }

  function getPixelTextWidth(text, scale, gap) {
    return text.length * 5 * scale + (text.length - 1) * gap;
  }

  function drawPixelText(ctx, text, x, y, scale, gap) {
    let cursor = Math.round(x);
    for (const char of text) {
      const glyph = PIXEL_FONT[char];
      if (glyph) {
        glyph.forEach((row, glyphY) => {
          for (let glyphX = 0; glyphX < row.length; glyphX += 1) {
            if (row[glyphX] === '#') {
              ctx.fillRect(cursor + glyphX * scale, y + glyphY * scale, scale, scale);
            }
          }
        });
      }
      cursor += 5 * scale + gap;
    }
  }

  function drawDinoScene(sceneSeconds) {
    const ctx = state.dinoContext;
    const sprites = elements.dinoSprites;
    if (!ctx || !sprites || !sprites.complete || sprites.naturalWidth === 0) {
      return;
    }

    if (!state.dinoGround) {
      state.dinoGround = buildDinoGround();
    }

    const width = state.dinoCanvasWidth;
    const t = Math.max(0, Math.min(sceneSeconds, DINO_RUN_SECONDS));
    const crashed = sceneSeconds >= DINO_RUN_SECONDS;
    const distance = getDinoDistance(t);

    const score = String(Math.floor(distance * 0.025)).padStart(5, '0');
    // After the crash Chrome shows the high score too, dimmer than the current one.
    const highScore = crashed ? `HI ${score} ` : '';
    const scoreWidth = getPixelTextWidth(highScore + score, 2, 2);
    const scoreX = width - 10 - scoreWidth;
    const messageWidth = getPixelTextWidth(DINO_MESSAGE, 2, 6);
    const messageX = (width - messageWidth) / 2;
    const restartX = (width - DINO_SPRITES.restart.w) / 2;
    const textZones = [
      [scoreX, 8, scoreWidth, 14],
      [messageX, 34, messageWidth, 14],
      [restartX, 64, DINO_SPRITES.restart.w, DINO_SPRITES.restart.h]
    ];

    ctx.clearRect(0, 0, width, DINO_SCENE_HEIGHT);
    ctx.save();

    // Like Chrome's intro, the world opens out from the dino as it takes its first hop.
    const reveal = Math.min(1, t / DINO_INTRO_SECONDS);
    if (reveal < 1) {
      const revealStart = DINO_X + DINO_SPRITES.trexJump.w;
      ctx.beginPath();
      ctx.rect(0, 0, revealStart + (width - revealStart) * easeInOutCubic(reveal), DINO_SCENE_HEIGHT);
      ctx.clip();
    }

    // Clouds fly below the score. Once the world freezes, any cloud under the message or the
    // restart icon is left out so they read cleanly.
    ctx.globalAlpha = 0.28;
    DINO_CLOUDS.forEach((cloud) => {
      const x = (((cloud.x - distance * DINO_CLOUD_PARALLAX) % DINO_CLOUD_SPAN) + DINO_CLOUD_SPAN) % DINO_CLOUD_SPAN - DINO_SPRITES.cloud.w;
      const blocksText = crashed && textZones.some(([zoneX, zoneY, zoneW, zoneH]) => (
        x < zoneX + zoneW + 6 && x + DINO_SPRITES.cloud.w > zoneX - 6 &&
        cloud.y < zoneY + zoneH + 6 && cloud.y + DINO_SPRITES.cloud.h > zoneY - 6
      ));
      if (x < width && !blocksText) {
        drawDinoSprite(ctx, 'cloud', x, cloud.y);
      }
    });

    ctx.globalAlpha = 0.7;
    const groundOffset = distance % DINO_GROUND_LENGTH;
    for (let x = -groundOffset; x < width; x += DINO_GROUND_LENGTH) {
      ctx.drawImage(state.dinoGround, Math.round(x), DINO_HORIZON_Y - 2);
    }

    ctx.globalAlpha = 0.92;
    DINO_OBSTACLES.forEach((obstacle) => {
      let x = DINO_X + DINO_CONTACT_X + getDinoDistance(obstacle.at) - distance;
      if (x > width || x + getObstacleWidth(obstacle) < 0) {
        return;
      }
      obstacle.parts.forEach((part) => {
        drawDinoSprite(ctx, part, x, DINO_SPRITES[part].top);
        x += DINO_SPRITES[part].w + 1;
      });
    });

    const jumpHeight = getDinoJumpHeight(t);
    let trex = Math.floor(t / DINO_STEP_SECONDS) % 2 === 0 ? 'trexRunA' : 'trexRunB';
    if (crashed) {
      trex = 'trexCrash';
    } else if (sceneSeconds <= 0 || jumpHeight > 0) {
      trex = 'trexJump';
    }
    drawDinoSprite(ctx, trex, DINO_X, DINO_GROUND_Y - jumpHeight);

    // The scene has no frame, so the world fades out at its edges instead of being cut off.
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-out';
    [[0, DINO_EDGE_FADE], [width, width - DINO_EDGE_FADE]].forEach(([edge, inner]) => {
      const fade = ctx.createLinearGradient(edge, 0, inner, 0);
      fade.addColorStop(0, 'rgba(0, 0, 0, 1)');
      fade.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = fade;
      ctx.fillRect(Math.min(edge, inner), 0, DINO_EDGE_FADE, DINO_SCENE_HEIGHT);
    });
    ctx.restore();

    if (reveal < 1) {
      return;
    }

    ctx.fillStyle = 'rgba(242, 242, 242, 0.5)';
    drawPixelText(ctx, highScore, scoreX, 8, 2, 2);
    ctx.fillStyle = 'rgba(242, 242, 242, 0.92)';
    drawPixelText(ctx, score, scoreX + highScore.length * 12, 8, 2, 2);

    if (crashed) {
      // Where Chrome says GAME OVER.
      drawPixelText(ctx, DINO_MESSAGE, messageX, 34, 2, 6);
      ctx.globalAlpha = 0.92;
      drawDinoSprite(ctx, 'restart', restartX, 64);
      ctx.globalAlpha = 1;
    }
  }

  function stopDinoLoop() {
    if (state.dinoRafId !== null) {
      window.cancelAnimationFrame(state.dinoRafId);
      state.dinoRafId = null;
    }
  }

  function scheduleDinoFrame() {
    if (state.dinoRafId === null) {
      state.dinoRafId = window.requestAnimationFrame(() => {
        state.dinoRafId = null;
        updateDinoScene();
      });
    }
  }

  function getDinoSceneSeconds() {
    return DINO_RUN_START_SECONDS - getRemainingSecondsPrecise();
  }

  // Shown from 5:10 to 4:54 while the timer runs, and frozen in place while paused there.
  function shouldShowDinoScene(sceneSeconds) {
    const hasStarted = state.isRunning || isFiniteNumber(state.pausedRemainingPrecise);
    return (
      Boolean(elements.dinoScene) &&
      hasStarted &&
      sceneSeconds >= -DINO_SCENE_OPEN_LEAD_SECONDS &&
      sceneSeconds < DINO_SCENE_SECONDS
    );
  }

  function updateDinoScene() {
    const sceneSeconds = getDinoSceneSeconds();
    const shouldShow = shouldShowDinoScene(sceneSeconds);

    if (shouldShow !== state.dinoSceneOpen) {
      state.dinoSceneOpen = shouldShow;
      elements.dinoScene.classList.toggle('is-open', shouldShow);
      if (shouldShow) {
        sizeDinoCanvas();
      }
    }

    if (!shouldShow) {
      stopDinoLoop();
      return;
    }

    drawDinoScene(sceneSeconds);
    if (state.isRunning) {
      scheduleDinoFrame();
    }
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
    const height = getCssSize(logo, 'height') || width * DVD_LOGO_ASPECT;
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
    // Fade back to white on the way home so it lands matching the header mark.
    if (elements.dvdLogoFloating) {
      elements.dvdLogoFloating.style.transition = `background-color ${DVD_RETURN_DURATION_MS}ms ease`;
    }
    applyDvdColor(DVD_START_COLOR);
  }

  function cancelDvdReturnAnimation() {
    if (elements.dvdLogoFloating) {
      elements.dvdLogoFloating.style.transition = '';
    }
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
    state.fireworksQueue = [];
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

  function startFireworksLoop() {
    if (!elements.fireworksLayer) {
      return;
    }

    if (!state.fireworksActive) {
      resizeFireworksCanvas();
      state.fireworksActive = true;
      document.body.classList.add('fireworks-active');
    }

    if (state.fireworksRafId === null) {
      state.fireworksLastFrameMs = null;
      state.fireworksRafId = window.requestAnimationFrame(fireworksFrame);
    }
  }

  function createBurstParticles(x, y, options = {}) {
    const particleCount = isFiniteNumber(options.particleCount) ? Math.max(1, Math.floor(options.particleCount)) : FIREWORK_PARTICLE_COUNT;
    const durationMs = isFiniteNumber(options.durationMs) ? Math.max(80, options.durationMs) : FIREWORK_DURATION_MS;
    const speedMultiplier = isFiniteNumber(options.speedMultiplier) ? options.speedMultiplier : 1;
    const sizeMultiplier = isFiniteNumber(options.sizeMultiplier) ? options.sizeMultiplier : 1;
    // A direction confines the burst to one quadrant, e.g. back into the screen from a corner.
    const direction = options.direction || null;
    const rgb = options.color ? hexToRgb(options.color) : SPARK_RGB;
    const arc = direction ? Math.PI / 2 : Math.PI * 2;
    const particles = [];

    for (let i = 0; i < particleCount; i += 1) {
      // A ring burst spaces its sparks evenly at one speed, so it opens as a clean circle.
      const angle = options.ring ? (i / particleCount) * Math.PI * 2 : Math.random() * arc;
      const speed = (options.ring ? 230 : 95 + Math.random() * 220) * speedMultiplier;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed * (direction ? direction.x : 1),
        vy: Math.sin(angle) * speed * (direction ? direction.y : 1),
        ageMs: 0,
        durationMs: durationMs * (0.82 + Math.random() * 0.38),
        size: (1.2 + Math.random() * 2.1) * sizeMultiplier,
        rgb
      });
    }

    return particles;
  }

  function triggerFireworks(x, y, options = {}) {
    if (!elements.fireworksLayer) {
      return;
    }

    state.fireworksParticles.push(...createBurstParticles(x, y, options));
    startFireworksLoop();
  }

  function triggerShockwave(center, markWidth) {
    if (!elements.fireworksLayer) {
      return;
    }

    // Two rings, the second trailing slightly, like the thud of the logo docking.
    [0, -140].forEach((ageMs, index) => {
      state.fireworksParticles.push({
        kind: 'ring',
        x: center.x,
        y: center.y,
        startRadius: markWidth * 0.5,
        endRadius: markWidth * (index === 0 ? 1.9 : 1.4),
        ageMs,
        durationMs: SHOCKWAVE_DURATION_MS
      });
    });
    startFireworksLoop();
  }

  function queueFireworksShow() {
    if (!elements.fireworksLayer) {
      return;
    }

    const startMs = state.fireworksClockMs;
    state.fireworksQueue = SHOW_ROCKET_LAUNCH_MS.map((delayMs, index) => ({ atMs: startMs + delayMs, index }));
    startFireworksLoop();
  }

  function launchRocket(index) {
    const viewport = getViewportSize();
    const isFinale = index >= SHOW_ROCKET_LAUNCH_MS.length - SHOW_FINALE_ROCKETS;
    // Spread launches across the screen: each rocket gets its own lane, jittered.
    const lane = isFinale
      ? (index - (SHOW_ROCKET_LAUNCH_MS.length - SHOW_FINALE_ROCKETS) + 0.5) / SHOW_FINALE_ROCKETS
      : ((index * 0.618) % 1);
    const x = viewport.w * (0.1 + 0.8 * lane) + (Math.random() - 0.5) * viewport.w * 0.06;
    const apexY = viewport.h * (isFinale ? 0.12 + Math.random() * 0.08 : 0.16 + Math.random() * 0.26);
    const scale = Math.max(0.55, Math.min(1, viewport.w / 1200));

    state.fireworksParticles.push({
      kind: 'rocket',
      x,
      y: viewport.h,
      vx: (Math.random() - 0.5) * 30,
      vy: -Math.sqrt(2 * SHOW_ROCKET_GRAVITY * (viewport.h - apexY)),
      ageMs: 0,
      burst: {
        ring: !isFinale && index % 3 === 1,
        particleCount: isFinale ? 96 : 64,
        durationMs: isFinale ? 2200 : 1500,
        speedMultiplier: (isFinale ? 1.35 : 1.05) * scale,
        sizeMultiplier: isFinale ? 1.6 : 1.25
      }
    });
  }

  function hexToRgb(hex) {
    const value = parseInt(hex.slice(1), 16);
    return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
  }

  function drawSpark(ctx, x, y, size, alpha, rgb = SPARK_RGB) {
    ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  function updateFireworks(deltaSec) {
    if (!state.fireworksActive || !state.fireworksContext) {
      return;
    }

    const ctx = state.fireworksContext;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    state.fireworksClockMs += deltaSec * 1000;
    while (state.fireworksQueue.length > 0 && state.fireworksQueue[0].atMs <= state.fireworksClockMs) {
      launchRocket(state.fireworksQueue.shift().index);
    }

    const spawned = [];
    state.fireworksParticles = state.fireworksParticles.filter((particle) => {
      particle.ageMs += deltaSec * 1000;

      if (particle.kind === 'ring') {
        if (particle.ageMs < 0) {
          return true;
        }
        if (particle.ageMs >= particle.durationMs) {
          return false;
        }
        const t = particle.ageMs / particle.durationMs;
        const eased = 1 - Math.pow(1 - t, 3);
        ctx.strokeStyle = `rgba(245, 245, 245, ${0.85 * (1 - t)})`;
        ctx.lineWidth = Math.max(0.5, 3 * (1 - t));
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.startRadius + (particle.endRadius - particle.startRadius) * eased, 0, Math.PI * 2);
        ctx.stroke();
        return true;
      }

      if (particle.kind === 'rocket') {
        particle.vy += SHOW_ROCKET_GRAVITY * deltaSec;
        particle.x += particle.vx * deltaSec;
        particle.y += particle.vy * deltaSec;

        // Bursts at the top of its climb.
        if (particle.vy >= 0) {
          spawned.push(...createBurstParticles(particle.x, particle.y, particle.burst));
          playPop({ strength: particle.burst.particleCount > 64 ? 0.85 : 0.6, pitch: 0.8 + Math.random() * 0.4, crackle: true });
          return false;
        }

        spawned.push({
          x: particle.x,
          y: particle.y,
          vx: (Math.random() - 0.5) * 24,
          vy: 20 + Math.random() * 40,
          ageMs: 0,
          durationMs: 380,
          size: 1 + Math.random() * 0.6
        });
        drawSpark(ctx, particle.x, particle.y, 2.2, 1);
        return true;
      }

      if (particle.ageMs >= particle.durationMs) {
        return false;
      }

      particle.vy += 350 * deltaSec;
      particle.x += particle.vx * deltaSec;
      particle.y += particle.vy * deltaSec;
      drawSpark(ctx, particle.x, particle.y, particle.size, Math.max(0, 1 - particle.ageMs / particle.durationMs), particle.rgb);

      return true;
    });
    state.fireworksParticles.push(...spawned);

    if (state.fireworksParticles.length === 0 && state.fireworksQueue.length === 0) {
      clearFireworks();
    }
  }

  // Fireworks run on their own loop so they finish even while the logo flies home or the timer is paused.
  // The show's clock only advances with frames, so a hidden tab picks the show up where it left off.
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

  function popHeaderLogo() {
    const logo = elements.brandLogo;
    if (!logo) {
      return;
    }

    logo.classList.remove('is-landing');
    void logo.offsetWidth; // Restart the animation if it is already running.
    logo.classList.add('is-landing');
    logo.addEventListener('animationend', () => logo.classList.remove('is-landing'), { once: true });
  }

  function celebrateLanding() {
    popHeaderLogo();
    playPop({ strength: 0.9, pitch: 0.55 });
    const markWidth = elements.brandLogo ? getCssSize(elements.brandLogo, 'width') * HEADER_LOGO_CROP.widthRatio : 150;
    triggerShockwave(getHeaderLogoCenter(), markWidth);
    queueFireworksShow();
  }

  // Time's up: the digits blink like a VCR clock, and once the logo is home it docks with a
  // thud and sets off a fireworks show.
  function startTimeUpCelebration() {
    if (!EFFECTS_ENABLED) {
      return;
    }

    document.body.classList.remove('time-up');
    void document.body.offsetWidth; // Restart the blink.
    document.body.classList.add('time-up');

    if (state.dvdActive) {
      state.celebrateOnLanding = true; // dvdFrame flies the logo home first.
    } else {
      celebrateLanding();
    }
  }

  function stopTimeUpCelebration() {
    document.body.classList.remove('time-up');
    state.celebrateOnLanding = false;
    state.fireworksQueue = [];
  }

  function reflectUnit(start, velocity, elapsedSeconds) {
    const unfolded = start + velocity * elapsedSeconds;
    const phase = ((unfolded % 2) + 2) % 2;
    return phase <= 1 ? phase : 2 - phase;
  }

  // Unfolded, a point p on a bounce axis sits at p + 2m (travelling the way the velocity points)
  // or at 2 - p + 2m (on its way back); take the candidate whose speed is closest to desired.
  // arriving and leaving (1 or -1) pin which way the logo travels at the end and the start.
  function solveUnitVelocity(start, target, durationSeconds, desiredSpeed, arriving = 0, leaving = 0) {
    if (durationSeconds <= 0) {
      return 0;
    }

    const minSpeed = desiredSpeed * 0.2;
    let best = null;

    [target, 2 - target].forEach((phase) => {
      [1, -1].forEach((sign) => {
        const center = Math.round((start + sign * desiredSpeed * durationSeconds - phase) / 2);
        for (let k = -2; k <= 2; k += 1) {
          const velocity = (phase + 2 * (center + k) - start) / durationSeconds;
          const arrivingDirection = (phase < 1 ? 1 : -1) * Math.sign(velocity);
          if (
            Math.abs(velocity) < minSpeed ||
            (arriving !== 0 && arrivingDirection !== arriving) ||
            (leaving !== 0 && Math.sign(velocity) !== leaving)
          ) {
            continue;
          }
          const deviation = Math.abs(Math.abs(velocity) - desiredSpeed);
          if (!best || deviation < best.deviation) {
            best = { velocity, deviation };
          }
        }
      });
    });

    return best ? best.velocity : (target - start) / durationSeconds;
  }

  // Every way to reach a waypoint: a corner exactly, or for a near miss, one wall with the
  // neighbouring wall still a gap away and the logo heading into the corner.
  function getWaypointOptions(waypoint) {
    const gap = {
      u: DVD_NEAR_MISS_GAP_PX / Math.max(1, state.dvdBounds.maxX - state.dvdBounds.minX),
      v: DVD_NEAR_MISS_GAP_PX / Math.max(1, state.dvdBounds.maxY - state.dvdBounds.minY)
    };
    const options = [];

    [0, 1].forEach((cornerU) => {
      [0, 1].forEach((cornerV) => {
        const intoCorner = { u: cornerU === 0 ? -1 : 1, v: cornerV === 0 ? -1 : 1 };
        if (!waypoint.nearMiss) {
          options.push({ end: { u: cornerU, v: cornerV }, arriving: { u: 0, v: 0 } });
          return;
        }
        options.push({ end: { u: cornerU, v: Math.abs(cornerV - gap.v) }, arriving: { u: 0, v: intoCorner.v } });
        options.push({ end: { u: Math.abs(cornerU - gap.u), v: cornerV }, arriving: { u: intoCorner.u, v: 0 } });
      });
    });

    return options;
  }

  function pickBestPath(start, durationSeconds, waypoint, leaving) {
    const spanX = Math.max(1, state.dvdBounds.maxX - state.dvdBounds.minX);
    const spanY = Math.max(1, state.dvdBounds.maxY - state.dvdBounds.minY);
    let best = null;

    getWaypointOptions(waypoint).forEach((option) => {
      const velocity = {
        u: solveUnitVelocity(start.u, option.end.u, durationSeconds, waypoint.speedX / spanX, option.arriving.u, leaving.u),
        v: solveUnitVelocity(start.v, option.end.v, durationSeconds, waypoint.speedY / spanY, option.arriving.v, leaving.v)
      };
      const speedPenalty = (
        Math.abs(Math.abs(velocity.u) * spanX - waypoint.speedX) +
        Math.abs(Math.abs(velocity.v) * spanY - waypoint.speedY)
      );

      if (!best || speedPenalty < best.speedPenalty) {
        best = { end: option.end, arriving: option.arriving, velocity, speedPenalty };
      }
    });

    return best;
  }

  function planDvdPath(anchor, anchorRemaining) {
    const path = [];
    let start = anchor;
    let startRemaining = anchorRemaining;
    // After a near miss the logo is still mid-air on one axis, so it must carry on the same way.
    let leaving = { u: 0, v: 0 };

    DVD_WAYPOINTS.forEach((waypoint) => {
      if (startRemaining <= waypoint.remainingSeconds) {
        return;
      }

      const best = pickBestPath(start, startRemaining - waypoint.remainingSeconds, waypoint, leaving);
      path.push({
        startRemaining,
        endRemaining: waypoint.remainingSeconds,
        start,
        velocity: best.velocity,
        end: best.end
      });
      start = best.end;
      startRemaining = waypoint.remainingSeconds;
      leaving = best.arriving;
    });

    state.dvdPath = path.length > 0 ? path : null;
  }

  function isCornerPoint(point) {
    return (point.u === 0 || point.u === 1) && (point.v === 0 || point.v === 1);
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

  // Walls crossed on one axis: the whole numbers passed in unfolded space. A segment that starts on
  // a wall doesn't count it again; the previous segment already did.
  function countWallHits(start, velocity, elapsedSeconds) {
    const end = start + velocity * elapsedSeconds;
    if (velocity > 0) {
      return Math.floor(end + 1e-9) - Math.floor(start);
    }
    if (velocity < 0) {
      return Math.ceil(start) - Math.ceil(end - 1e-9);
    }
    return 0;
  }

  // Like the real DVD logo, it changes colour every time it hits a wall. Worked out from the
  // clock like the position, so pausing and reloading keep the same colour.
  function getDvdColor(remaining) {
    let hits = 0;
    state.dvdPath.forEach((segment) => {
      const elapsed = Math.max(0, Math.min(segment.startRemaining - segment.endRemaining, segment.startRemaining - remaining));
      hits += countWallHits(segment.start.u, segment.velocity.u, elapsed);
      hits += countWallHits(segment.start.v, segment.velocity.v, elapsed);
    });
    return hits === 0 ? DVD_START_COLOR : DVD_COLORS[(hits - 1) % DVD_COLORS.length];
  }

  function applyDvdColor(color) {
    if (!elements.dvdLogoFloating || state.dvdColor === color) {
      return;
    }
    state.dvdColor = color;
    elements.dvdLogoFloating.style.backgroundColor = color;
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
    playPop(options.sound);
    state.dvdLastCornerFireworkMs = now;
    state.dvdCurrentCornerContactKey = getCornerKey(corner);
  }

  function maybeTriggerPlannedCornerFireworks(remaining, color) {
    const previous = state.lastRemainingPrecise;
    // A +/- minute jump across a hit is not a hit.
    if (!isFiniteNumber(previous) || previous - remaining > MAX_CORNER_HIT_STEP_SECONDS) {
      return;
    }

    state.dvdPath.forEach((segment) => {
      if (isCornerPoint(segment.end) && previous > segment.endRemaining && remaining <= segment.endRemaining) {
        const isFinale = segment.endRemaining === FINAL_CORNER_HIT_SECONDS;
        triggerCornerFireworks(segment.end, isFinale
          ? {
            force: true,
            color,
            sound: { strength: 1.1, crackle: true },
            particleCount: FINAL_FIREWORK_PARTICLE_COUNT,
            durationMs: FINAL_FIREWORK_DURATION_MS,
            speedMultiplier: 1.42,
            sizeMultiplier: 1.95
          }
          : { force: true, color });
      }
    });
  }

  function maybeTriggerPerfectCornerFireworks(color) {
    const contact = getCornerContact(state.dvdPosition);
    if (!contact) {
      state.dvdCurrentCornerContactKey = null;
      return;
    }

    if (state.dvdCurrentCornerContactKey !== getCornerKey(contact)) {
      triggerCornerFireworks(contact, { color });
    }
  }

  function updateDvdPhysics(remaining) {
    if (!state.dvdPath) {
      return;
    }

    const color = getDvdColor(remaining);
    state.dvdPosition = toScreenPoint(getDvdUnitPoint(remaining));
    maybeTriggerPlannedCornerFireworks(remaining, color);
    maybeTriggerPerfectCornerFireworks(color);
    applyDvdColor(color);
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
    if (!isDvdPhaseRange(remaining)) {
      return false;
    }
    if (state.dvdPath !== null) {
      return true;
    }
    // A new path needs time to reach the final corner. Without this, a throttled background
    // tab that jumps from before 40:00 straight into the last seconds would launch with no path.
    return state.isRunning && remaining > FINAL_CORNER_HIT_SECONDS;
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
        if (state.celebrateOnLanding) {
          state.celebrateOnLanding = false;
          celebrateLanding();
        }
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
    const remaining = getRemainingSecondsPrecise();
    const needsPath = (enteredFromStart || !state.dvdPath) && remaining > FINAL_CORNER_HIT_SECONDS;
    if (!needsPath && !state.dvdPath) {
      return;
    }

    const wasActive = state.dvdActive;
    if (!wasActive) {
      state.dvdActive = true;
      document.body.classList.add('dvd-active');
      updateDvdSize();
      updateDvdBounds();
    }

    if (needsPath) {
      // Lift off from wherever the logo is: the header mark, or mid-flight home.
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

    if (state.dinoSceneOpen) {
      sizeDinoCanvas();
      drawDinoScene(getDinoSceneSeconds());
    }

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
    const isIdle = !state.isRunning && state.remainingSeconds === DURATION_SECONDS;
    document.title = isIdle
      ? BASE_TITLE
      : `${formatTime(state.remainingSeconds)} · ${BASE_TITLE}`;
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
    const duration = DURATION_SECONDS;
    const progressRatio = duration > 0 ? state.remainingSeconds / duration : 0;
    const progressPercent = Math.max(0, Math.min(100, progressRatio * 100));

    elements.timerDisplay.textContent = formatTime(state.remainingSeconds);
    elements.progressFill.style.width = `${progressPercent}%`;
    elements.startPauseButton.textContent = state.isRunning ? 'Pause' : 'Start';
    elements.startPauseButton.setAttribute('aria-pressed', state.isRunning ? 'true' : 'false');

    document.body.classList.toggle('final-five', isFinalFive());

    updateFullscreenButtonLabel();
    renderStatus();
    renderDocumentTitle();
    syncWakeLock();
    maybePlayMilestoneChimes(remainingPrecise);
    if (state.remainingSeconds > 0) {
      // Any way back to time on the clock (reset, restart, +1 min) ends the celebration.
      stopTimeUpCelebration();
    }
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
    playSound((context, output) => {
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
        gain.connect(output);
        oscillator.start(toneStart);
        oscillator.stop(toneEnd);
      }
    });
  }

  function finishTimer() {
    state.remainingSeconds = 0;
    state.pausedRemainingPrecise = null;
    state.isRunning = false;
    clearTicking();
    render();
    playEndSound();
    startTimeUpCelebration();
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

  // Firework sounds are off unless someone turns them on; the choice is remembered.
  function restoreFireworkSoundSetting() {
    try {
      state.fireworkSounds = window.localStorage.getItem(FIREWORK_SOUND_STORAGE_KEY) === 'on';
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function renderSoundToggle() {
    if (!elements.soundToggle) {
      return;
    }
    elements.soundToggle.setAttribute('aria-pressed', state.fireworkSounds ? 'true' : 'false');
    elements.soundToggle.title = state.fireworkSounds ? 'Turn off firework sounds (M)' : 'Turn on firework sounds (M)';
  }

  async function toggleFireworkSounds() {
    if (!elements.soundToggle) {
      return;
    }
    state.fireworkSounds = !state.fireworkSounds;
    try {
      window.localStorage.setItem(FIREWORK_SOUND_STORAGE_KEY, state.fireworkSounds ? 'on' : 'off');
    } catch (error) {
      // Ignore storage failures.
    }
    if (state.fireworkOutput) {
      state.fireworkOutput.gain.value = state.fireworkSounds ? 1 : 0;
    }
    renderSoundToggle();
    if (state.fireworkSounds) {
      await ensureAudioContext();
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
      state.remainingSeconds = DURATION_SECONDS;
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
    state.remainingSeconds = DURATION_SECONDS;
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
      f: toggleFullscreen,
      m: toggleFireworkSounds
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
    elements.startPauseButton.addEventListener('click', toggleStartPause);
    elements.resetButton.addEventListener('click', resetTimer);
    elements.minusMinuteButton.addEventListener('click', () => adjustMinutes(-1));
    elements.plusMinuteButton.addEventListener('click', () => adjustMinutes(1));

    if (elements.fullscreenButton) {
      elements.fullscreenButton.addEventListener('click', toggleFullscreen);
    }

    if (elements.soundToggle) {
      elements.soundToggle.addEventListener('click', toggleFireworkSounds);
    }

    // Browsers only allow audio after a user gesture, so after a reload mid-run the first
    // click or key press anywhere brings the sounds back.
    ['pointerdown', 'keydown'].forEach((type) => {
      document.addEventListener(type, () => {
        ensureAudioContext();
      }, { once: true, capture: true });
    });

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

    if (EFFECTS_ENABLED && elements.dinoSprites) {
      elements.dinoSprites.addEventListener('load', updateDinoScene);
    }
  }

  restoreState();
  restoreFireworkSoundSetting();
  renderSoundToggle();
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
