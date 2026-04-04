import './style.css';
import { METRICS } from './data.js';
import { state } from './state.js';
import { initMap } from './map.js';
import { initCharts } from './charts.js';
import { initSidebar } from './sidebar.js';
import { initViews } from './views.js';

async function main() {
  // ── Map ───────────────────────────────────────────────────────────────────
  await initMap(document.getElementById('map-container'));

  // ── Sidebar ───────────────────────────────────────────────────────────────
  initSidebar(document.getElementById('sidebar'));
  initSidebar(document.getElementById('build-panel')); // mobile Build view

  // ── Charts ────────────────────────────────────────────────────────────────
  initCharts(document.getElementById('charts-area'));


  // ── Metrics toggles ───────────────────────────────────────────────────────
  const metricsToggles = document.getElementById('metrics-toggles');
  METRICS.forEach(metric => {
    const label = document.createElement('label');
    label.className = 'metric-toggle';
    const cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.checked = state.activeMetrics.includes(metric.key);
    cb.onchange = () => {
      state.toggleMetric(metric.key);
      renderFormulaInputs();
    };
    label.appendChild(cb);
    label.appendChild(document.createTextNode(metric.label));
    metricsToggles.appendChild(label);
  });

  // ── Balance score ─────────────────────────────────────────────────────────
  const balanceEl = document.getElementById('balance-score');
  function updateBalance() {
    const score = state.overallBalance();
    if (score === null) { balanceEl.textContent = ''; return; }
    const pct = Math.round(score * 100);
    const cls = pct >= 80 ? 'balance-good' : pct >= 55 ? 'balance-ok' : 'balance-poor';
    balanceEl.innerHTML = `Equilibrium: <span class="${cls}">${pct}%</span>`;
  }
  state.on('assignments-changed', updateBalance);
  state.on('groups-changed',      updateBalance);
  state.on('metrics-changed',     updateBalance);
  state.on('countries-changed',   updateBalance);

  // ── Formula builder ───────────────────────────────────────────────────────
  const formulaBar    = document.getElementById('formula-bar');
  const formulaInputs = document.getElementById('formula-inputs');
  const formulaToggle = document.getElementById('formula-toggle');
  const formulaReset  = document.getElementById('formula-reset');
  const formulaScore  = document.getElementById('formula-score');

  function renderFormulaInputs() {
    formulaInputs.innerHTML = '';
    METRICS.filter(m => state.activeMetrics.includes(m.key)).forEach(metric => {
      const wrap = document.createElement('label');
      wrap.className = 'formula-weight-label';

      const name = document.createElement('span');
      name.textContent = metric.label;

      const inp = document.createElement('input');
      inp.type  = 'number';
      inp.className = 'formula-weight-input';
      inp.min   = '0';
      inp.max   = '10';
      inp.step  = '0.1';
      inp.value = state.formulaWeights[metric.key].toFixed(1);
      inp.oninput = () => {
        state.setFormulaWeight(metric.key, parseFloat(inp.value) || 0);
        updateFormulaScore();
      };

      wrap.appendChild(name);
      wrap.appendChild(inp);
      formulaInputs.appendChild(wrap);
    });
  }

  function updateFormulaScore() {
    const score = state.compositeBalance();
    if (score === null) { formulaScore.textContent = ''; return; }
    const pct = Math.round(score * 100);
    const cls = pct >= 80 ? 'balance-good' : pct >= 55 ? 'balance-ok' : 'balance-poor';
    formulaScore.innerHTML = `Composite balance: <span class="${cls}">${pct}%</span>`;
  }

  state.on('assignments-changed', updateFormulaScore);
  state.on('groups-changed',      updateFormulaScore);
  state.on('countries-changed',   updateFormulaScore);
  state.on('formula-changed',     updateFormulaScore);


  formulaToggle.addEventListener('click', () => {
    const hidden = formulaBar.classList.toggle('hidden');
    formulaToggle.classList.toggle('active', !hidden);
    if (!hidden) renderFormulaInputs();
  });

  formulaReset.addEventListener('click', () => {
    state.resetFormulaWeights();
    renderFormulaInputs();
  });

  // ── Flag overlay (desktop, draggable, top-left of map) ───────────────────
  const flagOverlay     = document.getElementById('flag-overlay');
  const flagOverlayBody = document.getElementById('flag-overlay-body');
  const flagToggle      = document.getElementById('flag-overlay-toggle');
  let flagCollapsed     = false;

  function updateFlagOverlay() {
    flagOverlayBody.innerHTML = '';
    state.groups.forEach(g => {
      const countries = state.getAllActiveCountries().filter(c => state.assignments[c.id] === g.id);
      if (!countries.length) return;
      const row = document.createElement('div');
      row.className = 'flag-summary-row';
      row.innerHTML = `<span class="flag-summary-name" style="color:${g.color}">${g.name}</span>`
        + `<div class="flag-summary-flags">`
        + countries.map(c => `<span class="flag-entry"><span class="flag-emoji">${c.flag || ''}</span><span class="flag-code">${c.code}</span></span>`).join('')
        + `</div>`;
      flagOverlayBody.appendChild(row);
    });
    if (window.twemoji) twemoji.parse(flagOverlayBody, { folder: 'svg', ext: '.svg' });
  }

  flagToggle.addEventListener('click', e => {
    e.stopPropagation();
    flagCollapsed = !flagCollapsed;
    flagOverlayBody.style.display = flagCollapsed ? 'none' : '';
    flagToggle.textContent = flagCollapsed ? '+' : '−';
  });

  // Drag via pointer events (delta-based so container offset doesn't matter)
  let dragging = false, dragX = 0, dragY = 0, startLeft = 0, startTop = 0;
  const handle = document.getElementById('flag-overlay-handle');
  handle.addEventListener('pointerdown', e => {
    if (e.target === flagToggle) return; // clicking toggle shouldn't start drag
    dragging  = true;
    dragX     = e.clientX;
    dragY     = e.clientY;
    startLeft = flagOverlay.offsetLeft;
    startTop  = flagOverlay.offsetTop;
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', e => {
    if (!dragging) return;
    flagOverlay.style.left = (startLeft + e.clientX - dragX) + 'px';
    flagOverlay.style.top  = (startTop  + e.clientY - dragY) + 'px';
  });
  handle.addEventListener('pointerup', () => { dragging = false; });

  state.on('assignments-changed', updateFlagOverlay);
  state.on('groups-changed',      updateFlagOverlay);
  state.on('countries-changed',   updateFlagOverlay);
  updateFlagOverlay();

  // ── Views (mobile tab bar) ────────────────────────────────────────────────
  initViews();

  // ── Charts fullscreen (mobile) ────────────────────────────────────────────
  const chartsFullscreenBtn = document.getElementById('charts-fullscreen-btn');
  chartsFullscreenBtn.addEventListener('click', () => {
    const expanded = document.getElementById('app').classList.toggle('charts-expanded');
    chartsFullscreenBtn.textContent = expanded ? '✕' : '⛶';
    chartsFullscreenBtn.title = expanded ? 'Collapse charts' : 'Expand charts';
  });

  // ── Sidebar toggle ────────────────────────────────────────────────────────
  const app           = document.getElementById('app');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  sidebarToggle.addEventListener('click', () => {
    const collapsed = app.classList.toggle('sidebar-collapsed');
    sidebarToggle.textContent = collapsed ? '›' : '‹';
    sidebarToggle.title = collapsed ? 'Show sidebar' : 'Hide sidebar';
  });

  // ── Sources modal ─────────────────────────────────────────────────────────
  const sourcesModal = document.getElementById('sources-modal');
  document.getElementById('sources-btn').addEventListener('click',  () => sourcesModal.classList.remove('hidden'));
  document.getElementById('sources-close').addEventListener('click', () => sourcesModal.classList.add('hidden'));
  sourcesModal.addEventListener('click', e => { if (e.target === sourcesModal) sourcesModal.classList.add('hidden'); });

}

main().catch(console.error);
