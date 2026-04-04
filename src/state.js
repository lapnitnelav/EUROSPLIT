import { EU_COUNTRIES, EU_BY_ID, EXTRA_COUNTRIES, METRICS, DEFAULT_COLORS } from './data.js';

const ALL_COUNTRIES = [...EU_COUNTRIES, ...EXTRA_COUNTRIES];

class AppState extends EventTarget {
  constructor() {
    super();
    /** @type {Array<{id:string, name:string, color:string}>} */
    this.groups = [];
    /** @type {Record<string, string>} countryId → groupId */
    this.assignments = {};
    /** @type {string[]} active metric keys */
    this.activeMetrics = ['gdp', 'population', 'area', 'militaryPower', 'industrial', 'agricultural'];
    /** @type {string|null} */
    this.selectedGroupId = null;
    /** EU country IDs the user has excluded */
    this.excludedIds = new Set();
    /** Extra (non-EU) country IDs the user has included */
    this.includedExtraIds = new Set();
    /** Per-metric formula weights (0 = not included in composite) */
    const savedWeights = this._loadWeights();
    this.formulaWeights = Object.fromEntries(
      METRICS.map(m => [m.key, savedWeights[m.key] ?? 1.0])
    );
  }

  // ── Country inclusion ─────────────────────────────────────────────────────

  countryIsActive(id) {
    const isEU = !!EU_BY_ID[id];
    return isEU ? !this.excludedIds.has(id) : this.includedExtraIds.has(id);
  }

  getAllActiveCountries() {
    const eu    = EU_COUNTRIES.filter(c => !this.excludedIds.has(c.id));
    const extra = EXTRA_COUNTRIES.filter(c => this.includedExtraIds.has(c.id));
    return [...eu, ...extra];
  }

  toggleCountry(id) {
    const isEU = !!EU_BY_ID[id];
    if (isEU) {
      if (this.excludedIds.has(id)) {
        this.excludedIds.delete(id);
      } else {
        this.excludedIds.add(id);
        delete this.assignments[id];
      }
    } else {
      if (this.includedExtraIds.has(id)) {
        this.includedExtraIds.delete(id);
        delete this.assignments[id];
      } else {
        this.includedExtraIds.add(id);
      }
    }
    this._emit('countries-changed');
    this._emit('assignments-changed');
  }

  // ── Groups ────────────────────────────────────────────────────────────────

  addGroup(name) {
    const id = crypto.randomUUID();
    const color = DEFAULT_COLORS[this.groups.length % DEFAULT_COLORS.length];
    this.groups.push({ id, name, color });
    this.selectedGroupId = id;
    this._emit('groups-changed');
    this._emit('selection-changed');
    return id;
  }

  removeGroup(groupId) {
    this.groups = this.groups.filter(g => g.id !== groupId);
    for (const cid of Object.keys(this.assignments)) {
      if (this.assignments[cid] === groupId) delete this.assignments[cid];
    }
    if (this.selectedGroupId === groupId) {
      this.selectedGroupId = this.groups[0]?.id ?? null;
    }
    this._emit('groups-changed');
    this._emit('assignments-changed');
  }

  updateGroup(groupId, updates) {
    const g = this.groups.find(g => g.id === groupId);
    if (!g) return;
    Object.assign(g, updates);
    this._emit('groups-changed');
  }

  selectGroup(groupId) {
    this.selectedGroupId = groupId;
    this._emit('selection-changed');
  }

  clearAll() {
    this.assignments = {};
    this._emit('assignments-changed');
  }

  // ── Country assignment ────────────────────────────────────────────────────

  clickCountry(countryId) {
    if (!this.selectedGroupId) return;
    if (!this.countryIsActive(countryId)) return;
    if (this.assignments[countryId] === this.selectedGroupId) {
      delete this.assignments[countryId];
    } else {
      this.assignments[countryId] = this.selectedGroupId;
    }
    this._emit('assignments-changed');
  }

  // ── Metrics ───────────────────────────────────────────────────────────────

  toggleMetric(key) {
    if (this.activeMetrics.includes(key)) {
      this.activeMetrics = this.activeMetrics.filter(m => m !== key);
    } else {
      this.activeMetrics.push(key);
    }
    this._emit('metrics-changed');
  }

  // ── Formula weights ───────────────────────────────────────────────────────

  setFormulaWeight(key, value) {
    this.formulaWeights[key] = Math.max(0, value);
    this._saveWeights();
    this._emit('formula-changed');
  }

