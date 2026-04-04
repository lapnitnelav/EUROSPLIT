import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { POOL_ID_SET, EU_ID_SET, ALL_BY_ID } from './data.js';
import { state } from './state.js';

const WORLD_ATLAS_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

const OCEAN_COLOR      = '#0d1b2a';
const CONTEXT_COLOR    = '#1e2d3d';
const INACTIVE_COLOR   = '#28374a';
const UNASSIGNED_COLOR = '#3d5a7a';

// Tighter Europe bbox — excludes Canary Islands, French Guiana, etc.
// 34°N–72°N, 25°W–42°E
const EUROPE_BBOX = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-25, 34], [42, 34], [42, 72], [-25, 72], [-25, 34],
    ]],
  },
};

export async function initMap(container) {
  await new Promise(r => requestAnimationFrame(r));

  const worldData   = await d3.json(WORLD_ATLAS_URL);
  const allFeatures = topojson.feature(worldData, worldData.objects.countries).features;

  const poolFeatures    = allFeatures.filter(f => POOL_ID_SET.has(+f.id));
  const contextFeatures = allFeatures.filter(f => !POOL_ID_SET.has(+f.id));

  const euFeatures = allFeatures.filter(f => EU_ID_SET.has(+f.id));
  if (euFeatures.length === 0) {
    console.error('EUROSPLIT: no EU features matched.',
      allFeatures.slice(0, 3).map(f => ({ id: f.id, t: typeof f.id })));
    return;
  }

  const width  = container.clientWidth  || 800;
  const height = container.clientHeight || 500;

  // Base projection fitted to the Europe bbox
  const projection = d3.geoAzimuthalEqualArea()
    .rotate([-15, -52])
    .fitExtent([[20, 20], [width - 20, height - 20]], EUROPE_BBOX);

  const path = d3.geoPath().projection(projection);

  // ── SVG ───────────────────────────────────────────────────────────────────

  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('display', 'block');

  // Clip to the SVG viewport so panned content doesn't overflow
  svg.append('defs').append('clipPath')
    .attr('id', 'map-clip')
    .append('rect').attr('width', width).attr('height', height);

  svg.append('rect')
    .attr('width', width).attr('height', height)
    .attr('fill', OCEAN_COLOR);

  const g = svg.append('g').attr('clip-path', 'url(#map-clip)');

  // Context layer
  g.selectAll('.ctx')
    .data(contextFeatures)
    .join('path')
    .attr('class', 'ctx')
    .attr('d', path)
    .attr('fill', CONTEXT_COLOR)
    .attr('stroke', '#0d1b2a')
    .attr('stroke-width', 0.4);

  // Pool layer (EU + extras)
  const poolPaths = g.selectAll('.pool')
    .data(poolFeatures)
    .join('path')
    .attr('class', 'pool')
    .attr('d', path)
    .attr('stroke-width', 0.7);

  // Labels
  const MIN_AREA_PX = 160;
  const labels = g.selectAll('.country-label')
    .data(poolFeatures.filter(f => path.area(f) > MIN_AREA_PX))
    .join('text')
    .attr('class', 'country-label')
    .attr('transform', d => {
      const [x, y] = path.centroid(d);
      return `translate(${x},${y})`;
    })
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('pointer-events', 'none')
    .attr('font-size', '9px')
    .text(d => ALL_BY_ID[String(+d.id)]?.code ?? '');

  // ── Zoom ──────────────────────────────────────────────────────────────────

  // Track current transform so click vs drag can be distinguished
  let isDragging = false;

  const zoom = d3.zoom()
    .scaleExtent([2, 15])
    .on('start', () => { isDragging = false; })
    .on('zoom', (event) => {
      if (event.sourceEvent) isDragging = true;
      g.attr('transform', event.transform);
      // Scale stroke widths inversely so borders don't become thick at high zoom
      const k = event.transform.k;
      poolPaths.attr('stroke-width', d => {
        const id = String(+d.id);
        if (!state.countryIsActive(id)) return 0.3 / k;
        return (state.assignments[id] === state.selectedGroupId ? 1.5 : 0.7) / k;
      });
      labels.attr('font-size', `${9 / k}px`);
    })
    .on('end', () => {
      // Reset drag flag after a tick so click handlers can read it
      setTimeout(() => { isDragging = false; }, 0);
    });

  // Start at 2× zoom, centred on the map
  const initialTransform = d3.zoomIdentity
    .translate(width / 2, height / 2)
    .scale(2)
    .translate(-width / 2, -height / 2);

  svg.call(zoom).on('dblclick.zoom', null);

  // Apply initial transform after a frame so the zoom handler fires properly
  requestAnimationFrame(() => {
    svg.call(zoom.transform, initialTransform);
  });

  // Reset button returns to the same initial 2× view
  d3.select(container)
    .append('button')
    .attr('class', 'map-reset-btn')
    .attr('title', 'Reset zoom')
    .text('⌖')
    .on('click', () => {
      svg.transition().duration(400).call(zoom.transform, initialTransform);
    });

  // ── Tooltip ───────────────────────────────────────────────────────────────

  const tooltip = d3.select('#map-tooltip');

  poolPaths
    .on('mousemove', (event, d) => {
      const id      = String(+d.id);
      const country = ALL_BY_ID[id];
      if (!country || !state.countryIsActive(id)) return;

      const gid   = state.assignments[id];
      const group = state.groups.find(g => g.id === gid);
      const gdppc = Math.round(country.gdp * 1000 / country.population);

      const rect = container.getBoundingClientRect();
      tooltip
        .style('opacity', '1')
        .style('left', (event.clientX - rect.left + 14) + 'px')
        .style('top',  (event.clientY - rect.top  - 10) + 'px')
        .html(`
          <div class="tt-name">${country.name}</div>
          ${group
            ? `<div class="tt-group" style="color:${group.color}">● ${group.name}</div>`
            : '<div class="tt-unassigned">Unassigned</div>'
          }
          <div class="tt-row"><span>GDP</span><span>$${country.gdp.toLocaleString()}B</span></div>
          <div class="tt-row"><span>Population</span><span>${country.population}M</span></div>
          <div class="tt-row"><span>Area</span><span>${country.area.toLocaleString()} km²</span></div>
          <div class="tt-row"><span>GDP / capita</span><span>$${gdppc.toLocaleString()}</span></div>
          <div class="tt-row"><span>Military</span><span>${country.militaryPower.toFixed(3)} <span style="color:var(--text-muted)">(FR=1.0)</span></span></div>
        `);
    })
    .on('mouseleave', () => tooltip.style('opacity', '0'))
    .on('click', (event, d) => {
      if (isDragging) return; // ignore drag-end as click
      const id = String(+d.id);
      if (!state.countryIsActive(id)) return;
      state.clickCountry(id);
    });

  // ── Colour / style update ─────────────────────────────────────────────────

  function countryColor(d) {
    const id = String(+d.id);
    if (!state.countryIsActive(id)) return INACTIVE_COLOR;
    const gid   = state.assignments[id];
    const group = state.groups.find(g => g.id === gid);
    return group ? group.color : UNASSIGNED_COLOR;
  }

  function update() {
    poolPaths
      .attr('fill', countryColor)
      .attr('cursor', d => state.countryIsActive(String(+d.id)) ? 'pointer' : 'default')
      .attr('stroke', d => state.countryIsActive(String(+d.id)) ? '#ffffff' : '#0d1b2a');

    labels.attr('fill', d => {
      const id = String(+d.id);
      return state.countryIsActive(id) ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)';
    });
  }

  state.on('assignments-changed', update);
  state.on('groups-changed',      update);
  state.on('selection-changed',   update);
  state.on('countries-changed',   update);

  update();
}
