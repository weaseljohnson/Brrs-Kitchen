import yaml from 'js-yaml';

export const POST = async ({ request }: { request: Request }) => {
  const GITHUB_TOKEN  = import.meta.env.GITHUB_TOKEN;
  const GITHUB_OWNER  = import.meta.env.GITHUB_OWNER;
  const GITHUB_REPO   = import.meta.env.GITHUB_REPO;
  const GITHUB_BRANCH = import.meta.env.GITHUB_BRANCH;

  const authHeader = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
  };

  const { slug, folder, archived } = await request.json();

  if (!slug || !folder) {
    return new Response(JSON.stringify({ error: 'slug and folder are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const filePath = `content/recipes/${folder}/${slug}.md`;
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

    const getRes = await fetch(url, { headers: authHeader });
    if (!getRes.ok) throw new Error(`File not found: ${filePath}`);

    const fileData = await getRes.json();
    const rawContent = Buffer.from(fileData.content, 'base64').toString('utf8');

    // Split on frontmatter boundary, preserving the body exactly as-is
    const fmMatch = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n?)([\s\S]*)/);
    if (!fmMatch) throw new Error('Could not parse frontmatter.');

    const [, fmYaml, linebreak, body] = fmMatch;
    const fm = yaml.load(fmYaml) as Record<string, unknown>;

    if (archived) {
      fm.archived = true;
    } else {
      delete fm.archived;
    }

    const newYaml    = yaml.dump(fm, { lineWidth: -1 });
    const newContent = `---\n${newYaml}---${linebreak}${body}`;
    const encoded    = Buffer.from(newContent, 'utf8').toString('base64');

    const writeRes = await fetch(url, {
      method: 'PUT',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${archived ? 'Archive' : 'Unarchive'}: ${slug}.md`,
        content: encoded,
        sha: fileData.sha,
        branch: GITHUB_BRANCH,
      }),
    });

    if (!writeRes.ok) {
      const err = await writeRes.json().catch(() => ({}));
      throw new Error(`GitHub write failed: ${err.message ?? writeRes.statusText}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[archive-recipe]', err);
    return new Response(JSON.stringify({ error: err.message ?? 'Internal server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};