(() => {
  'use strict';

  const DATA_URL = 'data/task_tam_data.json';
  const METHODS_URL = 'methods.md';

  const EXPOSURE_ORDER = ['High', 'Medium-High', 'Medium', 'Low-Medium', 'Low'];
  const EXPOSURE_COLORS = {
    High: '#111111',
    'Medium-High': '#2f3640',
    Medium: '#596273',
    'Low-Medium': '#8791a1',
    Low: '#b8c0cd'
  };
  const EXPOSURE_LEGEND_LABEL = {
    High: 'High (70-100)',
    'Medium-High': 'Medium-High (50-69)',
    Medium: 'Medium (35-49)',
    'Low-Medium': 'Low-Medium (20-34)',
    Low: 'Low (0-19)'
  };

  const state = {
    data: null,
    dwas: [],
    occs: [],
    socDwa: [],
    taskTypes: [],
    derived: null,
    maps: {
      dwa: new Map(),
      occ: new Map(),
      socToRows: new Map(),
      dwaToRows: new Map()
    },
    filters: {
      dwa: { search: '', exposure: 'all', taskType: 'all', sort: 'value', asc: false, page: 1, perPage: 25 },
      occ: { search: '', exposure: 'all', sort: 'wage_bill', asc: false, page: 1, perPage: 25 }
    },
    charts: {}
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    setStatus('loading');
    bindTabs();
    bindModals();

    try {
      const payload = await fetchJson(DATA_URL);
      normalizeData(payload);
      computeDerived();
      populateHeaderStats();
      populateNarrative();
      buildFilterControls();
      bindTableControls();
      renderActivityTable();
      renderOccupationTable();
      renderLists();
      renderCharts();
      setTimeout(resizeAllCharts, 80);
      await loadMethods();
      setStatus('ready');
    } catch (error) {
      console.error('Task Atlas initialization failed:', error);
      setStatus('error', error && error.message ? error.message : 'Unknown error');
    }
  }

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url} (HTTP ${response.status})`);
    }
    return response.json();
  }

  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function normalizeExposure(raw) {
    if (raw == null) return null;
    const text = String(raw).trim();
    if (!text) return null;
    if (EXPOSURE_ORDER.includes(text)) return text;
    const normalized = text.toLowerCase();
    if (normalized === 'mediumhigh' || normalized === 'medium_high') return 'Medium-High';
    if (normalized === 'lowmedium' || normalized === 'low_medium') return 'Low-Medium';
    return null;
  }

  function classifyExposure(score) {
    if (score >= 70) return 'High';
    if (score >= 50) return 'Medium-High';
    if (score >= 35) return 'Medium';
    if (score >= 20) return 'Low-Medium';
    return 'Low';
  }

  function normalizeData(payload) {
    state.data = payload || {};

    const rawDwas = Array.isArray(state.data.dwas) ? state.data.dwas : [];
    const totalValue = rawDwas.reduce((sum, row) => sum + toNumber(row.value), 0);

    state.dwas = rawDwas
      .map((row, index) => {
        const value = toNumber(row.value);
        const aiScore = toNumber(row.ai_score);
        // Always derive categories from score so stale source labels cannot drift.
        const aiCat = classifyExposure(aiScore);
        const share = toNumber(row.share) || (totalValue > 0 ? (value / totalValue) * 100 : 0);

        return {
          rank: toNumber(row.rank) || index + 1,
          id: String(row.id || '').trim(),
          title: String(row.title || '').trim(),
          gwa: String(row.gwa || 'Unspecified').trim(),
          value,
          share,
          ai_score: aiScore,
          ai_cat: aiCat,
          task_type: String(row.task_type || 'unspecified').trim()
        };
      })
      .filter((row) => row.id && row.title)
      .sort((a, b) => b.value - a.value)
      .map((row, idx) => {
        row.rank = idx + 1;
        if (!Number.isFinite(row.share) || row.share <= 0) {
          row.share = totalValue > 0 ? (row.value / totalValue) * 100 : 0;
        }
        return row;
      });

    const rawOccs = Array.isArray(state.data.occs) ? state.data.occs : [];
    state.occs = rawOccs
      .map((row) => {
        const soc = String(row.soc || row.code || '').trim();
        const aiScore = toNumber(row.ai_score);
        return {
          soc,
          code: soc,
          title: String(row.title || soc || 'Unknown Occupation').trim(),
          emp: Math.round(toNumber(row.emp || row.TOT_EMP)),
          mean_wage: toNumber(row.mean_wage || row.A_MEAN),
          wage_bill: toNumber(row.wage_bill || row.wb),
          ai_score: aiScore,
          // Keep occupation category deterministic from score.
          ai_cat: classifyExposure(aiScore),
          high_pct: toNumber(row.high_pct),
          top_dwa: String(row.top_dwa || '').trim()
        };
      })
      .filter((row) => row.soc)
      .sort((a, b) => b.wage_bill - a.wage_bill);

    const rawSocDwa = Array.isArray(state.data.soc_dwa) ? state.data.soc_dwa : [];
    state.socDwa = rawSocDwa
      .map((row) => {
        if (Array.isArray(row)) {
          return {
            soc: String(row[0] || '').trim(),
            dwa_id: String(row[1] || '').trim(),
            dwa_share: toNumber(row[2]),
            value: toNumber(row[3])
          };
        }
        return {
          soc: String(row.soc || row.SOC || row['SOC Code'] || '').trim(),
          dwa_id: String(row.dwa_id || row.dwa || row['DWA ID'] || '').trim(),
          dwa_share: toNumber(row.dwa_share || row.share),
          value: toNumber(row.value)
        };
      })
      .filter((row) => row.soc && row.dwa_id);

    state.taskTypes = buildTaskTypes(state.dwas);

    buildMaps();
  }

  function buildTaskTypes(dwas) {
    const total = dwas.reduce((sum, row) => sum + row.value, 0);
    const grouped = new Map();

    dwas.forEach((row) => {
      const key = row.task_type || 'unspecified';
      if (!grouped.has(key)) {
        grouped.set(key, { task_type: key, value: 0, count: 0, weightedAi: 0 });
      }
      const bucket = grouped.get(key);
      bucket.value += row.value;
      bucket.count += 1;
      bucket.weightedAi += row.ai_score * row.value;
    });

    return Array.from(grouped.values())
      .map((row) => ({
        task_type: row.task_type,
        value: row.value,
        count: row.count,
        share: total > 0 ? (row.value / total) * 100 : 0,
        avg_ai_score: row.value > 0 ? row.weightedAi / row.value : 0
      }))
      .sort((a, b) => b.value - a.value);
  }

  function buildMaps() {
    state.maps.dwa = new Map(state.dwas.map((row) => [row.id, row]));
    state.maps.occ = new Map(state.occs.map((row) => [row.soc, row]));
    state.maps.socToRows = new Map();
    state.maps.dwaToRows = new Map();

    state.socDwa.forEach((row) => {
      if (!state.maps.socToRows.has(row.soc)) {
        state.maps.socToRows.set(row.soc, []);
      }
      if (!state.maps.dwaToRows.has(row.dwa_id)) {
        state.maps.dwaToRows.set(row.dwa_id, []);
      }
      state.maps.socToRows.get(row.soc).push(row);
      state.maps.dwaToRows.get(row.dwa_id).push(row);
    });
  }

  function computeDerived() {
    const dwas = state.dwas;
    const totalValue = dwas.reduce((sum, row) => sum + row.value, 0);

    const sortedValues = dwas.map((row) => row.value).sort((a, b) => a - b);
    const medianValue = sortedValues.length === 0
      ? 0
      : sortedValues.length % 2 === 1
        ? sortedValues[(sortedValues.length - 1) / 2]
        : (sortedValues[(sortedValues.length / 2) - 1] + sortedValues[sortedValues.length / 2]) / 2;

    const exposure = {};
    EXPOSURE_ORDER.forEach((cat) => {
      exposure[cat] = { value: 0, count: 0 };
    });

    dwas.forEach((row) => {
      if (!exposure[row.ai_cat]) {
        exposure[row.ai_cat] = { value: 0, count: 0 };
      }
      exposure[row.ai_cat].value += row.value;
      exposure[row.ai_cat].count += 1;
    });

    const top100Value = dwas.slice(0, 100).reduce((sum, row) => sum + row.value, 0);
    const top10Value = dwas.slice(0, 10).reduce((sum, row) => sum + row.value, 0);
    const top500Value = dwas.slice(0, 500).reduce((sum, row) => sum + row.value, 0);

    const weightedAi = totalValue > 0
      ? dwas.reduce((sum, row) => sum + row.ai_score * row.value, 0) / totalValue
      : 0;

    const medHighHighValue = (exposure['Medium-High']?.value || 0) + (exposure.High?.value || 0);

    const gwaMap = new Map();
    dwas.forEach((row) => {
      if (!gwaMap.has(row.gwa)) {
        gwaMap.set(row.gwa, { gwa: row.gwa, value: 0, count: 0, weightedAi: 0 });
      }
      const item = gwaMap.get(row.gwa);
      item.value += row.value;
      item.count += 1;
      item.weightedAi += row.ai_score * row.value;
    });

    const gwas = Array.from(gwaMap.values())
      .map((row) => ({
        gwa: row.gwa,
        value: row.value,
        count: row.count,
        share: totalValue > 0 ? (row.value / totalValue) * 100 : 0,
        avg_ai: row.value > 0 ? row.weightedAi / row.value : 0
      }))
      .sort((a, b) => b.value - a.value);

    const pareto = [];
    let cumulative = 0;
    dwas.forEach((row, index) => {
      cumulative += row.value;
      pareto.push({
        rank: index + 1,
        cumulativeShare: totalValue > 0 ? (cumulative / totalValue) * 100 : 0
      });
    });

    const rankBucketCount = 10;
    const bucketSize = Math.ceil(dwas.length / rankBucketCount);
    const rankBuckets = [];

    for (let i = 0; i < rankBucketCount; i += 1) {
      const start = i * bucketSize;
      const end = Math.min((i + 1) * bucketSize, dwas.length);
      if (start >= end) continue;
      const slice = dwas.slice(start, end);
      const value = slice.reduce((sum, row) => sum + row.value, 0);
      rankBuckets.push({
        label: `${start + 1}-${end}`,
        value,
        share: totalValue > 0 ? (value / totalValue) * 100 : 0
      });
    }

    const tiers = [
      { label: 'Top 10', value: dwas.slice(0, 10).reduce((s, row) => s + row.value, 0) },
      { label: '11-50', value: dwas.slice(10, 50).reduce((s, row) => s + row.value, 0) },
      { label: '51-100', value: dwas.slice(50, 100).reduce((s, row) => s + row.value, 0) },
      { label: '101-500', value: dwas.slice(100, 500).reduce((s, row) => s + row.value, 0) },
      { label: '501-2073', value: dwas.slice(500).reduce((s, row) => s + row.value, 0) }
    ].map((row) => ({ ...row, share: totalValue > 0 ? (row.value / totalValue) * 100 : 0 }));

    state.derived = {
      totalValue,
      medianValue,
      top10Share: totalValue > 0 ? (top10Value / totalValue) * 100 : 0,
      top100Share: totalValue > 0 ? (top100Value / totalValue) * 100 : 0,
      top500Share: totalValue > 0 ? (top500Value / totalValue) * 100 : 0,
      weightedAi,
      exposure,
      medHighHighShare: totalValue > 0 ? (medHighHighValue / totalValue) * 100 : 0,
      gwas,
      pareto,
      rankBuckets,
      tiers,
      highValueExposed: dwas.filter((row) => row.ai_score >= 50).sort((a, b) => b.value - a.value),
      lowValueExposed: dwas.filter((row) => row.ai_score < 20).sort((a, b) => b.value - a.value)
    };
  }

  function populateHeaderStats() {
    setText('atlas-stat-total', fmtCurrencyCompact(state.derived.totalValue));
    setText('atlas-stat-dwas', fmtInt(state.dwas.length));
    setText('atlas-stat-occs', fmtInt(state.occs.length));
    setText('atlas-stat-top100', `${fmtPct(state.derived.top100Share, 1)}%`);

    setText('atlas-stat-total-sub', `${fmtInt(state.socDwa.length)} SOC x DWA allocations`);
    setText('atlas-stat-dwas-sub', `${fmtCurrencyCompact(state.derived.medianValue)} median activity value`);
    setText('atlas-stat-occs-sub', `${fmtPct(state.derived.weightedAi, 1)} weighted exposure score`);
    setText('atlas-stat-top100-sub', 'share of wage bill in the top 100 activities');
  }

  function populateNarrative() {
    const exposure = state.derived.exposure;
    const total = state.derived.totalValue;
    const lowShare = total > 0 ? ((exposure.Low?.value || 0) / total) * 100 : 0;
    setText('atlas-insight-total', fmtCurrencyCompact(state.derived.totalValue));
    setText('atlas-insight-mhhigh', `${fmtPct(state.derived.medHighHighShare, 2)}%`);
    setText('atlas-insight-low', `${fmtPct(lowShare, 2)}%`);
    setText('atlas-insight-top10', `${fmtPct(state.derived.top10Share, 1)}%`);
    setText('atlas-insight-top100', `${fmtPct(state.derived.top100Share, 1)}%`);
  }

  function buildFilterControls() {
    const exposureWrap = document.getElementById('atlas-dwa-exposure-filters');
    const taskTypeWrap = document.getElementById('atlas-dwa-tasktype-filters');
    const occExposureWrap = document.getElementById('atlas-occ-exposure-filters');

    if (exposureWrap) {
      const filters = ['all', ...EXPOSURE_ORDER];
      exposureWrap.innerHTML = filters
        .map((filter) => `<button class="atlas-pill${filter === 'all' ? ' active' : ''}" data-dwa-exposure="${escapeHtml(filter)}">${escapeHtml(filter === 'all' ? 'All Exposure' : filter)}</button>`)
        .join('');
    }

    if (occExposureWrap) {
      const filters = ['all', ...EXPOSURE_ORDER];
      occExposureWrap.innerHTML = filters
        .map((filter) => `<button class="atlas-pill${filter === 'all' ? ' active' : ''}" data-occ-exposure="${escapeHtml(filter)}">${escapeHtml(filter === 'all' ? 'All Exposure' : filter)}</button>`)
        .join('');
    }

    if (taskTypeWrap) {
      const types = state.taskTypes.map((row) => row.task_type).filter(Boolean);
      if (types.length <= 1) {
        taskTypeWrap.innerHTML = '<button class="atlas-pill active" disabled>Single task type in current dataset</button>';
      } else {
        const filters = ['all', ...types];
        taskTypeWrap.innerHTML = filters
          .map((filter) => `<button class="atlas-pill${filter === 'all' ? ' active' : ''}" data-dwa-tasktype="${escapeHtml(filter)}">${escapeHtml(filter === 'all' ? 'All Types' : taskTypeLabel(filter))}</button>`)
          .join('');
      }
    }

    document.querySelectorAll('[data-dwa-exposure]').forEach((button) => {
      button.addEventListener('click', () => {
        state.filters.dwa.exposure = button.dataset.dwaExposure || 'all';
        state.filters.dwa.page = 1;
        toggleActiveButtons('[data-dwa-exposure]', button);
        renderActivityTable();
      });
    });

    document.querySelectorAll('[data-dwa-tasktype]').forEach((button) => {
      button.addEventListener('click', () => {
        state.filters.dwa.taskType = button.dataset.dwaTasktype || 'all';
        state.filters.dwa.page = 1;
        toggleActiveButtons('[data-dwa-tasktype]', button);
        renderActivityTable();
      });
    });

    document.querySelectorAll('[data-occ-exposure]').forEach((button) => {
      button.addEventListener('click', () => {
        state.filters.occ.exposure = button.dataset.occExposure || 'all';
        state.filters.occ.page = 1;
        toggleActiveButtons('[data-occ-exposure]', button);
        renderOccupationTable();
      });
    });
  }

  function bindTableControls() {
    const dwaSearch = document.getElementById('atlas-dwa-search');
    const occSearch = document.getElementById('atlas-occ-search');

    if (dwaSearch) {
      dwaSearch.addEventListener('input', () => {
        state.filters.dwa.search = dwaSearch.value.trim().toLowerCase();
        state.filters.dwa.page = 1;
        renderActivityTable();
      });
    }

    if (occSearch) {
      occSearch.addEventListener('input', () => {
        state.filters.occ.search = occSearch.value.trim().toLowerCase();
        state.filters.occ.page = 1;
        renderOccupationTable();
      });
    }

    document.querySelectorAll('th[data-table="dwa"][data-sort]').forEach((header) => {
      header.addEventListener('click', () => {
        const sort = header.dataset.sort;
        if (!sort) return;
        if (state.filters.dwa.sort === sort) {
          state.filters.dwa.asc = !state.filters.dwa.asc;
        } else {
          state.filters.dwa.sort = sort;
          state.filters.dwa.asc = sort === 'title' || sort === 'gwa' || sort === 'task_type';
        }
        renderActivityTable();
      });
    });

    document.querySelectorAll('th[data-table="occ"][data-sort]').forEach((header) => {
      header.addEventListener('click', () => {
        const sort = header.dataset.sort;
        if (!sort) return;
        if (state.filters.occ.sort === sort) {
          state.filters.occ.asc = !state.filters.occ.asc;
        } else {
          state.filters.occ.sort = sort;
          state.filters.occ.asc = sort === 'title' || sort === 'soc';
        }
        renderOccupationTable();
      });
    });

    bindPager('dwa');
    bindPager('occ');
  }

  function bindPager(kind) {
    const prev = document.getElementById(`atlas-${kind}-prev`);
    const next = document.getElementById(`atlas-${kind}-next`);

    if (prev) {
      prev.addEventListener('click', () => {
        state.filters[kind].page -= 1;
        if (state.filters[kind].page < 1) state.filters[kind].page = 1;
        kind === 'dwa' ? renderActivityTable() : renderOccupationTable();
      });
    }

    if (next) {
      next.addEventListener('click', () => {
        state.filters[kind].page += 1;
        kind === 'dwa' ? renderActivityTable() : renderOccupationTable();
      });
    }
  }

  function getFilteredDwas() {
    const filter = state.filters.dwa;

    const rows = state.dwas.filter((row) => {
      if (filter.exposure !== 'all' && row.ai_cat !== filter.exposure) return false;
      if (filter.taskType !== 'all' && row.task_type !== filter.taskType) return false;

      if (filter.search) {
        const hay = `${row.title} ${row.gwa} ${row.id}`.toLowerCase();
        if (!hay.includes(filter.search)) return false;
      }
      return true;
    });

    rows.sort((a, b) => compareRows(a, b, filter.sort, filter.asc));
    return rows;
  }

  function getFilteredOccs() {
    const filter = state.filters.occ;

    const rows = state.occs.filter((row) => {
      if (filter.exposure !== 'all' && row.ai_cat !== filter.exposure) return false;

      if (filter.search) {
        const hay = `${row.title} ${row.soc} ${row.top_dwa}`.toLowerCase();
        if (!hay.includes(filter.search)) return false;
      }
      return true;
    });

    rows.sort((a, b) => compareRows(a, b, filter.sort, filter.asc));
    return rows;
  }

  function compareRows(a, b, sort, asc) {
    const dir = asc ? 1 : -1;
    const aVal = a[sort];
    const bVal = b[sort];

    if (typeof aVal === 'string' || typeof bVal === 'string') {
      return String(aVal || '').localeCompare(String(bVal || '')) * dir;
    }
    return (toNumber(aVal) - toNumber(bVal)) * dir;
  }

  function renderActivityTable() {
    const rows = getFilteredDwas();
    const tbody = document.getElementById('atlas-dwa-tbody');
    const count = document.getElementById('atlas-dwa-count');

    if (!tbody) return;

    if (count) {
      count.textContent = `Showing ${fmtInt(rows.length)} activities (${fmtCurrencyCompact(rows.reduce((sum, row) => sum + row.value, 0))})`;
    }

    updateSortHeader('dwa', state.filters.dwa.sort, state.filters.dwa.asc);

    const { pageRows, start, end, page, pageCount } = paginateRows(rows, state.filters.dwa);

    tbody.innerHTML = pageRows.map((row) => {
      const dot = `<span class="atlas-exposure-dot" style="background:${EXPOSURE_COLORS[row.ai_cat] || '#8791a1'}"></span>`;
      return `
        <tr>
          <td class="num">${fmtInt(row.rank)}</td>
          <td>
            <span class="clickable" data-open-dwa="${escapeHtml(row.id)}">${escapeHtml(row.title)}</span>
            <div style="margin-top:2px;color:#778193;font-size:0.76rem;">${escapeHtml(row.id)}</div>
          </td>
          <td>${escapeHtml(row.gwa)}</td>
          <td class="num">${fmtCurrencyCompact(row.value)}</td>
          <td class="num">${fmtPct(row.share, 3)}%</td>
          <td>${dot}${fmtPct(row.ai_score, 1)} <span style="color:#7a8392;font-size:0.78rem;">(${escapeHtml(row.ai_cat)})</span></td>
          <td><span class="atlas-badge">${escapeHtml(taskTypeLabel(row.task_type))}</span></td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-open-dwa]').forEach((el) => {
      el.addEventListener('click', () => openDwaModal(el.dataset.openDwa || ''));
    });

    updatePager('dwa', { start, end, total: rows.length, page, pageCount });
  }

  function renderOccupationTable() {
    const rows = getFilteredOccs();
    const tbody = document.getElementById('atlas-occ-tbody');
    const count = document.getElementById('atlas-occ-count');

    if (!tbody) return;

    if (count) {
      count.textContent = `Showing ${fmtInt(rows.length)} occupations`;
    }

    updateSortHeader('occ', state.filters.occ.sort, state.filters.occ.asc);

    const { pageRows, start, end, page, pageCount } = paginateRows(rows, state.filters.occ);

    tbody.innerHTML = pageRows.map((row) => {
      const dot = `<span class="atlas-exposure-dot" style="background:${EXPOSURE_COLORS[row.ai_cat] || '#8791a1'}"></span>`;
      return `
        <tr>
          <td>
            <span class="clickable" data-open-occ="${escapeHtml(row.soc)}">${escapeHtml(row.title)}</span>
            <div style="margin-top:2px;color:#778193;font-size:0.76rem;">${escapeHtml(row.soc)}</div>
          </td>
          <td class="num">${fmtInt(row.emp)}</td>
          <td class="num">${fmtCurrency(row.mean_wage)}</td>
          <td class="num">${fmtCurrencyCompact(row.wage_bill)}</td>
          <td>${dot}${fmtPct(row.ai_score, 1)} <span style="color:#7a8392;font-size:0.78rem;">(${escapeHtml(row.ai_cat)})</span></td>
          <td class="num">${fmtPct(row.high_pct, 2)}%</td>
          <td>${escapeHtml(row.top_dwa || '—')}</td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-open-occ]').forEach((el) => {
      el.addEventListener('click', () => openOccModal(el.dataset.openOcc || ''));
    });

    updatePager('occ', { start, end, total: rows.length, page, pageCount });
  }

  function paginateRows(rows, filter) {
    const pageCount = Math.max(1, Math.ceil(rows.length / filter.perPage));
    if (filter.page > pageCount) filter.page = pageCount;
    if (filter.page < 1) filter.page = 1;

    const start = rows.length === 0 ? 0 : (filter.page - 1) * filter.perPage + 1;
    const end = Math.min(rows.length, filter.page * filter.perPage);
    const pageRows = rows.slice(start > 0 ? start - 1 : 0, end);

    return { pageRows, start, end, page: filter.page, pageCount };
  }

  function updatePager(kind, info) {
    setText(`atlas-${kind}-page`, `Page ${info.page} of ${info.pageCount} (${fmtInt(info.start)}-${fmtInt(info.end)} of ${fmtInt(info.total)})`);

    const prev = document.getElementById(`atlas-${kind}-prev`);
    const next = document.getElementById(`atlas-${kind}-next`);

    if (prev) prev.disabled = info.page <= 1;
    if (next) next.disabled = info.page >= info.pageCount;
  }

  function updateSortHeader(kind, sort, asc) {
    const headers = document.querySelectorAll(`th[data-table="${kind}"][data-sort]`);

    headers.forEach((header) => {
      const active = header.dataset.sort === sort;
      header.classList.toggle('active-sort', active);

      const indicator = header.querySelector('.sort-indicator');
      if (!indicator) return;

      if (active) {
        indicator.textContent = asc ? '↑' : '↓';
      } else {
        indicator.textContent = '';
      }
    });
  }

  function renderLists() {
    const highList = document.getElementById('atlas-high-exposed-list');
    const lowList = document.getElementById('atlas-low-exposed-list');

    if (highList) {
      const rows = state.derived.highValueExposed.slice(0, 12);
      highList.innerHTML = renderList(rows, 'high');
    }

    if (lowList) {
      const rows = state.derived.lowValueExposed.slice(0, 12);
      lowList.innerHTML = renderList(rows, 'low');
    }
  }

  function renderList(rows, kind) {
    if (!rows.length) {
      return `<p style="font-size:0.9rem;color:#66707f;">No ${kind === 'high' ? 'high-exposure' : 'low-exposure'} activities in the current data slice.</p>`;
    }

    return `
      <ul class="atlas-list">
        ${rows.map((row) => `
          <li>
            <div class="label">${escapeHtml(row.title)}</div>
            <div class="value"><strong>${fmtCurrencyCompact(row.value)}</strong><br>${fmtPct(row.ai_score, 1)} exposure</div>
          </li>
        `).join('')}
      </ul>
    `;
  }

  function renderCharts() {
    if (typeof Chart === 'undefined') return;

    Chart.defaults.color = '#5f6877';
    Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    Chart.defaults.borderColor = 'rgba(0,0,0,0.08)';

    renderOverviewCharts();
    renderExposureCharts();
    renderConcentrationCharts();
  }

  function renderOverviewCharts() {
    const exposureValues = EXPOSURE_ORDER.map((cat) => state.derived.exposure[cat]?.value || 0);

    updateChart('overviewExposure', 'atlas-overview-exposure-chart', {
      type: 'doughnut',
      data: {
        labels: EXPOSURE_ORDER.map((cat) => cat),
        datasets: [{
          data: exposureValues,
          backgroundColor: EXPOSURE_ORDER.map((cat) => EXPOSURE_COLORS[cat]),
          borderWidth: 0
        }]
      },
      options: doughnutOptions((ctx) => {
        const value = ctx.raw;
        const share = state.derived.totalValue > 0 ? (value / state.derived.totalValue) * 100 : 0;
        return `${ctx.label}: ${fmtCurrencyCompact(value)} (${fmtPct(share, 2)}%)`;
      })
    });

    const top20 = state.dwas.slice(0, 20).reverse();
    updateChart('overviewTopDwa', 'atlas-overview-topdwa-chart', {
      type: 'bar',
      data: {
        labels: top20.map((row) => truncate(row.title, 38)),
        datasets: [{
          data: top20.map((row) => row.value),
          borderWidth: 1,
          borderColor: top20.map((row) => EXPOSURE_COLORS[row.ai_cat] || '#8791a1'),
          backgroundColor: top20.map((row) => hexToRgba(EXPOSURE_COLORS[row.ai_cat] || '#8791a1', 0.5)),
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(ctx) {
                const row = top20[ctx.dataIndex];
                return `${fmtCurrencyCompact(ctx.raw)} | exposure ${fmtPct(row.ai_score, 1)} (${row.ai_cat})`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              callback(value) {
                return fmtCurrencyCompact(value);
              }
            }
          }
        }
      }
    });

    const typePalette = ['#111111', '#374151', '#596273', '#8791a1', '#a7b0bd', '#c2c9d4', '#d6dbe3'];
    const taskTypes = Array.from(new Set(state.dwas.map((row) => row.task_type || 'unspecified')));
    const typeColors = new Map(taskTypes.map((type, index) => [type, typePalette[index % typePalette.length]]));

    const datasets = taskTypes.map((type) => {
      const rows = state.dwas.filter((row) => (row.task_type || 'unspecified') === type);
      const color = typeColors.get(type) || '#8791a1';

      return {
        label: taskTypeLabel(type),
        data: rows.map((row) => ({
          x: row.ai_score,
          y: row.value / 1e9,
          r: Math.max(2, Math.sqrt(row.value / 1e9) * 1.35),
          title: row.title,
          value: row.value,
          type: taskTypeLabel(type)
        })),
        backgroundColor: hexToRgba(color, 0.35),
        borderColor: color,
        borderWidth: 1
      };
    }).filter((set) => set.data.length > 0);

    updateChart('overviewScatter', 'atlas-overview-scatter-chart', {
      type: 'bubble',
      data: { datasets },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, boxWidth: 10 }
          },
          tooltip: {
            callbacks: {
              label(ctx) {
                const raw = ctx.raw;
                return `${raw.title}: ${fmtCurrencyCompact(raw.value)} | exposure ${fmtPct(raw.x, 1)} | ${raw.type}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'LLM task exposure score' },
            min: 0,
            max: 100
          },
          y: {
            title: { display: true, text: 'Activity value (billions of dollars)' }
          }
        }
      }
    });

    const topGwas = state.derived.gwas.slice(0, 12).reverse();
    updateChart('overviewGwa', 'atlas-overview-gwa-chart', {
      type: 'bar',
      data: {
        labels: topGwas.map((row) => truncate(row.gwa, 40)),
        datasets: [{
          data: topGwas.map((row) => row.value),
          backgroundColor: '#8791a1',
          borderColor: '#596273',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(ctx) {
                const row = topGwas[ctx.dataIndex];
                return `${fmtCurrencyCompact(ctx.raw)} (${fmtPct(row.share, 2)}% of total)`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              callback(value) {
                return fmtCurrencyCompact(value);
              }
            }
          }
        }
      }
    });
  }

  function renderExposureCharts() {
    const exposure = state.derived.exposure;
    const categories = EXPOSURE_ORDER;
    const values = categories.map((cat) => exposure[cat]?.value || 0);
    const counts = categories.map((cat) => exposure[cat]?.count || 0);

    updateChart('exposureWage', 'atlas-exposure-wage-chart', {
      type: 'bar',
      data: {
        labels: categories.map((cat) => EXPOSURE_LEGEND_LABEL[cat] || cat),
        datasets: [{
          label: 'Wage bill',
          data: values,
          backgroundColor: categories.map((cat) => EXPOSURE_COLORS[cat])
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(ctx) {
                const share = state.derived.totalValue > 0 ? (ctx.raw / state.derived.totalValue) * 100 : 0;
                return `${fmtCurrencyCompact(ctx.raw)} (${fmtPct(share, 2)}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback(value) {
                return fmtCurrencyCompact(value);
              }
            }
          }
        }
      }
    });

    updateChart('exposureCount', 'atlas-exposure-count-chart', {
      type: 'bar',
      data: {
        labels: categories.map((cat) => EXPOSURE_LEGEND_LABEL[cat] || cat),
        datasets: [{
          label: 'Activity count',
          data: counts,
          backgroundColor: categories.map((cat) => hexToRgba(EXPOSURE_COLORS[cat], 0.78))
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });

    const sorted = [...state.dwas].sort((a, b) => b.ai_score - a.ai_score);
    updateChart('exposureSpectrum', 'atlas-exposure-spectrum-chart', {
      type: 'line',
      data: {
        labels: sorted.map((_, index) => index + 1),
        datasets: [{
          data: sorted.map((row) => row.ai_score),
          borderColor: '#1f2933',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.18,
          fill: false
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title(items) {
                if (!items.length) return '';
                const idx = items[0].dataIndex;
                return sorted[idx].title;
              },
              label(ctx) {
                const row = sorted[ctx.dataIndex];
                return `Rank ${ctx.dataIndex + 1}: exposure ${fmtPct(row.ai_score, 1)} | ${fmtCurrencyCompact(row.value)}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Activities sorted by exposure rank' }
          },
          y: {
            min: 0,
            max: 100,
            title: { display: true, text: 'Exposure score' }
          }
        }
      }
    });
  }

  function renderConcentrationCharts() {
    const pareto = state.derived.pareto;
    updateChart('concentrationPareto', 'atlas-concentration-pareto-chart', {
      type: 'line',
      data: {
        labels: pareto.map((row) => row.rank),
        datasets: [{
          label: 'Cumulative wage share',
          data: pareto.map((row) => row.cumulativeShare),
          borderColor: '#111111',
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.15
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(ctx) {
                return `${fmtPct(ctx.raw, 2)}% cumulative share`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Activity rank by value' }
          },
          y: {
            min: 0,
            max: 100,
            title: { display: true, text: 'Cumulative share (%)' }
          }
        }
      }
    });

    const tiers = state.derived.tiers;
    updateChart('concentrationTier', 'atlas-concentration-tier-chart', {
      type: 'doughnut',
      data: {
        labels: tiers.map((row) => row.label),
        datasets: [{
          data: tiers.map((row) => row.value),
          backgroundColor: ['#111111', '#303843', '#596273', '#8791a1', '#b8c0cd'],
          borderWidth: 0
        }]
      },
      options: doughnutOptions((ctx) => {
        const tier = tiers[ctx.dataIndex];
        return `${tier.label}: ${fmtCurrencyCompact(tier.value)} (${fmtPct(tier.share, 2)}%)`;
      })
    });

    const buckets = state.derived.rankBuckets;
    updateChart('concentrationBucket', 'atlas-concentration-bucket-chart', {
      type: 'bar',
      data: {
        labels: buckets.map((row) => row.label),
        datasets: [{
          data: buckets.map((row) => row.share),
          backgroundColor: '#8791a1',
          borderColor: '#596273',
          borderWidth: 1
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(ctx) {
                const row = buckets[ctx.dataIndex];
                return `${row.label}: ${fmtPct(row.share, 2)}% (${fmtCurrencyCompact(row.value)})`;
              }
            }
          }
        },
        scales: {
          y: {
            title: { display: true, text: 'Share of wage bill (%)' }
          },
          x: {
            title: { display: true, text: 'Value rank bucket' }
          }
        }
      }
    });
  }

  function doughnutOptions(labelCallback) {
    return {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, boxWidth: 10 }
        },
        tooltip: {
          callbacks: {
            label: labelCallback
          }
        }
      }
    };
  }

  function updateChart(key, canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (state.charts[key]) {
      state.charts[key].destroy();
    }

    state.charts[key] = new Chart(canvas, config);
  }

  function resizeAllCharts() {
    Object.values(state.charts).forEach((chart) => {
      if (chart && typeof chart.resize === 'function') {
        chart.resize();
      }
    });
  }

  function bindTabs() {
    const tabs = document.querySelectorAll('.atlas-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.panel;
        if (!target) return;

        tabs.forEach((item) => {
          item.classList.remove('active');
          item.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.atlas-panel').forEach((panel) => panel.classList.remove('active'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const panel = document.getElementById(target);
        if (panel) panel.classList.add('active');
        setTimeout(resizeAllCharts, 60);
      });
    });
  }

  function bindModals() {
    const overlays = document.querySelectorAll('.atlas-modal-overlay');
    overlays.forEach((overlay) => {
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
          closeModal(overlay.id);
        }
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach((button) => {
      button.addEventListener('click', () => {
        closeModal(button.dataset.closeModal || '');
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeModal('atlas-dwa-modal');
        closeModal('atlas-occ-modal');
      }
    });
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function openDwaModal(dwaId) {
    const dwa = state.maps.dwa.get(dwaId);
    if (!dwa) return;

    const rows = [...(state.maps.dwaToRows.get(dwa.id) || [])].sort((a, b) => b.value - a.value);
    const topRows = rows.slice(0, 30);
    const totalMapped = rows.reduce((sum, row) => sum + row.value, 0);

    setText('atlas-dwa-modal-title', `${dwa.title} (${dwa.id})`);

    const body = document.getElementById('atlas-dwa-modal-body');
    if (!body) return;

    body.innerHTML = `
      <div class="atlas-mini-grid">
        <div class="atlas-mini">
          <div class="k">Economy value</div>
          <div class="v">${fmtCurrencyCompact(dwa.value)}</div>
        </div>
        <div class="atlas-mini">
          <div class="k">Share of wage bill</div>
          <div class="v">${fmtPct(dwa.share, 3)}%</div>
        </div>
        <div class="atlas-mini">
          <div class="k">Exposure</div>
          <div class="v">${fmtPct(dwa.ai_score, 1)} (${dwa.ai_cat})</div>
        </div>
      </div>

      <p style="margin-bottom:0.65rem;color:#66707f;font-size:0.9rem;">Category: <strong>${escapeHtml(dwa.gwa)}</strong> | Task type: <strong>${escapeHtml(taskTypeLabel(dwa.task_type))}</strong></p>

      <div class="atlas-card" style="margin-bottom:0;">
        <h2>Top Occupation Contributors</h2>
        <p style="margin-bottom:0.6rem;">${fmtInt(rows.length)} occupations map to this activity (${fmtCurrencyCompact(totalMapped)} allocated across mapped rows).</p>
        <div class="atlas-table-wrap" style="max-height:420px;">
          <table class="atlas-table" style="min-width:700px;">
            <thead>
              <tr>
                <th>Occupation</th>
                <th class="num">Allocation</th>
                <th class="num">Within Occupation Share</th>
                <th class="num">Occupation Exposure</th>
              </tr>
            </thead>
            <tbody>
              ${topRows.map((row) => {
                const occ = state.maps.occ.get(row.soc);
                return `
                  <tr>
                    <td><span class="clickable" data-open-occ="${escapeHtml(row.soc)}">${escapeHtml(occ ? occ.title : row.soc)}</span><div style="font-size:0.75rem;color:#778193;">${escapeHtml(row.soc)}</div></td>
                    <td class="num">${fmtCurrencyCompact(row.value)}</td>
                    <td class="num">${fmtPct(row.dwa_share * 100, 2)}%</td>
                    <td class="num">${fmtPct(occ ? occ.ai_score : 0, 1)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    body.querySelectorAll('[data-open-occ]').forEach((el) => {
      el.addEventListener('click', () => {
        closeModal('atlas-dwa-modal');
        openOccModal(el.dataset.openOcc || '');
      });
    });

    openModal('atlas-dwa-modal');
  }

  function openOccModal(soc) {
    const occ = state.maps.occ.get(soc);
    if (!occ) return;

    const rows = [...(state.maps.socToRows.get(soc) || [])].sort((a, b) => b.value - a.value);
    const topRows = rows.slice(0, 40);

    setText('atlas-occ-modal-title', `${occ.title} (${occ.soc})`);

    const body = document.getElementById('atlas-occ-modal-body');
    if (!body) return;

    body.innerHTML = `
      <div class="atlas-mini-grid">
        <div class="atlas-mini">
          <div class="k">Employment</div>
          <div class="v">${fmtInt(occ.emp)}</div>
        </div>
        <div class="atlas-mini">
          <div class="k">Mean wage</div>
          <div class="v">${fmtCurrency(occ.mean_wage)}</div>
        </div>
        <div class="atlas-mini">
          <div class="k">Wage bill</div>
          <div class="v">${fmtCurrencyCompact(occ.wage_bill)}</div>
        </div>
      </div>

      <p style="margin-bottom:0.65rem;color:#66707f;font-size:0.9rem;">Exposure: <strong>${fmtPct(occ.ai_score, 1)} (${occ.ai_cat})</strong> | High-exposure share: <strong>${fmtPct(occ.high_pct, 2)}%</strong></p>

      <div class="atlas-card" style="margin-bottom:0;">
        <h2>Top Activities In Occupation</h2>
        <p style="margin-bottom:0.6rem;">${fmtInt(rows.length)} activities mapped for this occupation.</p>
        <div class="atlas-table-wrap" style="max-height:420px;">
          <table class="atlas-table" style="min-width:760px;">
            <thead>
              <tr>
                <th>Activity</th>
                <th>GWA</th>
                <th class="num">Allocation</th>
                <th class="num">Within Occupation Share</th>
                <th class="num">Exposure</th>
              </tr>
            </thead>
            <tbody>
              ${topRows.map((row) => {
                const dwa = state.maps.dwa.get(row.dwa_id);
                return `
                  <tr>
                    <td>${escapeHtml(dwa ? dwa.title : row.dwa_id)}<div style="font-size:0.75rem;color:#778193;">${escapeHtml(row.dwa_id)}</div></td>
                    <td>${escapeHtml(dwa ? dwa.gwa : '—')}</td>
                    <td class="num">${fmtCurrencyCompact(row.value)}</td>
                    <td class="num">${fmtPct(row.dwa_share * 100, 2)}%</td>
                    <td class="num">${fmtPct(dwa ? dwa.ai_score : 0, 1)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    openModal('atlas-occ-modal');
  }

  async function loadMethods() {
    const methodsTarget = document.getElementById('atlas-methods-content');
    const notesTarget = document.getElementById('atlas-methods-data-notes');

    if (!methodsTarget) return;

    const notes = [
      `Task Atlas activity-level dataset (DWA economy values, SOC x DWA allocations, SOC x DWA exposure, and SOC wage/employment aggregates)`,
      `Source data: O*NET v30.1 Detailed Work Activities and task ratings/crosswalk data`,
      `BLS OEWS May 2024 national wage and employment estimates`,
      `GPTs-are-GPTs task-level LLM exposure label set`,
      `${fmtInt(state.dwas.length)} activities, ${fmtInt(state.occs.length)} occupations, and ${fmtInt(state.socDwa.length)} SOC x DWA allocation rows`,
      `Total mapped wage bill: ${fmtCurrencyCompact(state.derived.totalValue)} | Top 100 activity share: ${fmtPct(state.derived.top100Share, 2)}%`
    ];

    if (notesTarget) {
      notesTarget.innerHTML = `
        <ul class="atlas-list">
          ${notes.map((line) => `<li><div class="label">${escapeHtml(line)}</div></li>`).join('')}
        </ul>
      `;
    }

    try {
      const response = await fetch(METHODS_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      methodsTarget.innerHTML = markdownToHtml(text);
    } catch (error) {
      console.error('Failed to load methods markdown:', error);
      methodsTarget.innerHTML = `
        <p>Method notes could not be loaded from <code>${escapeHtml(METHODS_URL)}</code>, so a fallback summary is shown.</p>
        <h2>Method Summary</h2>
        <p>Task Atlas starts at activity-level mappings (DWAs), allocates occupation wage bills into those activities using weighted task shares, and then computes exposure metrics from GPTs-are-GPTs task labels. It should be interpreted as a capability map, not a direct job-loss forecast.</p>
      `;
    }
  }

  function markdownToHtml(markdown) {
    const lines = markdown.replace(/\r/g, '').split('\n');
    let html = '';
    let inUl = false;
    let inOl = false;

    const closeLists = () => {
      if (inUl) {
        html += '</ul>';
        inUl = false;
      }
      if (inOl) {
        html += '</ol>';
        inOl = false;
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        closeLists();
        return;
      }

      if (/^---+$/.test(trimmed)) {
        closeLists();
        return;
      }

      const h1 = trimmed.match(/^#\s+(.*)$/);
      if (h1) {
        closeLists();
        html += `<h1>${formatInline(h1[1])}</h1>`;
        return;
      }

      const h2 = trimmed.match(/^##\s+(.*)$/);
      if (h2) {
        closeLists();
        html += `<h2>${formatInline(h2[1])}</h2>`;
        return;
      }

      const h3 = trimmed.match(/^###\s+(.*)$/);
      if (h3) {
        closeLists();
        html += `<h3>${formatInline(h3[1])}</h3>`;
        return;
      }

      const ol = trimmed.match(/^\d+\.\s+(.*)$/);
      if (ol) {
        if (!inOl) {
          closeLists();
          html += '<ol>';
          inOl = true;
        }
        html += `<li>${formatInline(ol[1])}</li>`;
        return;
      }

      const ul = trimmed.match(/^-\s+(.*)$/);
      if (ul) {
        if (!inUl) {
          closeLists();
          html += '<ul>';
          inUl = true;
        }
        html += `<li>${formatInline(ul[1])}</li>`;
        return;
      }

      closeLists();
      html += `<p>${formatInline(trimmed)}</p>`;
    });

    closeLists();
    return html;
  }

  function formatInline(text) {
    const escaped = escapeHtml(text);
    return escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  function toggleActiveButtons(selector, activeButton) {
    document.querySelectorAll(selector).forEach((button) => {
      button.classList.remove('active');
    });
    activeButton.classList.add('active');
  }

  function taskTypeLabel(raw) {
    return String(raw || '')
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Unspecified';
  }

  function truncate(text, max) {
    if (!text || text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    const int = Number.parseInt(clean, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function fmtCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(toNumber(value));
  }

  function fmtCurrencyCompact(value) {
    const num = toNumber(value);
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
    return fmtCurrency(num);
  }

  function fmtInt(value) {
    return new Intl.NumberFormat('en-US').format(Math.round(toNumber(value)));
  }

  function fmtPct(value, digits = 1) {
    return toNumber(value).toFixed(digits);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setStatus(status, message) {
    const loading = document.getElementById('atlas-loading');
    const error = document.getElementById('atlas-error');

    if (loading) loading.style.display = status === 'loading' ? 'block' : 'none';
    if (error) {
      error.style.display = status === 'error' ? 'block' : 'none';
      if (status === 'error') {
        error.textContent = message ? `Task Atlas failed to load: ${message}` : 'Task Atlas failed to load.';
      }
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
