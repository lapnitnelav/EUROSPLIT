# EUROSPLIT — Project Plan & Reference

## What it is

An interactive browser tool to group EU-27 countries into user-defined blocs and visualise how balanced those blocs are across key metrics (GDP, population, area). Groupings can be built manually on a map or generated automatically via a local LLM.

---

## Tech stack

| Concern | Choice |
|---|---|
| Build / dev server | Vite 5 |
| Map & charts | D3.js v7 |
| Map geometry | TopoJSON (world-atlas via jsDelivr CDN) |
| LLM integration | Ollama local API (`/api/chat`) |
| Default model | `ministral-3:3b` (configurable in the UI) |
| Styling | Plain CSS, dark theme, no framework |

No backend. All state is in-memory in the browser.

---

## Layout

```
┌────────────────────────────────────────────────────────┐
│ EUROSPLIT   [model input] [prompt input] [Generate ✦]  │  ← Header (56px)
├──────────────────────────────────┬─────────────────────┤
│                                  │  Groups             │
│            MAP                   │  [+ Add Group]      │
│   (D3 SVG, Europe projection)    │  ● Group 1  3  ×   │  ← Main area (flex)
│                                  │  ● Group 2  5  ×   │
│                                  │  Unassigned (19)    │
├──────────────────────────────────┴─────────────────────┤
│  Metrics: [GDP ✓] [Population ✓] [Area ✓]  Equilibrium: 78%  │  ← Metrics bar (44px)
├─────────────┬──────────────┬──────────────────────────┤
│  GDP        │  Population  │  Area                    │  ← Charts area (240px)
│  [donut]    │  [donut]     │  [donut]                 │
└─────────────┴──────────────┴──────────────────────────┘
```

---

## File structure

```
EUROSPLIT/
├── index.html          # App shell, DOM structure
├── package.json        # d3, topojson-client, vite
├── src/
│   ├── main.js         # Entry point — wires all modules, LLM handler
│   ├── style.css       # Full dark-theme stylesheet
│   ├── data.js         # EU-27 country data + METRICS + DEFAULT_COLORS
│   ├── state.js        # AppState class (EventTarget-based reactive store)
│   ├── map.js          # D3 choropleth map (SVG)
│   ├── charts.js       # D3 donut charts, one per active metric
│   ├── sidebar.js      # Group management UI
│   └── llm.js          # Ollama API call + JSON parsing
```

---

## Data (`src/data.js`)

EU-27 countries, each with:

| Field | Source | Unit |
|---|---|---|
| `id` | ISO 3166-1 numeric (no padding) | string |
| `code` | ISO 3166-1 alpha-2 | string |
| `name` | English country name | string |
| `gdp` | IMF 2023 nominal | billion USD |
| `population` | 2023 estimate | million |
| `area` | — | km² |

Three toggleable `METRICS`: `gdp`, `population`, `area`.

GDP per capita is **derived** (`gdp * 1000 / population` → USD) and shown in map tooltips only — it doesn't aggregate linearly so it's excluded from pie charts.

---

## State (`src/state.js`)

Single `AppState` instance exported as `state`. Extends `EventTarget`.

### Core data
```
state.groups          // [{id, name, color}]
state.assignments     // {countryId → groupId}
state.activeMetrics   // ['gdp', 'population', 'area']
state.selectedGroupId // which group map-clicks paint into
```

### Key methods
| Method | Effect | Event emitted |
|---|---|---|
| `addGroup(name)` | Push new group, auto-color | `groups-changed` |
| `removeGroup(id)` | Remove group + unassign its countries | `groups-changed`, `assignments-changed` |
| `updateGroup(id, {name?, color?})` | Patch group fields | `groups-changed` |
| `selectGroup(id)` | Change active painting group | `selection-changed` |
| `clickCountry(id)` | Toggle assignment to active group | `assignments-changed` |
| `clearAll()` | Unassign all countries | `assignments-changed` |
| `toggleMetric(key)` | Add/remove from activeMetrics | `metrics-changed` |
| `applyLLMResult(groups)` | Replace all groups+assignments from LLM JSON | `groups-changed`, `assignments-changed` |

