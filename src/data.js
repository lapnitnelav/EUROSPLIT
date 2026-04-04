// EU-27 countries — ISO 3166-1 numeric IDs (as strings, no padding)
// GDP: IMF WEO 2023 nominal (billion USD)
// population: UN/Eurostat 2023 (million)
// area: km²
// militaryPower: GFP 2026 Power Index inverted & normalised (France = 1.000)
// industrial: UNIDO/World Bank Manufacturing Value Added 2022 (billion USD)
// agricultural: FAO Gross Agricultural Production Value 2022 (billion USD)
export const EU_COUNTRIES = [
  { id: '40',  code: 'AT', flag: '🇦🇹', name: 'Austria',        gdp: 526,  population: 9.1,  area: 83871,  militaryPower: 0.131, industrial: 55,  agricultural: 8.0  },
  { id: '56',  code: 'BE', flag: '🇧🇪', name: 'Belgium',         gdp: 627,  population: 11.6, area: 30528,  militaryPower: 0.147, industrial: 55,  agricultural: 9.0  },
  { id: '100', code: 'BG', flag: '🇧🇬', name: 'Bulgaria',        gdp: 108,  population: 6.5,  area: 110879, militaryPower: 0.144, industrial: 11,  agricultural: 5.0  },
  { id: '191', code: 'HR', flag: '🇭🇷', name: 'Croatia',         gdp: 82,   population: 3.9,  area: 56594,  militaryPower: 0.117, industrial: 9,   agricultural: 3.0  },
  { id: '196', code: 'CY', flag: '🇨🇾', name: 'Cyprus',          gdp: 33,   population: 1.3,  area: 9251,   militaryPower: 0.055, industrial: 2,   agricultural: 0.9  },
  { id: '203', code: 'CZ', flag: '🇨🇿', name: 'Czechia',         gdp: 330,  population: 10.9, area: 78866,  militaryPower: 0.174, industrial: 48,  agricultural: 7.0  },
  { id: '208', code: 'DK', flag: '🇩🇰', name: 'Denmark',         gdp: 406,  population: 5.9,  area: 43094,  militaryPower: 0.219, industrial: 35,  agricultural: 12.0 },
  { id: '233', code: 'EE', flag: '🇪🇪', name: 'Estonia',         gdp: 42,   population: 1.4,  area: 45228,  militaryPower: 0.077, industrial: 4,   agricultural: 1.3  },
  { id: '246', code: 'FI', flag: '🇫🇮', name: 'Finland',         gdp: 300,  population: 5.5,  area: 338145, militaryPower: 0.207, industrial: 29,  agricultural: 5.0  },
  { id: '250', code: 'FR', flag: '🇫🇷', name: 'France',          gdp: 3031, population: 68.4, area: 643801, militaryPower: 1.000, industrial: 250, agricultural: 75.0 },
  { id: '276', code: 'DE', flag: '🇩🇪', name: 'Germany',         gdp: 4456, population: 84.4, area: 357114, militaryPower: 0.730, industrial: 640, agricultural: 60.0 },
  { id: '300', code: 'GR', flag: '🇬🇷', name: 'Greece',          gdp: 242,  population: 10.4, area: 131957, militaryPower: 0.328, industrial: 14,  agricultural: 12.0 },
  { id: '348', code: 'HU', flag: '🇭🇺', name: 'Hungary',         gdp: 213,  population: 9.7,  area: 93028,  militaryPower: 0.172, industrial: 35,  agricultural: 10.0 },
  { id: '372', code: 'IE', flag: '🇮🇪', name: 'Ireland',         gdp: 545,  population: 5.1,  area: 70273,  militaryPower: 0.087, industrial: 90,  agricultural: 10.0 },
  { id: '380', code: 'IT', flag: '🇮🇹', name: 'Italy',           gdp: 2254, population: 59.1, area: 301340, militaryPower: 0.813, industrial: 280, agricultural: 60.0 },
  { id: '428', code: 'LV', flag: '🇱🇻', name: 'Latvia',          gdp: 45,   population: 1.8,  area: 64589,  militaryPower: 0.081, industrial: 3,   agricultural: 2.0  },
  { id: '440', code: 'LT', flag: '🇱🇹', name: 'Lithuania',       gdp: 78,   population: 2.8,  area: 65300,  militaryPower: 0.095, industrial: 6,   agricultural: 4.0  },
  { id: '442', code: 'LU', flag: '🇱🇺', name: 'Luxembourg',      gdp: 87,   population: 0.66, area: 2586,   militaryPower: 0.074, industrial: 4,   agricultural: 0.5  },
  { id: '470', code: 'MT', flag: '🇲🇹', name: 'Malta',           gdp: 22,   population: 0.54, area: 316,    militaryPower: 0.055, industrial: 1.5, agricultural: 0.1  },
  { id: '528', code: 'NL', flag: '🇳🇱', name: 'Netherlands',     gdp: 1118, population: 17.9, area: 41543,  militaryPower: 0.293, industrial: 72,  agricultural: 35.0 },
  { id: '616', code: 'PL', flag: '🇵🇱', name: 'Poland',          gdp: 842,  population: 36.8, area: 312679, militaryPower: 0.462, industrial: 90,  agricultural: 35.0 },
  { id: '620', code: 'PT', flag: '🇵🇹', name: 'Portugal',        gdp: 287,  population: 10.3, area: 92212,  militaryPower: 0.270, industrial: 28,  agricultural: 8.0  },
  { id: '642', code: 'RO', flag: '🇷🇴', name: 'Romania',         gdp: 351,  population: 19.0, area: 238397, militaryPower: 0.188, industrial: 30,  agricultural: 22.0 },
  { id: '703', code: 'SK', flag: '🇸🇰', name: 'Slovakia',        gdp: 132,  population: 5.5,  area: 49035,  militaryPower: 0.129, industrial: 20,  agricultural: 4.0  },
  { id: '705', code: 'SI', flag: '🇸🇮', name: 'Slovenia',        gdp: 68,   population: 2.1,  area: 20273,  militaryPower: 0.093, industrial: 10,  agricultural: 1.2  },
  { id: '724', code: 'ES', flag: '🇪🇸', name: 'Spain',           gdp: 1580, population: 47.4, area: 505990, militaryPower: 0.554, industrial: 165, agricultural: 55.0 },
  { id: '752', code: 'SE', flag: '🇸🇪', name: 'Sweden',          gdp: 597,  population: 10.5, area: 450295, militaryPower: 0.372, industrial: 65,  agricultural: 7.0  },
];

