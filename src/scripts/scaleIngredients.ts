// ── FRACTION MAPS ──────────────────────────────────────────────────────────

// Input parser — includes ⅙/⅚ so authored recipes using them read correctly
const FRAC_MAP: Record<string, number> = {
  '½': 1/2, '⅓': 1/3, '⅔': 2/3, '¼': 1/4, '¾': 3/4,
  '⅛': 1/8, '⅜': 3/8, '⅝': 5/8, '⅞': 7/8, '⅙': 1/6, '⅚': 5/6,
};

const FRAC_CHARS = Object.keys(FRAC_MAP).join('');

// Output snapper — ⅙/⅚ excluded, not real cooking measurements
const COOKING_FRACS: [number, string][] = [
  [1/8, '⅛'], [1/4, '¼'], [1/3, '⅓'],
  [3/8, '⅜'], [1/2, '½'], [2/3, '⅔'], [3/4, '¾'],
  [7/8, '⅞'],
];

// ── HELPERS ────────────────────────────────────────────────────────────────

const TOLERANCE = 0.04;
const near       = (a: number, b: number) => Math.abs(a - b) < TOLERANCE;
const isMultiple = (n: number, d: number) => near(n % d, 0) || near(n % d, d);

// ── PARSERS ────────────────────────────────────────────────────────────────

/** Parses an integer, decimal, unicode fraction, or mixed number (e.g. "1¼"). */
function parseNum(str: string): number | null {
  const re = new RegExp(`^(\\d+\\.?\\d*)?([${FRAC_CHARS}])?$`);
  const m  = str.trim().match(re);
  if (!m || (!m[1] && !m[2])) return null;
  let v = m[1] ? parseFloat(m[1]) : 0;
  if (m[2]) v += FRAC_MAP[m[2]] ?? 0;
  return v > 0 ? v : null;
}

// ── FORMATTERS ─────────────────────────────────────────────────────────────

/** Snaps a decimal to the nearest common cooking fraction.
 *  e.g. 1.333 → "1⅓", 0.5 → "½", 2 → "2" */
function toFrac(n: number): string {
  if (n <= 0) return '0';
  const whole = Math.floor(n);
  const rem   = n - whole;

  if (rem < TOLERANCE)        return String(whole || 0);
  if (rem > 1 - TOLERANCE)    return String(whole + 1);

  let best = COOKING_FRACS[0];
  for (const f of COOKING_FRACS) {
    if (Math.abs(f[0] - rem) < Math.abs(best[0] - rem)) best = f;
  }
  return whole > 0 ? `${whole}${best[1]}` : best[1];
}

/** Formats metric values with sensible precision.
 *  ≥10: whole number. 1–9: one decimal. <1: two decimals. */
function formatMetric(n: number): string {
  if (n >= 10) return String(Math.round(n));
  if (n >= 1)  return String(parseFloat(n.toFixed(1)));
  return String(parseFloat(n.toFixed(2)));
}

// ── UNIT CONVERSION ────────────────────────────────────────────────────────

/** Converts a fraction of a cup to the friendliest tbsp + tsp expression. */
function cupsToTbspTsp(cups: number): string {
  const totalTbsp = cups * 16;

  // Less than 1 tbsp — express entirely in tsp
  if (totalTbsp < 1 - TOLERANCE) {
    return toFrac(totalTbsp * 3) + ' tsp';
  }

  const wholeTbsp = Math.floor(totalTbsp + TOLERANCE);
  const remTbsp   = totalTbsp - wholeTbsp;
  const remTsp    = remTbsp * 3;
  const nearTsp   = Math.round(remTsp);
  const hasTsp    = nearTsp > 0 && Math.abs(remTsp - nearTsp) < TOLERANCE + 0.05;

  const tbspStr = wholeTbsp > 0 ? toFrac(wholeTbsp) + ' tbsp' : '';
  const tspStr  = hasTsp       ? nearTsp + ' tsp'             : '';

  if (tbspStr && tspStr) return `${tbspStr} + ${tspStr}`;
  if (tbspStr)           return tbspStr;
  if (tspStr)            return tspStr;

  // Fallback: no clean tsp split — use fractional tbsp
  return toFrac(totalTbsp) + ' tbsp';
}

