const KEY = 'eurosplit_scenarios';

/** @returns {Array<{id,name,savedAt,groups,assignments,excludedIds,includedExtraIds}>} */
export function listScenarios() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveScenario(name, groups, assignments, excludedIds, includedExtraIds) {
  const scenarios = listScenarios();
  const existing  = scenarios.findIndex(s => s.name === name);
  const entry = {
    id: existing >= 0 ? scenarios[existing].id : crypto.randomUUID(),
    name,
    savedAt: new Date().toISOString(),
    groups:          JSON.parse(JSON.stringify(groups)),
    assignments:     { ...assignments },
    excludedIds:     [...excludedIds],
    includedExtraIds:[...includedExtraIds],
  };
  if (existing >= 0) {
    scenarios[existing] = entry;
  } else {
    scenarios.push(entry);
  }
  localStorage.setItem(KEY, JSON.stringify(scenarios));
  return entry.id;
}

export function deleteScenario(id) {
  const scenarios = listScenarios().filter(s => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(scenarios));
}
