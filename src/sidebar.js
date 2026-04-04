import * as d3 from 'd3';
import { EU_COUNTRIES, EXTRA_COUNTRIES } from './data.js';
import { state } from './state.js';
import { listScenarios, saveScenario, deleteScenario } from './storage.js';

let countriesExpanded = false;

export function initSidebar(container) {
  function countFor(groupId) {
    return Object.values(state.assignments).filter(gid => gid === groupId).length;
  }

  function unassignedCountries() {
    return state.getAllActiveCountries().filter(c => !state.assignments[c.id]);
  }

  function render() {
    const focused      = document.activeElement;
    const focusGroupId = focused?.dataset?.groupId;
    const focusField   = focused?.dataset?.field;

    const sel = d3.select(container);
    sel.selectAll('*').remove();

    // ── Groups header ────────────────────────────────────────────────────────
    const header = sel.append('div').attr('class', 'sidebar-header');
    header.append('span').attr('class', 'sidebar-title').text('Groups');
    header.append('button')
      .attr('class', 'btn-icon')
      .attr('title', 'Clear all assignments')
      .text('↺')
      .on('click', () => state.clearAll());

    sel.append('button')
      .attr('class', 'btn-add-group')
      .text('+ Add Group')
      .on('click', () => state.addGroup(`Group ${state.groups.length + 1}`));

    // ── Group list ───────────────────────────────────────────────────────────
    if (state.groups.length === 0) {
      sel.append('div').attr('class', 'sidebar-empty')
        .text('No groups yet. Add one to start painting the map.');
    }

    state.groups.forEach(group => {
      const isActive = group.id === state.selectedGroupId;
      const item = sel.append('div')
        .attr('class', `group-item${isActive ? ' active' : ''}`)
        .on('click', () => { if (!isActive) state.selectGroup(group.id); });

      item.append('input')
        .attr('type', 'color')
        .attr('class', 'color-swatch')
        .attr('value', group.color)
        .on('click', e => e.stopPropagation())
        .on('input', function () { state.updateGroup(group.id, { color: this.value }); });

      item.append('input')
        .attr('type', 'text')
        .attr('class', 'group-name-input')
        .attr('value', group.name)
        .attr('data-group-id', group.id)
        .attr('data-field', 'name')
        .on('click', e => e.stopPropagation())
        .on('input', function () {
          const g = state.groups.find(g => g.id === group.id);
          if (g) {
            g.name = this.value;
            state.dispatchEvent(new CustomEvent('groups-changed'));
          }
        });

      item.append('span').attr('class', 'group-count').text(countFor(group.id));

      item.append('button')
        .attr('class', 'btn-remove')
        .attr('title', 'Remove group')
        .text('×')
        .on('click', e => { e.stopPropagation(); state.removeGroup(group.id); });

      if (isActive) item.append('div').attr('class', 'active-badge').text('Active');
    });

    // ── Unassigned list ──────────────────────────────────────────────────────
    const unassigned = unassignedCountries();
    if (unassigned.length > 0) {
      sel.append('div').attr('class', 'unassigned-header')
        .text(`Unassigned (${unassigned.length})`);
      const list = sel.append('div').attr('class', 'unassigned-list');
      unassigned.forEach(c => {
        list.append('div').attr('class', 'unassigned-item').text(c.name);
      });
    }

    // ── Countries section (collapsible) ──────────────────────────────────────
    sel.append('div').attr('class', 'scenarios-divider');

    const ctryHeader = sel.append('div')
      .attr('class', 'sidebar-header countries-header')
      .style('cursor', 'pointer')
      .on('click', () => { countriesExpanded = !countriesExpanded; render(); });
    ctryHeader.append('span').attr('class', 'sidebar-title').text('Countries');
    ctryHeader.append('span').attr('class', 'expand-icon').text(countriesExpanded ? '▼' : '▶');

    if (countriesExpanded) {
      // Include extras
      const allIncluded = EXTRA_COUNTRIES.every(c => state.includedExtraIds.has(c.id));
      const includeHeader = sel.append('div').attr('class', 'countries-section-row');
      includeHeader.append('span').attr('class', 'countries-section-label').text('Include optional');
      includeHeader.append('button')
        .attr('class', 'btn-toggle-all')
        .text(allIncluded ? 'Remove all' : 'Add all')
        .on('click', () => {
          EXTRA_COUNTRIES.forEach(c => {
            if (allIncluded) {
              state.includedExtraIds.delete(c.id);
              delete state.assignments[c.id];
            } else {
              state.includedExtraIds.add(c.id);
            }
          });
          state._emit('countries-changed');
          state._emit('assignments-changed');
        });
      const includeGrid = sel.append('div').attr('class', 'countries-grid');
      EXTRA_COUNTRIES.forEach(c => {
        const lbl = includeGrid.append('label')
          .attr('class', 'country-toggle')
          .attr('title', c.name);
        lbl.append('input')
          .attr('type', 'checkbox')
          .property('checked', state.includedExtraIds.has(c.id))
          .on('change', () => state.toggleCountry(c.id));
        lbl.append('span').text(c.code);
      });

      // Exclude EU
      sel.append('div').attr('class', 'countries-section-label exclude-label').text('Exclude EU');
      const excludeGrid = sel.append('div').attr('class', 'countries-grid');
      EU_COUNTRIES.forEach(c => {
        const lbl = excludeGrid.append('label')
          .attr('class', 'country-toggle exclude-toggle')
          .attr('title', c.name);
        lbl.append('input')
          .attr('type', 'checkbox')
          .property('checked', state.excludedIds.has(c.id))
          .on('change', () => state.toggleCountry(c.id));
        lbl.append('span').text(c.code);
      });
    }

    // ── Saved scenarios ───────────────────────────────────────────────────────
    sel.append('div').attr('class', 'scenarios-divider');

    const scenHeader = sel.append('div').attr('class', 'sidebar-header');
    scenHeader.append('span').attr('class', 'sidebar-title').text('Saved');

    const saveRow = sel.append('div').attr('class', 'scenario-save-row');
    const nameIn  = saveRow.append('input')
      .attr('type', 'text')
      .attr('class', 'scenario-name-input')
      .attr('placeholder', 'Scenario name…')
      .attr('data-field', 'scenario-name');

    saveRow.append('button')
      .attr('class', 'btn-save-scenario')
      .text('Save')
      .on('click', () => {
        const name = nameIn.node().value.trim();
        if (!name || state.groups.length === 0) { nameIn.node().focus(); return; }
        saveScenario(name, state.groups, state.assignments, state.excludedIds, state.includedExtraIds);
        nameIn.node().value = '';
        render();
      });

    const scenarios = listScenarios();
    if (scenarios.length === 0) {
      sel.append('div').attr('class', 'sidebar-empty').text('No saved scenarios.');
    } else {
      scenarios.slice().reverse().forEach(s => {
        const row = sel.append('div').attr('class', 'scenario-item');
        row.append('span')
          .attr('class', 'scenario-name')
          .attr('title', new Date(s.savedAt).toLocaleString())
          .text(s.name);

        row.append('button')
          .attr('class', 'btn-scenario-load')
          .text('Load')
          .on('click', () => {
            state.excludedIds      = new Set(s.excludedIds      || []);
            state.includedExtraIds = new Set(s.includedExtraIds || []);

            state.groups      = s.groups.map(g => ({ ...g }));
            state.assignments = { ...s.assignments };
            state.selectedGroupId = state.groups[0]?.id ?? null;

            // Auto-include any extra country that appears in assignments
            // (handles scenarios saved before includedExtraIds was persisted)
            EXTRA_COUNTRIES.forEach(c => {
              if (state.assignments[c.id]) state.includedExtraIds.add(c.id);
            });

            state._emit('countries-changed');
            state._emit('groups-changed');
            state._emit('assignments-changed');
          });

        row.append('button')
          .attr('class', 'btn-remove')
          .attr('title', 'Delete scenario')
          .text('×')
          .on('click', () => { deleteScenario(s.id); render(); });
      });
    }

    // Restore focus
    if (focusGroupId && focusField) {
      const el = container.querySelector(
        `[data-group-id="${focusGroupId}"][data-field="${focusField}"]`
      );
      if (el) {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }
  }

  state.on('groups-changed',      render);
  state.on('assignments-changed', render);
  state.on('selection-changed',   render);
  state.on('countries-changed',   render);

  render();
}
