import yaml from 'js-yaml';

export const GET = async () => {
  const GITHUB_TOKEN  = import.meta.env.GITHUB_TOKEN;
  const GITHUB_OWNER  = import.meta.env.GITHUB_OWNER;
  const GITHUB_REPO   = import.meta.env.GITHUB_REPO;
  const GITHUB_BRANCH = import.meta.env.GITHUB_BRANCH;

  const authHeader = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
  };

  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${GITHUB_BRANCH}?recursive=1`,
      { headers: authHeader }
    );
    if (!treeRes.ok) throw new Error(`GitHub API error: ${treeRes.statusText}`);

    const treeData = await treeRes.json();
    const recipeFiles = (treeData.tree ?? []).filter(
      f => f.type === 'blob'
        && f.path.startsWith('content/recipes/')
        && f.path.endsWith('.md')
        && !f.path.includes('.gitkeep')
    );

    const categorySet = new Set<string>();
    const tagSet      = new Set<string>();

    await Promise.all(recipeFiles.map(async (file) => {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${file.path}`,
        { headers: authHeader }
      );
      if (!res.ok) return;

      const fileData = await res.json();
      const content  = Buffer.from(fileData.content, 'base64').toString('utf8');
      const match    = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!match) return;

      const fm: any = yaml.load(match[1]) ?? {};
      if (fm.category && !fm.archived) categorySet.add(fm.category);
      if (Array.isArray(fm.tags))      fm.tags.forEach((t: string) => tagSet.add(t));
    }));

    return new Response(
      JSON.stringify({
        categories: [...categorySet].sort(),
        tags:       [...tagSet].sort(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};