### Balance score
Entropy-based, per metric:
```
score = H(shares) / log(N)
```
where `H` is Shannon entropy of group shares, `N` is group count.  
`1.0` = perfectly equal, `0.0` = one group holds everything.  
`overallBalance()` = mean score across active metrics.

Color coding: ≥80% green · 55–79% amber · <55% red.

---

## Map (`src/map.js`)

- Projection: `d3.geoAzimuthalEqualArea` rotated to Europe centre (15°W, 52°N), `fitExtent` to EU bounding box.
- World atlas fetched from CDN (`world-atlas@2/countries-110m.json`).
- Two SVG layers:
  1. **Context layer** — all non-EU countries, dark non-interactive gray.
  2. **EU layer** — EU-27, clickable, colored by group.
- Country code labels rendered for countries whose rendered path area exceeds a minimum pixel threshold (avoids tiny-country clutter).
- Tooltip on hover: country name, group, GDP, population, area, GDP/capita.
- Click behaviour: assign to active group; click again on same group → unassign.
- Stroke weight increases for countries in the active group.

---

## Charts (`src/charts.js`)

One donut chart card per active metric, rendered as D3 SVG inside a flex row.

- Slices = one per group + one gray "Unassigned" slice if any countries are unassigned.
- Center of donut shows per-metric balance score (color-coded).
- Legend below each chart: group name · percentage · formatted absolute value.
- Slice hover expands radius for feedback.
- Full re-render on any state change (assignments, groups, metrics).

---

## Sidebar (`src/sidebar.js`)

- Header with "Groups" label + ↺ clear-all button.
- "+ Add Group" button (creates next group with auto-assigned color from palette).
- Per-group row:
  - `<input type="color">` swatch — live color picker.
  - Text input for group name — updates state on `input`, preserves cursor focus across re-renders.
  - Country count badge.
  - × remove button.
  - "Active" badge on the currently selected group.
- Clicking a group row sets it as the active painting group.
- Unassigned countries listed below the groups as small chips.

---

## LLM integration (`src/llm.js`)

### Endpoint
```
POST http://localhost:11434/api/chat
```

### Request body
```json
{
  "model": "<value of #llm-model input>",
  "stream": false,
  "messages": [
    { "role": "system", "content": "<system prompt>" },
    { "role": "user",   "content": "<user prompt>" }
  ]
}
```

### System prompt
Instructs the model to return **only** a JSON object (no markdown, no preamble):
```json
{
  "groups": [
    { "name": "Group Name", "countries": ["France", "Spain"] },
    ...
  ]
}
```
Every EU country must appear in exactly one group. Country names must match the data exactly.

### Parsing
The response text is searched for the first `{...}` block (handles models that add preamble). Result is passed to `state.applyLLMResult()`.

### Error handling
- Non-200 HTTP → shows Ollama error status.
- No JSON found → user-visible error.
- Invalid JSON → user-visible error.
- Status shown inline next to the Generate button (green ✓ / red ✗).

### Model name
Configurable via the small input left of the prompt field. Default: `ministral-3:3b`.

---

## Running locally

```bash
npm install
npm run dev      # starts at http://localhost:5173
```

Requires Ollama running locally (`ollama serve`) for the LLM feature.  
Map geometry is fetched from jsDelivr CDN on first load (requires internet).

---

## Possible future additions

- **GDP per capita** as a chart metric (displayed as bar chart rather than pie, since it's a weighted average not a sum).
- **Save / load** groupings to/from JSON file.
- **Static export** — `npm run build` already works; LLM feature would need a proxy or be disabled.
- **Zoom / pan** on the map (D3 zoom).
- **Drag-to-assign** — hold a group key and drag across countries.
- **More metrics** — military spending, CO₂ emissions, trade balance.
- **Scenario presets** — one-click load of named historical or hypothetical splits.
