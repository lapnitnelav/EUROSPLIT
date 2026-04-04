import * as d3 from 'd3';
import { METRICS } from './data.js';
import { state } from './state.js';

const UNASSIGNED_COLOR = '#2a3f55';


export function initCharts(container) {
  function getGroupSlices(metricKey) {
    const active = state.getAllActiveCountries();
    const slices = state.groups.map(g => ({
      label: g.name,
      value: active.filter(c => state.assignments[c.id] === g.id)
                   .reduce((s, c) => s + (c[metricKey] || 0), 0),
      color: g.color,
      id:    g.id,
    }));
    const unassigned = active
      .filter(c => !state.assignments[c.id])
      .reduce((s, c) => s + (c[metricKey] || 0), 0);
    if (unassigned > 0) {
      slices.push({ label: 'Unassigned', value: unassigned, color: UNASSIGNED_COLOR, id: null });
    }
    return slices;
  }

  function renderDonut(card, slices, total, centerText, centerColor) {
    const SIZE   = 150;
    const RADIUS = SIZE / 2 - 8;
    const INNER  = RADIUS * 0.45;

    const svg = card.append('svg').attr('width', SIZE).attr('height', SIZE);
    const g   = svg.append('g').attr('transform', `translate(${SIZE / 2},${SIZE / 2})`);

    if (total === 0 || state.groups.length === 0) {
      g.append('text')
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('fill', '#64748b').attr('font-size', '11px').text('No data');
      return;
    }

    const pie  = d3.pie().value(d => d.value).sort(null);
    const arc  = d3.arc().innerRadius(INNER).outerRadius(RADIUS);
    const arcH = d3.arc().innerRadius(INNER).outerRadius(RADIUS + 5);

    g.selectAll('.arc')
      .data(pie(slices))
      .join('g').attr('class', 'arc')
      .append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#0f1923').attr('stroke-width', 1.5)
      .on('mouseover', function () { d3.select(this).attr('d', arcH); })
      .on('mouseout',  function () { d3.select(this).attr('d', arc); });

    if (centerText) {
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', '-6')
        .attr('fill', centerColor || '#fff')
        .attr('font-size', '13px').attr('font-weight', '700')
        .text(centerText);
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', '10')
        .attr('fill', 'rgba(255,255,255,0.4)')
        .attr('font-size', '8px')
        .text('balance');
    }
  }

  function renderLegend(card, slices, total, formatFn) {
    const legend = card.append('div').attr('class', 'chart-legend');
    slices.forEach(d => {
      if (d.value === 0) return;
      const pct  = (d.value / total * 100).toFixed(1);
      const item = legend.append('div').attr('class', 'legend-item');
      item.append('span').attr('class', 'legend-dot').style('background', d.color);
      item.append('span').attr('class', 'legend-name').text(d.label);
      item.append('span').attr('class', 'legend-pct').text(`${pct}%`);
      if (formatFn) item.append('span').attr('class', 'legend-val').text(formatFn(d.value));
    });
  }

  function renderMetricChart(parent, metric) {
    const slices = getGroupSlices(metric.key);
    const total  = slices.reduce((s, d) => s + d.value, 0);
    const score  = state.balanceScore(metric.key);

    const card = parent.append('div').attr('class', 'chart-card');
    card.append('div').attr('class', 'chart-title').text(metric.label);
    renderDonut(card, slices, total,
      score !== null ? `${Math.round(score * 100)}%` : null,
      score !== null ? scoreColor(score) : null
    );
    renderLegend(card, slices, total, metric.format);
  }

  function renderCompositeChart(parent) {
    const compositeShares = state.getCompositeShares();
    if (compositeShares.length === 0) return;

    const total = compositeShares.reduce((s, d) => s + d.share, 0);
    if (total === 0) return;

    const slices = compositeShares.map(d => ({
      label: d.group.name,
      value: d.share,
      color: d.group.color,
      id:    d.group.id,
    }));

    const balance = state.compositeBalance();

    const card = parent.append('div').attr('class', 'chart-card chart-card-composite');
    card.append('div').attr('class', 'chart-title composite-title').text('⚖ Composite');
    renderDonut(card, slices, total,
      balance !== null ? `${Math.round(balance * 100)}%` : null,
      balance !== null ? scoreColor(balance) : null
    );

    renderLegend(card, slices, total, v => `${(v * 100).toFixed(1)}%`);

    // Formula summary card — sibling to composite, desktop only (hidden on mobile via CSS)
    const parts = METRICS.filter(m => state.activeMetrics.includes(m.key) && state.formulaWeights[m.key] > 0);
    if (parts.length) {
      const fcard = parent.append('div').attr('class', 'chart-card formula-summary-card');
      fcard.append('div').attr('class', 'chart-title fscard-title').text('⚖ Formula');
      parts.forEach(m => {
        const row = fcard.append('div').attr('class', 'fscard-row');
        row.append('span').attr('class', 'fscard-weight').text(state.formulaWeights[m.key]);
        row.append('span').attr('class', 'fscard-label').text(`× ${m.label}`);
      });
    }
  }

  function renderFlagCard(parent) {
    const hasAny = state.groups.some(g =>
      state.getAllActiveCountries().some(c => state.assignments[c.id] === g.id)
    );
    if (!hasAny) return;

    const card = parent.append('div').attr('class', 'chart-card flag-card mobile-only');
    card.append('div').attr('class', 'chart-title').text('Groups');

    state.groups.forEach(g => {
      const countries = state.getAllActiveCountries().filter(c => state.assignments[c.id] === g.id);
      if (!countries.length) return;

      const row = card.append('div').attr('class', 'flag-summary-row');
      row.append('span').attr('class', 'flag-summary-name').style('color', g.color).text(g.name);
      const flags = row.append('div').attr('class', 'flag-summary-flags');
      countries.forEach(c => {
        const entry = flags.append('span').attr('class', 'flag-entry');
        entry.append('span').attr('class', 'flag-emoji').text(c.flag || '');
        entry.append('span').attr('class', 'flag-code').text(c.code);
      });
    });

    // Twemoji parse after DOM insertion
    if (window.twemoji) {
      card.each(function () {
        twemoji.parse(this, { folder: 'svg', ext: '.svg' });
      });
    }
  }

  function render() {
    const sel = d3.select(container);
    sel.selectAll('*').remove();

    const activeMetrics = METRICS.filter(m => state.activeMetrics.includes(m.key));

    if (state.groups.length === 0) {
      sel.append('div').attr('class', 'charts-empty')
        .text('Add groups in the sidebar, then click countries on the map to assign them.');
      return;
    }

    if (activeMetrics.length === 0) {
      sel.append('div').attr('class', 'charts-empty').text('Enable at least one metric above.');
      return;
    }

    renderFlagCard(sel);
    activeMetrics.forEach(m => renderMetricChart(sel, m));
    renderCompositeChart(sel);
  }

  state.on('assignments-changed', render);
  state.on('groups-changed',      render);
  state.on('metrics-changed',     render);
  state.on('countries-changed',   render);
  state.on('formula-changed',     render);

  render();
}

function scoreColor(score) {
  if (score >= 0.8) return '#4ade80';
  if (score >= 0.55) return '#fbbf24';
  return '#f87171';
}