/** Applies unit conversion rules after scaling. Chains tsp→tbsp→cup recursively. */
function convertUnit(value: number, unit: string): string {
  // Normalize plural and trailing punctuation for switch matching
  const u = unit.toLowerCase().replace(/s$/, '').replace(/\.$/, '').trim();

  switch (u) {
    case 'tsp':
      // Exact multiple of 3 → tbsp
      if (value >= 3 && isMultiple(value, 3))
        return convertUnit(value / 3, 'tbsp');
      return toFrac(value) + ' tsp';

    case 'tbsp':
      // Exact multiple of 4 and ≥4 → cup
      if (value >= 4 && isMultiple(value, 4))
        return convertUnit(value / 16, 'cup');
      return toFrac(value) + ' tbsp';

    case 'cup': {
      // Downward: < ¼ cup → tbsp/tsp
      if (value < 0.25 - TOLERANCE)
        return cupsToTbspTsp(value);
      // Upward: exact multiple of 8 cups (½-gallon boundary), min 8 cups
      if (value >= 8 && isMultiple(value, 8)) {
        const gallons = value / 16;
        const sing = near(gallons, 1) || gallons < 1 - TOLERANCE;
        return toFrac(gallons) + (sing ? ' gallon' : ' gallons');
      }
      const sing = near(value, 1) || value < 1 - TOLERANCE;
      return toFrac(value) + (sing ? ' cup' : ' cups');
    }

    case 'ml':
      if (value >= 1000) return formatMetric(value / 1000) + ' l';
      return formatMetric(value) + ' ml';

    case 'l':   return formatMetric(value) + ' l';
    case 'g':   return formatMetric(value) + ' g';
    case 'kg':  return formatMetric(value) + ' kg';

    case 'oz':  return toFrac(value) + ' oz';
    case 'lb': {
      const sing = near(value, 1) || value < 1 - TOLERANCE;
      return toFrac(value) + (sing ? ' lb' : ' lbs');
    }

    case 'pint': {
      const sing = near(value, 1) || value < 1 - TOLERANCE;
      return toFrac(value) + (sing ? ' pint' : ' pints');
    }
    case 'quart': {
      const sing = near(value, 1) || value < 1 - TOLERANCE;
      return toFrac(value) + (sing ? ' quart' : ' quarts');
    }
    case 'gallon': {
      const sing = near(value, 1) || value < 1 - TOLERANCE;
      return toFrac(value) + (sing ? ' gallon' : ' gallons');
    }

    // Count descriptors — scale number, keep descriptor
    case 'large':
    case 'medium':
    case 'small':
    case 'whole':
      return toFrac(value) + ' ' + unit;

    // fl oz, unknown units — scale only
    default:
      return toFrac(value) + ' ' + unit;
  }
}

// ── REGEX ──────────────────────────────────────────────────────────────────

const NUM_PAT  = `[${FRAC_CHARS}\\d][${FRAC_CHARS}\\d\\.]*`;
const UNIT_PAT =
  'tbsp|tsp|fl\\.?\\s*oz|cups?|gallons?|pints?|quarts?|ml|lbs?|oz|kg|g|l|large|medium|small|whole';

const MEASURE_RE = new RegExp(
  `(?<![a-zA-Z])(${NUM_PAT})\\s*(${UNIT_PAT})(?=[^a-zA-Z]|$)`,
  'g',
);

// ── PUBLIC API ─────────────────────────────────────────────────────────────

/** Scales all measurement tokens in a count string (pure measurement text).
 *  e.g. scaleCount("113g (8 tbsp)", 2) → "226 g (¼ cup)"
 *  Applies unit conversion after scaling. */
export function scaleCount(countStr: string, factor: number): string {
  if (factor === 1) return countStr;

  return countStr.replace(MEASURE_RE, (_match, numStr, unitStr) => {
    const val = parseNum(numStr);
    if (val === null) return _match;
    return convertUnit(val * factor, unitStr);
  });
}

/** Scales the leading number in a yield string.
 *  e.g. scaleYield("16 brownies", 2) → "32 brownies" */
export function scaleYield(yieldStr: string, factor: number): string {
  if (factor === 1) return yieldStr;
  return yieldStr.replace(/\d+(\.\d+)?/, n => {
    const scaled = parseFloat(n) * factor;
    return Number.isInteger(scaled)
      ? String(scaled)
      : parseFloat(scaled.toFixed(1)).toString();
  });
}