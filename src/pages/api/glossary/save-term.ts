const GITHUB_PATH = 'content/glossary/glossary.json';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
}

function slugify(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function getEnv() {
  return {
    GITHUB_TOKEN:  import.meta.env.GITHUB_TOKEN,
    GITHUB_OWNER:  import.meta.env.GITHUB_OWNER,
    GITHUB_REPO:   import.meta.env.GITHUB_REPO,
    GITHUB_BRANCH: import.meta.env.GITHUB_BRANCH,
  };
}

async function readGlossary(env: ReturnType<typeof getEnv>) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${GITHUB_PATH}?ref=${env.GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: authHeaders(env.GITHUB_TOKEN) });
  if (!res.ok) throw new Error(`Could not read glossary.json: ${res.statusText}`);
  const file = await res.json();
  const content = Buffer.from(file.content, 'base64').toString('utf8');
  return { terms: JSON.parse(content), sha: file.sha };
}

async function writeGlossary(env: ReturnType<typeof getEnv>, terms: any[], sha: string) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${GITHUB_PATH}`;
  const body = {
    message: 'Update glossary.json',
    content: Buffer.from(JSON.stringify(terms, null, 2), 'utf8').toString('base64'),
    branch:  env.GITHUB_BRANCH,
    sha,
  };
  const res = await fetch(url, {
    method:  'PUT',
    headers: { ...authHeaders(env.GITHUB_TOKEN), 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? res.statusText);
  }
}

export const POST = async ({ request }: { request: Request }) => {
  const env = getEnv();
  const payload = await request.json();

  const term = payload.term?.trim();
  const definitionHtml = payload.definitionHtml?.trim();
  const originalSlug: string | null = payload.originalSlug ?? null;

  if (!term || !definitionHtml) {
    return new Response(JSON.stringify({ error: 'Term and definition are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { terms, sha } = await readGlossary(env);
    const newSlug = slugify(term);

    const existingIndex = terms.findIndex((t: any) => t.slug === (originalSlug ?? newSlug));

    // Prevent collisions with a *different* entry when renaming
    const collision = terms.some((t: any, i: number) => t.slug === newSlug && i !== existingIndex);
    if (collision) {
      return new Response(JSON.stringify({ error: 'A term with that name already exists.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const entry = { slug: newSlug, term, definitionHtml };

    if (existingIndex >= 0) {
      terms[existingIndex] = entry;
    } else {
      terms.push(entry);
    }

    await writeGlossary(env, terms, sha);

    return new Response(JSON.stringify({ ok: true, slug: newSlug }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[save-term]', err);
    return new Response(JSON.stringify({ error: err.message ?? 'Internal server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};