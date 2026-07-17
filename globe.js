/* ══════════════════════════════════════════════════════════════════
   GLOBE — Stippled orthographic globe of travels
   Vanilla JS, no dependencies. Land data: world-atlas land-110m.
   ══════════════════════════════════════════════════════════════════ */

(function () {
  // ── PLACES ──
  // lat / lon in degrees. type: 'home' renders gold, 'travel' renders accent.
  const PLACES = [
    { name: 'San Francisco, CA', lat: 37.7749, lon: -122.4194, type: 'home' },
    { name: 'Claremont, CA', lat: 34.0967, lon: -117.7198, type: 'travel' },
    // Add travels here:
    // { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, type: 'travel' },
  ];

  const COLORS = {
    home: '#c9a227',
    travel: '#c94a2b',
    land: '#1a1714',
    edge: '#d4cfc9',
  };

  const canvas = document.getElementById('globe-canvas');
  const tooltip = document.getElementById('globe-tooltip');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let rotation = { lambda: 100, phi: 25 }; // start centered near the western US
  let autoSpin = true;
  let landPoints = []; // [lat, lon] stipple grid on land
  let borderArcs = []; // decoded topojson arcs: coastlines + country borders
  let projected = []; // screen positions of PLACES this frame

  // ── TOPOJSON DECODE ──
  function decodeTopo(topo) {
    const { scale, translate } = topo.transform;
    const arcs = topo.arcs.map((arc) => {
      let x = 0, y = 0;
      return arc.map(([dx, dy]) => {
        x += dx; y += dy;
        return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
      });
    });
    borderArcs = arcs; // every arc is a coastline or shared country border
    function ring(arcIdxs) {
      const pts = [];
      arcIdxs.forEach((i) => {
        const arc = i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
        // drop duplicated joint point between consecutive arcs
        const start = pts.length ? 1 : 0;
        for (let k = start; k < arc.length; k++) pts.push(arc[k]);
      });
      return pts;
    }
    const polygons = [];
    topo.objects.land.geometries.forEach((geom) => {
      geom.arcs.forEach((poly) => polygons.push(poly.map(ring)));
    });
    return polygons; // MultiPolygon: [ [ring, hole...], ... ] of [lon, lat]
  }

  // ── LAND MASK → STIPPLE GRID ──
  // Rasterize polygons on an offscreen equirectangular canvas, then sample.
  function buildStipple(polygons) {
    const W = 1440, H = 720; // 0.25° per pixel
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const octx = off.getContext('2d', { willReadFrequently: true });
    octx.fillStyle = '#000';
    polygons.forEach((rings) => {
      // Unwrap longitudes so antimeridian-crossing rings (e.g. Antarctica)
      // stay continuous, then draw at ±360° offsets to cover the wrap.
      const unwrapped = rings.map((ringPts) => {
        const out = [];
        let prev = null;
        ringPts.forEach(([lon, lat]) => {
          if (prev !== null) {
            while (lon - prev > 180) lon -= 360;
            while (lon - prev < -180) lon += 360;
          }
          prev = lon;
          out.push([lon, lat]);
        });
        const span = Math.abs(out[out.length - 1][0] - out[0][0]);
        if (span > 300) {
          // polar ring: close it through the south pole
          out.push([out[out.length - 1][0], -90], [out[0][0], -90]);
        }
        return out;
      });
      [-360, 0, 360].forEach((shift) => {
        octx.beginPath();
        unwrapped.forEach((ringPts) => {
          ringPts.forEach(([lon, lat], i) => {
            const x = ((lon + shift + 180) / 360) * W;
            const y = ((90 - lat) / 180) * H;
            if (i === 0) octx.moveTo(x, y); else octx.lineTo(x, y);
          });
          octx.closePath();
        });
        octx.fill('evenodd');
      });
    });
    const img = octx.getImageData(0, 0, W, H).data;
    const pts = [];
    const latStep = 1.25;
    for (let lat = -88; lat <= 88; lat += latStep) {
      // keep dot spacing roughly even by widening lon step toward the poles
      const lonStep = latStep / Math.max(Math.cos((lat * Math.PI) / 180), 0.12);
      for (let lon = -180; lon < 180; lon += lonStep) {
        const px = Math.floor(((lon + 180) / 360) * W);
        const py = Math.floor(((90 - lat) / 180) * H);
        if (img[(py * W + px) * 4 + 3] > 0) pts.push([lat, lon]);
      }
    }
    return pts;
  }

  // ── PROJECTION ──
  // Orthographic; returns [x, y, visible] in unit-sphere coords.
  function project(lat, lon) {
    const D = Math.PI / 180;
    const la = lat * D, lo = (lon + rotation.lambda) * D, ph = rotation.phi * D;
    const cosLa = Math.cos(la);
    const x = cosLa * Math.sin(lo);
    const y0 = Math.sin(la);
    const z0 = cosLa * Math.cos(lo);
    // tilt around x-axis by phi
    const y = y0 * Math.cos(ph) - z0 * Math.sin(ph);
    const z = y0 * Math.sin(ph) + z0 * Math.cos(ph);
    return [x, -y, z > 0];
  }

  // ── RENDER ──
  function draw() {
    const size = canvas.width;
    const c = size / 2;
    const R = size * 0.46;
    ctx.clearRect(0, 0, size, size);

    // globe edge
    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.edge;
    ctx.lineWidth = Math.max(1, size / 640);
    ctx.stroke();

    // land stipple
    const dotR = size / 540;
    ctx.fillStyle = COLORS.land;
    for (let i = 0; i < landPoints.length; i++) {
      const [x, y, vis] = project(landPoints[i][0], landPoints[i][1]);
      if (!vis) continue;
      ctx.globalAlpha = 0.28 + 0.5 * Math.sqrt(Math.max(1 - x * x - y * y, 0));
      ctx.beginPath();
      ctx.arc(c + x * R, c + y * R, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // country borders + coastlines
    ctx.strokeStyle = COLORS.land;
    ctx.lineWidth = Math.max(1, size / 900);
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    for (let a = 0; a < borderArcs.length; a++) {
      const arc = borderArcs[a];
      let pen = false;
      for (let i = 0; i < arc.length; i++) {
        const [x, y, vis] = project(arc[i][1], arc[i][0]);
        if (!vis) { pen = false; continue; }
        const sx = c + x * R, sy = c + y * R;
        if (pen) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
        pen = true;
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // place markers
    projected = [];
    PLACES.forEach((p) => {
      const [x, y, vis] = project(p.lat, p.lon);
      if (!vis) return;
      const sx = c + x * R, sy = c + y * R;
      projected.push({ ...p, sx, sy });
      const r = p.type === 'home' ? size / 90 : size / 130;
      ctx.beginPath();
      ctx.arc(sx, sy, r * 2.1, 0, Math.PI * 2);
      ctx.fillStyle = p.type === 'home' ? 'rgba(201,162,39,0.18)' : 'rgba(201,74,43,0.14)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[p.type];
      ctx.fill();
    });
  }

  function frame() {
    if (autoSpin) rotation.lambda += 0.045;
    draw();
    requestAnimationFrame(frame);
  }

  // ── SIZE ──
  function resize() {
    const px = canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = px;
    canvas.height = px;
  }
  window.addEventListener('resize', resize);

  // ── INTERACTION ──
  let dragging = false, last = null, resumeTimer = null;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    autoSpin = false;
    clearTimeout(resumeTimer);
    last = [e.clientX, e.clientY];
    canvas.classList.add('dragging');
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (dragging) {
      const k = 0.28 * (640 / canvas.clientWidth);
      rotation.lambda += (e.clientX - last[0]) * k;
      rotation.phi += (e.clientY - last[1]) * k;
      rotation.phi = Math.max(-75, Math.min(75, rotation.phi));
      last = [e.clientX, e.clientY];
    } else {
      hoverTooltip(e);
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    dragging = false;
    canvas.classList.remove('dragging');
    canvas.releasePointerCapture(e.pointerId);
    resumeTimer = setTimeout(() => { autoSpin = true; }, 3000);
  });

  function hoverTooltip(e) {
    const rect = canvas.getBoundingClientRect();
    const scl = canvas.width / rect.width;
    const mx = (e.clientX - rect.left) * scl;
    const my = (e.clientY - rect.top) * scl;
    const hitR = canvas.width / 40;
    let hit = null;
    for (const p of projected) {
      if (Math.hypot(p.sx - mx, p.sy - my) < hitR) { hit = p; break; }
    }
    if (hit) {
      tooltip.textContent = hit.name;
      tooltip.style.left = (hit.sx / scl) + 'px';
      tooltip.style.top = (hit.sy / scl) + 'px';
      tooltip.classList.add('visible');
    } else {
      tooltip.classList.remove('visible');
    }
  }
  canvas.addEventListener('pointerleave', () => tooltip.classList.remove('visible'));

  // ── INIT ──
  fetch('data/countries-110m.json')
    .then((r) => r.json())
    .then((topo) => {
      landPoints = buildStipple(decodeTopo(topo));
      resize();
      frame();
    });
})();
