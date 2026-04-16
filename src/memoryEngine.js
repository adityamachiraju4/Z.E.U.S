// memoryEngine.js — Z.E.U.S. Persistent Memory Engine

const MEMORY_KEY = 'zeus_memory';

const DEFAULT_MEMORY = {
  name: 'Aditya',
  sessionCount: 0,
  lastSeen: null,
  lastMood: 'default',
  lastTopic: null,
  facts: {},         // e.g. { role: 'cybersecurity professional', device: 'MacBook Air M2' }
  preferences: {},   // e.g. { responseStyle: 'concise' }
};

export function loadMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return { ...DEFAULT_MEMORY };
    return { ...DEFAULT_MEMORY, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_MEMORY };
  }
}

export function saveMemory(memory) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch (e) {
    console.error('Memory save failed:', e);
  }
}

export function updateMemory(updates) {
  const current = loadMemory();
  const updated = { ...current, ...updates };
  saveMemory(updated);
  return updated;
}

export function incrementSession() {
  const memory = loadMemory();
  return updateMemory({
    sessionCount: memory.sessionCount + 1,
    lastSeen: new Date().toISOString(),
  });
}

export function addFact(key, value) {
  const memory = loadMemory();
  return updateMemory({
    facts: { ...memory.facts, [key]: value },
  });
}

export function clearMemory() {
  localStorage.removeItem(MEMORY_KEY);
  return { ...DEFAULT_MEMORY };
}

export function getGreeting(memory) {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const greetings = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
  };

  const base = greetings[timeOfDay];

  if (memory.sessionCount === 0) {
    return `▸ SYSTEM ONLINE — ${base.toUpperCase()}, ADITYA. FIRST BOOT DETECTED. ALL SYSTEMS NOMINAL.`;
  }

  const lastSeen = memory.lastSeen ? new Date(memory.lastSeen) : null;
  const hoursSince = lastSeen
    ? Math.floor((Date.now() - lastSeen.getTime()) / 3600000)
    : null;

  if (hoursSince !== null && hoursSince < 1) {
    return `▸ WELCOME BACK, ADITYA. SYSTEMS RESTORED. SESSION ${memory.sessionCount + 1} ACTIVE.`;
  }

  if (hoursSince !== null && hoursSince < 24) {
    return `▸ ${base.toUpperCase()}, ADITYA. GOOD TO HAVE YOU BACK. SESSION ${memory.sessionCount + 1} INITIALIZED.`;
  }

  return `▸ ${base.toUpperCase()}, ADITYA. IT'S BEEN A WHILE. SESSION ${memory.sessionCount + 1} ONLINE — READY WHEN YOU ARE.`;
}

export function buildMemoryContext(memory) {
  const facts = Object.entries(memory.facts)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  const prefs = Object.entries(memory.preferences)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  if (!facts && !prefs) return '';

  return `\n\nAditya's remembered context:\n${facts}${prefs ? '\nPreferences:\n' + prefs : ''}`;
}