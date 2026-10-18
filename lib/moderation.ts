// Server-side checks for public wishes: no links, no rude words (Indonesian + English).
// Admin approval stays the final safety net; this only stops the obvious cases.

const TLDS =
  'com|net|org|id|co|io|me|ly|xyz|info|biz|site|online|link|app|dev|gg|tk|top|club|shop|store|vip|live|tv|to|my|sg|us|uk|ru|cn|ws|cc';

const LINK_PATTERNS = [
  /(https?:\/\/|www\.)/i,
  /\S+@\S+\.\S+/,
  // "bit.ly", "s . id", "example[dot]com", "wa.me". The TLD must be lowercase, so a
  // missing space after a full stop ("forever.To") isn't taken for a link.
  new RegExp(`\\b[A-Za-z0-9-]+\\s*(\\.|\\[dot\\]|\\(dot\\))\\s*(${TLDS})\\b`)
];

export function containsLink(text: string): boolean {
  return LINK_PATTERNS.some((pattern) => pattern.test(text));
}

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's', '!': 'i' };

function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[013457@$!]/g, (char) => LEET[char] ?? char)
    .replace(/([a-z])\1+/g, '$1'); // "fuuuck" → "fuck"; word lists get the same treatment
}

// Whole words only: short words that also hide inside harmless ones ("masuk", "santai", "memekik").
const WORDS = [
  'asu', 'tai', 'taik', 'babi', 'bego', 'goblok', 'gblk', 'tolol', 'cuk', 'cok', 'kimak', 'puki', 'pukimak',
  'perek', 'coli', 'sange', 'lonte', 'memek', 'peler', 'pepek', 'pantek', 'bencong', 'kampret', 'keparat',
  'brengsek', 'anjg', 'njing', 'entot', 'dick', 'sex', 'porn', 'idiot', 'cunt', 'slut', 'whore',
  'bastard', 'retard', 'nigga'
].map(normalize);
// Not listed: "ass" and "nigger" collapse to "as" and "niger" ("asshole" is a stem below).

// Unambiguous stems: also matched inside a word ("ngentotin", "fucking", "anjingg").
const STEMS = [
  'kontol', 'ngentot', 'anjing', 'bangsat', 'bajingan', 'jancok', 'jancuk', 'pelacur', 'bokep', 'jembut',
  'goblok', 'tolol', 'lonte', 'fuck', 'shit', 'bitch', 'pussy', 'asshole'
].map(normalize);

const WORD_SET = new Set(WORDS);

function isRude(word: string): boolean {
  return WORD_SET.has(word) || STEMS.some((stem) => word.includes(stem));
}

export function containsProfanity(text: string): boolean {
  const tokens = normalize(text).split(/[^a-z]+/).filter(Boolean);
  if (tokens.some(isRude)) return true;
  // Letters written apart ("a n j i n g", "k.o.n.t.o.l") form runs of one-letter tokens.
  let run = '';
  for (const token of [...tokens, '']) {
    if (token.length === 1) {
      run += token;
      continue;
    }
    if (run.length >= 3 && isRude(normalize(run))) return true;
    run = '';
  }
  return false;
}

export type ModerationResult = { ok: true } | { ok: false; reason: 'link' | 'profanity' };

export function moderateMessage(text: string): ModerationResult {
  if (containsLink(text)) return { ok: false, reason: 'link' };
  if (containsProfanity(text)) return { ok: false, reason: 'profanity' };
  return { ok: true };
}
