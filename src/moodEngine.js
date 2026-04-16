// moodEngine.js — Z.E.U.S. Adaptive Personality Engine

export const MOODS = {
  URGENT:    'urgent',
  TECHNICAL: 'technical',
  CASUAL:    'casual',
  FRUSTRATED:'frustrated',
  CURIOUS:   'curious',
  DEFAULT:   'default',
};

const URGENT_WORDS    = ['asap','urgent','now','immediately','hurry','quick','fast','critical','emergency'];
const FRUSTRATED_WORDS= ['ugh','wtf','broken','not working','useless','stupid','again','failed','crash','error'];
const TECHNICAL_WORDS = ['code','bug','api','error','function','debug','deploy','git','script','build','install','port','config','null','undefined','exception','stack','trace','syntax'];
const CURIOUS_WORDS   = ['how','why','what is','explain','tell me','curious','wonder','interesting','learn'];
const CASUAL_WORDS    = ['hey','hi','hello','sup','yo','thanks','nice','cool','okay','ok','lol','haha'];

export function detectMood(text) {
  const lower = text.toLowerCase();

  const score = (wordList) =>
    wordList.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);

  const scores = {
    [MOODS.FRUSTRATED]: score(FRUSTRATED_WORDS) * 3,
    [MOODS.URGENT]:     score(URGENT_WORDS) * 2,
    [MOODS.TECHNICAL]:  score(TECHNICAL_WORDS) * 2,
    [MOODS.CASUAL]:     score(CASUAL_WORDS),
    [MOODS.CURIOUS]:    score(CURIOUS_WORDS),
  };

  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return top[1] > 0 ? top[0] : MOODS.DEFAULT;
}

export function getSystemPrompt(mood) {
  const base = `You are Z.E.U.S. — Zero-latency Executive Universal System. You are Aditya Machiraju's personal Iron Man style AI assistant. Address him as "sir" or "Aditya".`;

  const tones = {
    [MOODS.URGENT]:     `${base} Aditya is in URGENT mode. Be extremely concise, bullet-pointed, action-first. No fluff. Prioritize speed.`,
    [MOODS.TECHNICAL]:  `${base} Aditya is in TECHNICAL mode. Be precise, use correct terminology, show code when relevant, skip pleasantries.`,
    [MOODS.FRUSTRATED]: `${base} Aditya is FRUSTRATED. Be calm, direct, and solution-focused. Acknowledge the issue briefly, then fix it. No lectures.`,
    [MOODS.CURIOUS]:    `${base} Aditya is CURIOUS. Be engaging and insightful. Explain clearly, use an analogy if helpful. Show enthusiasm for the topic.`,
    [MOODS.CASUAL]:     `${base} Aditya is in CASUAL mode. Be warm, witty, and conversational — like Jarvis on a good day. Light humour is welcome.`,
    [MOODS.DEFAULT]:    `${base} You are sharp, confident, and slightly futuristic in tone. Keep responses concise and powerful.`,
  };

  return tones[mood] || tones[MOODS.DEFAULT];
}

export const MOOD_LABELS = {
  [MOODS.URGENT]:     '⚡ URGENT',
  [MOODS.TECHNICAL]:  '⚙ TECHNICAL',
  [MOODS.FRUSTRATED]: '⚠ FRUSTRATED',
  [MOODS.CURIOUS]:    '◎ CURIOUS',
  [MOODS.CASUAL]:     '◈ CASUAL',
  [MOODS.DEFAULT]:    '◆ NOMINAL',
};