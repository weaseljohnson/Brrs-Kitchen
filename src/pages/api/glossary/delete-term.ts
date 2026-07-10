const GITHUB_PATH = 'content/glossary/glossary.json';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
}

function getEnv() {
  return {
    GITHUB_TOKEN:  import.meta.env.GITHUB_TOKEN,
    GITHUB_OWNER:  import.meta.env.GITHUB_OWNER,
    GITHUB_REPO:   import.meta.env.GITHUB_REPO,
    GITHUB_BRANCH: import.meta.env.GITHUB_BRANCH,
  };
}

export const POST = async ({ request }: { request: Request }) => {
  const env = getEnv();
  const { slug } = await request.json();

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Slug is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const readUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${GITHUB_PATH}?ref=${env.GITHUB_BRANCH}`;
    const readRes = await fetch(readUrl, { headers: authHeaders(env.GITHUB_TOKEN) });
    if (!readRes.ok) throw new Error(`Could not read glossary.json: ${readRes.statusText}`);

    const file = await readRes.json();
    const terms = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    const updated = terms.filter((t: any) => t.slug !== slug);

    const writeUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${GITHUB_PATH}`;
    const writeRes = await fetch(writeUrl, {
      method:  'PUT',
      headers: { ...authHeaders(env.GITHUB_TOKEN), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Delete glossary term: ${slug}`,
        content: Buffer.from(JSON.stringify(updated, null, 2), 'utf8').toString('base64'),
        branch:  env.GITHUB_BRANCH,
        sha:     file.sha,
      }),
    });

    if (!writeRes.ok) {
      const err = await writeRes.json().catch(() => ({}));
      throw new Error(err.message ?? writeRes.statusText);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[delete-term]', err);
    return new Response(JSON.stringify({ error: err.message ?? 'Internal server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};