  resetFormulaWeights() {
    METRICS.forEach(m => { this.formulaWeights[m.key] = 1.0; });
    this._saveWeights();
    this._emit('formula-changed');
  }

  _saveWeights() {
    try {
      localStorage.setItem('eurosplit_weights', JSON.stringify(this.formulaWeights));
    } catch {}
  }

  _loadWeights() {
    try {
      return JSON.parse(localStorage.getItem('eurosplit_weights') || '{}');
    } catch {
      return {};
    }
  }

  /**
   * Returns [{group, share}] where share is the weighted composite fraction
   * for each group across all active metrics with weight > 0.
   * Only active (toggled-on) metrics with weight > 0 are considered.
   */
  getCompositeShares() {
    if (this.groups.length === 0) return [];
    const active = this.getAllActiveCountries();
    const metricsInFormula = METRICS.filter(
      m => this.activeMetrics.includes(m.key) && this.formulaWeights[m.key] > 0
    );
    if (metricsInFormula.length === 0) return [];

    const totals = {};
    metricsInFormula.forEach(m => {
      totals[m.key] = active.reduce((s, c) => s + (c[m.key] || 0), 0);
    });

    const weightSum = metricsInFormula.reduce((s, m) => s + this.formulaWeights[m.key], 0);

    return this.groups.map(g => {
      const share = metricsInFormula.reduce((s, m) => {
        if (totals[m.key] === 0) return s;
        const groupTotal = active
          .filter(c => this.assignments[c.id] === g.id)
          .reduce((sum, c) => sum + (c[m.key] || 0), 0);
        return s + (this.formulaWeights[m.key] * (groupTotal / totals[m.key]));
      }, 0) / weightSum;
      return { group: g, share };
    });
  }

  compositeBalance() {
    const shares = this.getCompositeShares();
    if (shares.length < 2) return null;
    const total = shares.reduce((s, d) => s + d.share, 0);
    if (total === 0) return null;
    const N      = shares.length;
    const equal  = 1 / N;
    const sumDev = shares.reduce((s, d) => s + Math.abs(d.share / total - equal), 0);
    const maxDev = 2 * (N - 1) / N;
    return 1 - sumDev / maxDev;
  }

  // ── LLM result ────────────────────────────────────────────────────────────

  applyLLMResult(llmGroups) {
    this.groups = [];
    this.assignments = {};

    llmGroups.forEach((g, i) => {
      const id    = crypto.randomUUID();
      const color = g.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
      this.groups.push({ id, name: g.name, color });

      (g.countries || []).forEach(ref => {
        const country = ALL_COUNTRIES.find(c =>
          c.name.toLowerCase() === ref.toLowerCase() ||
          c.code.toLowerCase() === ref.toLowerCase()
        );
        if (!country) return;
        if (EXTRA_COUNTRIES.some(e => e.id === country.id)) {
          this.includedExtraIds.add(country.id);
        }
        this.assignments[country.id] = id;
      });
    });

    this.selectedGroupId = this.groups[0]?.id ?? null;
    this._emit('countries-changed');
    this._emit('groups-changed');
    this._emit('assignments-changed');
  }

  // ── Balance scores ────────────────────────────────────────────────────────

  balanceScore(metricKey) {
    if (this.groups.length < 2) return null;
    const active = this.getAllActiveCountries();
    const values = this.groups.map(g =>
      active.filter(c => this.assignments[c.id] === g.id)
            .reduce((s, c) => s + (c[metricKey] || 0), 0)
    );
    const total = values.reduce((s, v) => s + v, 0);
    if (total === 0) return null;
    // Mean absolute deviation from equal share, normalised to [0, 1].
    // 1.0 = perfectly equal, 0.0 = one group holds everything.
    // e.g. 2 groups at 55/45 → 90%, 2 groups at 70/30 → 80%.
    const N     = this.groups.length;
    const equal = 1 / N;
    const sumDev = values.reduce((s, v) => s + Math.abs(v / total - equal), 0);
    const maxDev = 2 * (N - 1) / N; // worst case: one group has 100%
    return 1 - sumDev / maxDev;
  }

  overallBalance() {
    const scores = this.activeMetrics
      .map(k => this.balanceScore(k))
      .filter(s => s !== null);
    if (scores.length === 0) return null;
    return scores.reduce((s, v) => s + v, 0) / scores.length;
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _emit(type) {
    this.dispatchEvent(new CustomEvent(type));
  }

  on(type, handler) {
    this.addEventListener(type, handler);
  }
}

export const state = new AppState();
