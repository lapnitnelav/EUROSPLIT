import { EU_COUNTRIES } from './data.js';

const COUNTRY_LIST = EU_COUNTRIES.map(c => c.name).join(', ');

const SYSTEM_PROMPT = `You are a geopolitical analyst helping to group EU countries into blocs.

Available EU countries: ${COUNTRY_LIST}

Given a grouping description, respond with ONLY a valid JSON object — no explanation, no markdown, no code fences — in this exact format:
{
  "groups": [
    { "name": "Group Name", "countries": ["Country1", "Country2"] },
    ...
  ]
}

Rules:
- Every EU country must appear in exactly one group.
- Use the exact country names from the list above.
- Group names should be concise (2-4 words).`;

/**
 * Ask local Ollama to produce a grouping from a text prompt.
 * Returns the parsed groups array.
 * @param {string} prompt
 * @param {string} model
 * @returns {Promise<Array<{name:string, countries:string[]}>>}
 */
export async function queryLLM(prompt, model) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama responded with ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.message?.content ?? data.response ?? '';

  // Extract first JSON object from the response (model may add preamble)
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in model response.');

  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new Error('Model returned invalid JSON.');
  }

  if (!Array.isArray(parsed.groups) || parsed.groups.length === 0) {
    throw new Error('Unexpected JSON shape — expected { groups: [...] }');
  }

  return parsed.groups;
}
