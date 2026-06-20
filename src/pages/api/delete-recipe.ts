export const POST = async ({ request }: { request: Request }) => {
  const GITHUB_TOKEN  = import.meta.env.GITHUB_TOKEN;
  const GITHUB_OWNER  = import.meta.env.GITHUB_OWNER;
  const GITHUB_REPO   = import.meta.env.GITHUB_REPO;
  const GITHUB_BRANCH = import.meta.env.GITHUB_BRANCH;

  const authHeader = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
  };

  const { slug, folder, image } = await request.json();

  if (!slug || !folder) {
    return new Response(JSON.stringify({ error: 'slug and folder are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async function deleteGithubFile(path: string): Promise<void> {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const getRes = await fetch(url, { headers: authHeader });
    if (!getRes.ok) return; // File not found; treat as no-op

    const { sha } = await getRes.json();

    const delRes = await fetch(url, {
      method: 'DELETE',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Delete: ${path.split('/').pop()}`,
        sha,
        branch: GITHUB_BRANCH,
      }),
    });

    if (!delRes.ok) {
      const err = await delRes.json().catch(() => ({}));
      throw new Error(`GitHub delete failed for "${path}": ${err.message ?? delRes.statusText}`);
    }
  }

  try {
    await deleteGithubFile(`content/recipes/${folder}/${slug}.md`);

    // image is stored as e.g. "/images/recipes/slug.jpg" in frontmatter.
    // The actual repo path is "public/images/recipes/slug.jpg".
    // Fail silently if no image or image not found.
    if (image) {
      await deleteGithubFile(`public${image}`).catch(() => {});
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[delete-recipe]', err);
    return new Response(JSON.stringify({ error: err.message ?? 'Internal server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};