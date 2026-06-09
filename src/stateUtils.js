/** Indian states — mirrors ssa-compliance-backend clraConstants STATES */
export const STATE_NAME_TO_CODE = {
  "andaman & nicobar": "an",
  "andhra pradesh": "ap",
  "arunachal pradesh": "ar",
  assam: "as",
  bihar: "br",
  chandigarh: "ch",
  chattisgarh: "cg",
  "dadra & nagar haveli": "dh",
  "daman & diu": "dd",
  delhi: "dl",
  goa: "ga",
  gujarat: "gj",
  haryana: "hr",
  "himachal pradesh": "hp",
  "jammu & kashmir": "jk",
  jharkhand: "jh",
  karnataka: "ka",
  kerala: "kl",
  lakshadweep: "ld",
  "madhya pradesh": "mp",
  maharashtra: "mh",
  manipur: "mn",
  meghalaya: "ml",
  mizoram: "mz",
  nagaland: "nl",
  odisha: "or",
  pondicherry: "py",
  punjab: "pb",
  rajasthan: "rj",
  sikkim: "sk",
  "tamil nadu": "tn",
  telangana: "ts",
  tripura: "tr",
  "uttar pradesh": "up",
  uttarakhand: "uk",
  "west bengal": "wb",
};

const CODE_TO_NAME = Object.fromEntries(
  Object.entries(STATE_NAME_TO_CODE).map(([name, code]) => [
    code.toLowerCase(),
    name,
  ]),
);

const ALIASES = {
  wb: "west bengal",
  up: "uttar pradesh",
  mp: "madhya pradesh",
  ap: "andhra pradesh",
  ts: "telangana",
  tg: "telangana",
  tn: "tamil nadu",
  mh: "maharashtra",
  gj: "gujarat",
  ka: "karnataka",
  kl: "kerala",
  dl: "delhi",
  hr: "haryana",
  pb: "punjab",
  rj: "rajasthan",
  or: "odisha",
  od: "odisha",
  br: "bihar",
  jh: "jharkhand",
  as: "assam",
  cg: "chattisgarh",
  ch: "chandigarh",
  uk: "uttarakhand",
  hp: "himachal pradesh",
  ga: "goa",
};

/** @param {string} raw */
export function normalizeStateKey(raw) {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!s) return "";
  if (STATE_NAME_TO_CODE[s]) return s;
  if (CODE_TO_NAME[s]) return CODE_TO_NAME[s];
  if (ALIASES[s]) return ALIASES[s];
  for (const [name, code] of Object.entries(STATE_NAME_TO_CODE)) {
    if (s === code.toLowerCase()) return name;
    if (name.includes(s) || s.includes(name)) return name;
  }
  return s;
}

/** @param {string} key normalized state key */
export function stateDisplayLabel(key) {
  if (!key) return "";
  return key.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** @param {string} key */
export function isKnownStateKey(key) {
  return Boolean(key && STATE_NAME_TO_CODE[key]);
}

const STATE_NAMES_BY_LENGTH = Object.keys(STATE_NAME_TO_CODE).sort(
  (a, b) => b.length - a.length,
);

/**
 * Infer Indian state from a free-text address when no state column exists.
 * @param {string} address
 * @returns {string} normalized state key, or ""
 */
export function extractStateFromAddress(address) {
  const raw = String(address || "").trim();
  if (!raw) return "";
  const s = raw.toLowerCase().replace(/\s+/g, " ");

  for (const name of STATE_NAMES_BY_LENGTH) {
    if (s.includes(name)) return name;
  }

  const tokens = s.split(/[,;\n/|]+/).flatMap((part) => part.trim().split(/\s+/));
  for (const token of tokens) {
    const key = normalizeStateKey(token);
    if (isKnownStateKey(key)) return key;
  }

  return "";
}
