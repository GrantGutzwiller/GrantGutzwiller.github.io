/* ══════════════════════════════════════════════════════════════════
   GLOBE — Stippled orthographic globe of travels
   Vanilla JS, no dependencies. Land data: world-atlas land-110m.
   ══════════════════════════════════════════════════════════════════ */

(function () {
  // ── PLACES ──
  // lat / lon in degrees. type: 'home' renders gold, 'travel' renders accent.
  const PLACES = [
    { name: 'San Francisco, CA', lat: 37.7749, lon: -122.4194, type: 'home' },
    // United States
    { name: 'Claremont, CA', lat: 34.0967, lon: -117.7198, type: 'travel' },
    { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437, type: 'travel' },
    { name: 'Yosemite, CA', lat: 37.8651, lon: -119.5383, type: 'travel' },
    { name: 'Mammoth, CA', lat: 37.6485, lon: -118.9721, type: 'travel' },
    { name: 'Death Valley, CA', lat: 36.5323, lon: -116.9325, type: 'travel' },
    { name: 'Joshua Tree, CA', lat: 33.8734, lon: -115.9010, type: 'travel' },
    { name: 'Crater Lake, OR', lat: 42.9446, lon: -122.1090, type: 'travel' },
    { name: 'Sun Valley, ID', lat: 43.6971, lon: -114.3517, type: 'travel' },
    { name: 'Tahoe City, CA', lat: 39.1677, lon: -120.1452, type: 'travel' },
    { name: 'Big Bear, CA', lat: 34.2439, lon: -116.9114, type: 'travel' },
    { name: 'Park City, UT', lat: 40.6461, lon: -111.4980, type: 'travel' },
    { name: 'Deer Valley, UT', lat: 40.6374, lon: -111.4783, type: 'travel' },
    { name: 'Snowbird, UT', lat: 40.5830, lon: -111.6538, type: 'travel' },
    { name: 'Alta, UT', lat: 40.5884, lon: -111.6386, type: 'travel' },
    { name: 'Jackson Hole, WY', lat: 43.5875, lon: -110.8279, type: 'travel' },
    { name: 'Big Sky, MT', lat: 45.2618, lon: -111.3080, type: 'travel' },
    // Canada
    { name: 'Whistler, BC', lat: 50.1163, lon: -122.9574, type: 'travel' },
    { name: 'Vancouver, BC', lat: 49.2827, lon: -123.1207, type: 'travel' },
    { name: 'Victoria, BC', lat: 48.4284, lon: -123.3656, type: 'travel' },
    { name: 'Phoenix, AZ', lat: 33.4484, lon: -112.0740, type: 'travel' },
    { name: 'Salt Lake City, UT', lat: 40.7608, lon: -111.8910, type: 'travel' },
    { name: 'Portland, OR', lat: 45.5152, lon: -122.6784, type: 'travel' },
    { name: 'Aspen, CO', lat: 39.1911, lon: -106.8175, type: 'travel' },
    { name: 'Vail, CO', lat: 39.6403, lon: -106.3742, type: 'travel' },
    { name: 'Denver, CO', lat: 39.7392, lon: -104.9903, type: 'travel' },
    { name: 'New York, NY', lat: 40.7128, lon: -74.0060, type: 'travel' },
    { name: 'Seattle, WA', lat: 47.6062, lon: -122.3321, type: 'travel' },
    { name: 'San Diego, CA', lat: 32.7157, lon: -117.1611, type: 'travel' },
    { name: 'Santa Barbara, CA', lat: 34.4208, lon: -119.6982, type: 'travel' },
    { name: 'Palm Springs, CA', lat: 33.8303, lon: -116.5453, type: 'travel' },
    { name: 'Big Sur, CA', lat: 36.2704, lon: -121.8081, type: 'travel' },
    { name: 'Monterey, CA', lat: 36.6002, lon: -121.8947, type: 'travel' },
    { name: 'Napa, CA', lat: 38.2975, lon: -122.2869, type: 'travel' },
    { name: 'Grand Teton, WY', lat: 43.7904, lon: -110.6818, type: 'travel' },
    { name: 'Washington, DC', lat: 38.9072, lon: -77.0369, type: 'travel' },
    { name: 'Boston, MA', lat: 42.3601, lon: -71.0589, type: 'travel' },
    { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298, type: 'travel' },
    { name: 'St. Louis, MO', lat: 38.6270, lon: -90.1994, type: 'travel' },
    { name: 'Bloomington, IN', lat: 39.1653, lon: -86.5264, type: 'travel' },
    { name: 'New Orleans, LA', lat: 29.9511, lon: -90.0715, type: 'travel' },
    { name: 'Port St. Joe, FL', lat: 29.8119, lon: -85.3030, type: 'travel' },
    { name: 'Juneau, AK', lat: 58.3019, lon: -134.4197, type: 'travel' },
    { name: 'Sitka, AK', lat: 57.0531, lon: -135.3300, type: 'travel' },
    { name: 'Kona, Big Island, HI', lat: 19.6400, lon: -155.9969, type: 'travel' },
    { name: 'Lahaina, Maui, HI', lat: 20.8783, lon: -156.6825, type: 'travel' },
    // Americas
    { name: 'Tequisquiapan, Mexico', lat: 20.5211, lon: -99.8951, type: 'travel' },
    { name: 'San José, Costa Rica', lat: 9.9281, lon: -84.0907, type: 'travel' },
    { name: 'Belize City, Belize', lat: 17.5046, lon: -88.1962, type: 'travel' },
    { name: 'Cusco, Peru', lat: -13.5319, lon: -71.9675, type: 'travel' },
    { name: 'Machu Picchu, Peru', lat: -13.1631, lon: -72.5450, type: 'travel' },
    { name: 'St. George\'s, Grenada', lat: 12.0564, lon: -61.7485, type: 'travel' },
    { name: 'Nassau, Bahamas', lat: 25.0443, lon: -77.3504, type: 'travel' },
    // Europe
    { name: 'London, England', lat: 51.5074, lon: -0.1278, type: 'travel' },
    { name: 'Paris, France', lat: 48.8566, lon: 2.3522, type: 'travel' },
    { name: 'Cannes, France', lat: 43.5528, lon: 7.0174, type: 'travel' },
    { name: 'Chamonix, France', lat: 45.9237, lon: 6.8694, type: 'travel' },
    { name: 'Mont Saint-Michel, France', lat: 48.6361, lon: -1.5115, type: 'travel' },
    { name: 'Madrid, Spain', lat: 40.4168, lon: -3.7038, type: 'travel' },
    { name: 'Granada, Spain', lat: 37.1773, lon: -3.5986, type: 'travel' },
    { name: 'Barcelona, Spain', lat: 41.3874, lon: 2.1686, type: 'travel' },
    { name: 'Rome, Italy', lat: 41.9028, lon: 12.4964, type: 'travel' },
    { name: 'Venice, Italy', lat: 45.4408, lon: 12.3155, type: 'travel' },
    { name: 'Copenhagen, Denmark', lat: 55.6761, lon: 12.5683, type: 'travel' },
    { name: 'Budapest, Hungary', lat: 47.4979, lon: 19.0402, type: 'travel' },
    { name: 'Korčula, Croatia', lat: 42.9603, lon: 17.1361, type: 'travel' },
    { name: 'Split, Croatia', lat: 43.5081, lon: 16.4402, type: 'travel' },
    { name: 'Zagreb, Croatia', lat: 45.8150, lon: 15.9819, type: 'travel' },
    { name: 'Bled, Slovenia', lat: 46.3683, lon: 14.1146, type: 'travel' },
    { name: 'Hydra, Greece', lat: 37.3496, lon: 23.4645, type: 'travel' },
    { name: 'Athens, Greece', lat: 37.9838, lon: 23.7275, type: 'travel' },
    { name: 'Santorini, Greece', lat: 36.3932, lon: 25.4615, type: 'travel' },
    { name: 'Delphi, Greece', lat: 38.4824, lon: 22.5010, type: 'travel' },
    // Asia
    { name: 'Kyoto, Japan', lat: 35.0116, lon: 135.7681, type: 'travel' },
    { name: 'Hiroshima, Japan', lat: 34.3853, lon: 132.4553, type: 'travel' },
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
  let zoom = 1;

  // shrink markers that sit in a tight cluster (relaxes as you zoom in)
  {
    const D = Math.PI / 180;
    PLACES.forEach((p) => {
      let n = 0;
      PLACES.forEach((q) => {
        if (p === q) return;
        const d = Math.acos(Math.min(1,
          Math.sin(p.lat * D) * Math.sin(q.lat * D) +
          Math.cos(p.lat * D) * Math.cos(q.lat * D) * Math.cos((p.lon - q.lon) * D)));
        if (d < 2.5 * D) n++;
      });
      p.crowd = 1 / Math.sqrt(1 + n * 0.9);
    });
  }
  let landPoints = []; // [lat, lon] stipple grid on land
  let borderArcs = []; // decoded topojson arcs: coastlines + country borders
  let stateLines = []; // US state boundary polylines of [lon, lat]
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
    const R = size * 0.46 * zoom;
    ctx.clearRect(0, 0, size, size);

    // globe edge
    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.edge;
    ctx.lineWidth = Math.max(1, size / 640);
    ctx.stroke();

    // land stipple
    const dotR = (size / 540) * Math.pow(zoom, 0.75);
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

    // boundary lines: [polylines, width, alpha]
    function strokeLines(lines, width, alpha) {
      ctx.strokeStyle = COLORS.land;
      ctx.lineWidth = width;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      for (let a = 0; a < lines.length; a++) {
        const line = lines[a];
        let pen = false;
        for (let i = 0; i < line.length; i++) {
          const [x, y, vis] = project(line[i][1], line[i][0]);
          if (!vis) { pen = false; continue; }
          const sx = c + x * R, sy = c + y * R;
          if (pen) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
          pen = true;
        }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const lw = Math.sqrt(zoom);
    strokeLines(borderArcs, Math.max(1.2, size / 700) * lw, 0.7); // countries + coasts
    strokeLines(stateLines, Math.max(0.8, size / 1100) * lw, 0.4); // US states

    // place markers
    projected = [];
    PLACES.forEach((p) => {
      const [x, y, vis] = project(p.lat, p.lon);
      if (!vis) return;
      const sx = c + x * R, sy = c + y * R;
      projected.push({ ...p, sx, sy });
      const cs = p.type === 'home' ? 1 : Math.min(1, p.crowd * Math.sqrt(zoom));
      const r = (p.type === 'home' ? size / 90 : size / 130) * cs * Math.pow(zoom, 0.4);
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
    if (autoSpin) rotation.lambda += 0.045 / zoom;
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
      const k = 0.28 * (640 / canvas.clientWidth) / zoom;
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

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoom = Math.max(1, Math.min(6, zoom * Math.exp(-e.deltaY * 0.0012)));
  }, { passive: false });

  // ── INIT ──
  Promise.all([
    fetch('data/countries-110m.json').then((r) => r.json()),
    fetch('data/state-lines-110m.json').then((r) => r.json()),
  ]).then(([topo, states]) => {
    landPoints = buildStipple(decodeTopo(topo));
    stateLines = states;
    resize();
    frame();
  });
})();