// Optional non-EU countries that can be toggled into the analysis.
export const EXTRA_COUNTRIES = [
  // Western Europe
  { id: '826', code: 'GB', flag: '🇬🇧', name: 'United Kingdom',  gdp: 3085, population: 67.7, area: 243610, militaryPower: 1.061, industrial: 220, agricultural: 30.0 },
  { id: '578', code: 'NO', flag: '🇳🇴', name: 'Norway',           gdp: 546,  population: 5.5,  area: 323802, militaryPower: 0.280, industrial: 25,  agricultural: 4.0  },
  { id: '756', code: 'CH', flag: '🇨🇭', name: 'Switzerland',      gdp: 905,  population: 8.7,  area: 41285,  militaryPower: 0.273, industrial: 100, agricultural: 5.0  },
  { id: '352', code: 'IS', flag: '🇮🇸', name: 'Iceland',          gdp: 28,   population: 0.37, area: 103125, militaryPower: 0.040, industrial: 1.5, agricultural: 0.8  },
  // Eastern Europe
  { id: '804', code: 'UA', flag: '🇺🇦', name: 'Ukraine',          gdp: 180,  population: 43.5, area: 603550, militaryPower: 0.461, industrial: 18,  agricultural: 27.0 },
  //{ id: '112', code: 'BY', flag: '🇧🇾', name: 'Belarus',          gdp: 73,   population: 9.4,  area: 207600, militaryPower: 0.180, industrial: 10,  agricultural: 8.0  },
  { id: '498', code: 'MD', flag: '🇲🇩', name: 'Moldova',          gdp: 16,   population: 2.6,  area: 33846,  militaryPower: 0.058, industrial: 1.5, agricultural: 2.0  },
  // Western Balkans
  { id: '688', code: 'RS', flag: '🇷🇸', name: 'Serbia',           gdp: 80,   population: 6.6,  area: 77474,  militaryPower: 0.137, industrial: 8,   agricultural: 6.0  },
  { id: '70',  code: 'BA', flag: '🇧🇦', name: 'Bosnia & Herz.',   gdp: 27,   population: 3.2,  area: 51197,  militaryPower: 0.092, industrial: 3,   agricultural: 1.5  },
  { id: '8',   code: 'AL', flag: '🇦🇱', name: 'Albania',          gdp: 22,   population: 2.8,  area: 28748,  militaryPower: 0.099, industrial: 2,   agricultural: 2.0  },
  { id: '807', code: 'MK', flag: '🇲🇰', name: 'North Macedonia',  gdp: 15,   population: 2.1,  area: 25713,  militaryPower: 0.077, industrial: 1.5, agricultural: 1.2  },
  { id: '499', code: 'ME', flag: '🇲🇪', name: 'Montenegro',       gdp: 7,    population: 0.62, area: 13812,  militaryPower: 0.064, industrial: 0.5, agricultural: 0.4  },
  // Note: Kosovo has no official ISO numeric — id '983' used by Natural Earth; may not render on map
  //{ id: '983', code: 'XK', flag: '🇽🇰', name: 'Kosovo',           gdp: 10,   population: 1.8,  area: 10887,  militaryPower: 0.055, industrial: 1.2, agricultural: 0.8  },
];

// Lookup maps
export const EU_BY_ID    = Object.fromEntries(EU_COUNTRIES.map(c => [c.id, c]));
export const EXTRA_BY_ID = Object.fromEntries(EXTRA_COUNTRIES.map(c => [c.id, c]));
export const ALL_BY_ID   = { ...EU_BY_ID, ...EXTRA_BY_ID };

export const EU_ID_SET    = new Set(EU_COUNTRIES.map(c => +c.id));
export const EXTRA_ID_SET = new Set(EXTRA_COUNTRIES.map(c => +c.id));
export const POOL_ID_SET  = new Set([...EU_ID_SET, ...EXTRA_ID_SET]);

export const METRICS = [
  {
    key: 'gdp',
    label: 'GDP',
    unit: 'B USD',
    format: v => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}B`,
  },
  {
    key: 'population',
    label: 'Population',
    unit: 'M',
    format: v => `${v.toFixed(1)}M`,
  },
  {
    key: 'area',
    label: 'Area',
    unit: 'km²',
    format: v => `${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k km²`,
  },
  {
    key: 'militaryPower',
    label: 'Military',
    unit: 'GFP (rel.)',
    format: v => v.toFixed(2),
  },
  {
    key: 'industrial',
    label: 'Industry',
    unit: 'B USD MVA',
    format: v => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}B`,
  },
  {
    key: 'agricultural',
    label: 'Agriculture',
    unit: 'B USD GPV',
    format: v => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}B`,
  },
];

export const DEFAULT_COLORS = [
  '#4e79a7', '#f28e2b', '#59a14f', '#e15759',
  '#76b7b2', '#edc948', '#b07aa1', '#ff9da7',
  '#9c755f', '#bab0ac',
];
