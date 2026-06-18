// ─────────────────────────────────────────────────────────
// SEO UTILITIES
// Schema builders, time parsers, and JSON-LD helpers.
// All schema builders return plain objects — the @context
// and @graph wrapper is applied once in Layout.astro.
// ─────────────────────────────────────────────────────────


// ── TIME PARSING ─────────────────────────────────────────
// Converts human-readable time strings to ISO 8601 duration
// format required by Google's Recipe schema.
//
// Supported formats:
//   "15 min"        → "PT15M"
//   "1 hr 30 min"   → "PT1H30M"
//   "20–25 min"     → "PT25M"  (range: uses the maximum)
//   "2 hours"       → "PT2H"
//   "90"            → "PT90M"  (bare number assumes minutes)

export function parseTimeToISO(timeStr: string | undefined): string | undefined {
  if (!timeStr) return undefined;

  // For ranges (e.g. "20–25 min"), keep only the maximum value.
  // Handles both en dash (–) and hyphen (-).
  const normalized = timeStr.replace(/\d+\s*[–\-]\s*(\d+)/, '$1');

  let hours   = 0;
  let minutes = 0;

  const hourMatch = normalized.match(/(\d+)\s*h(?:r|rs|our|ours)?(?!\w)/i);
  if (hourMatch) hours = parseInt(hourMatch[1], 10);

  const minMatch = normalized.match(/(\d+)\s*m(?:in|ins|inute|inutes)?(?!\w)/i);
  if (minMatch) minutes = parseInt(minMatch[1], 10);

  // Bare number with no recognized unit — assume minutes
  if (!hourMatch && !minMatch) {
    const bareMatch = normalized.match(/(\d+)/);
    if (bareMatch) minutes = parseInt(bareMatch[1], 10);
  }

  if (hours === 0 && minutes === 0) return undefined;

  return `PT${hours > 0 ? `${hours}H` : ''}${minutes > 0 ? `${minutes}M` : ''}`;
}


// ── DURATION ADDITION ────────────────────────────────────
// Adds two ISO 8601 durations (for totalTime field).

export function addISODurations(
  a: string | undefined,
  b: string | undefined,
): string | undefined {
  if (!a && !b) return undefined;
  if (!a) return b;
  if (!b) return a;

  const parse = (iso: string) => ({
    hours:   parseInt(iso.match(/(\d+)H/)?.[1] ?? '0', 10),
    minutes: parseInt(iso.match(/(\d+)M/)?.[1] ?? '0', 10),
  });

  const da = parse(a);
  const db = parse(b);

  const totalMinutes = (da.hours + db.hours) * 60 + da.minutes + db.minutes;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  return `PT${h > 0 ? `${h}H` : ''}${m > 0 ? `${m}M` : ''}`;
}


// ── SAFE JSON-LD SERIALIZER ──────────────────────────────
// Escapes </script> sequences that would break HTML parsing
// if they appear inside a <script> tag's text content.

export function safeJsonLd(obj: object): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}


// ── SCHEMA BUILDERS ──────────────────────────────────────
// Each returns a plain object. The @context and @graph
// wrapper is added in Layout.astro when the page renders.

export function buildWebSiteSchema(origin: string): object {
  return {
    '@type': 'WebSite',
    name: "Brr's Kitchen",
    url: origin,
    // Uncomment and update target URL once site search is live:
    // potentialAction: {
    //   '@type': 'SearchAction',
    //   target: `${origin}/recipes?q={search_term_string}`,
    //   'query-input': 'required name=search_term_string',
    // },
  };
}

export function buildOrganizationSchema(origin: string): object {
  return {
    '@type': 'Organization',
    name: "Brr's Kitchen",
    url: origin,
    logo: `${origin}/images/logo/BK-Logo-Color.png`,
  };
}

export function buildWebPageSchema(
  title: string,
  description: string,
  url: string,
): object {
  return {
    '@type': 'WebPage',
    name: title,
    description,
    url,
  };
}

export function buildRecipeSchema(data: any, url: string, origin: string): object {
  const prepISO  = parseTimeToISO(data.prepTime);
  const cookISO  = parseTimeToISO(data.cookTime);
  const totalISO = addISODurations(prepISO, cookISO);

  // Use the first pan variant's ingredient list as the canonical list for schema.
  // Google's Recipe schema supports only one ingredient set.
  const ingredients: string[] = data.panVariants?.[0]?.ingredients ?? [];

  const instructions = (data.directions ?? []).map((step: any, i: number) => ({
    '@type':    'HowToStep',
    position:   i + 1,
    name:       step.title,
    text:       step.body,
  }));

  const keywords = [
    ...(data.tags    ?? []),
    ...(data.dietary ?? []),
  ].filter(Boolean).join(', ');

  const schema: Record<string, any> = {
    '@type':              'Recipe',
    name:                 data.title,
    author:               { '@type': 'Person', name: 'Brr' },
    url,
    recipeIngredient:     ingredients,
    recipeInstructions:   instructions,
    ...(data.intro    && { description:     data.intro }),
    ...(data.pubDate  && { datePublished:   data.pubDate }),
    ...(prepISO       && { prepTime:        prepISO }),
    ...(cookISO       && { cookTime:        cookISO }),
    ...(totalISO      && { totalTime:       totalISO }),
    ...(data.category && { recipeCategory:  data.category }),
    ...(keywords      && { keywords }),
    ...(data.image    && { image: [`${origin}${data.image}`] }),
    ...((data.panVariants?.[0]?.yield ?? data.yield) && {
      recipeYield: data.panVariants?.[0]?.yield ?? data.yield,
    }),
  };

  return schema;
}