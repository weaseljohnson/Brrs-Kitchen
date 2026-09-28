export class GithubError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'GithubError';
  }
}
/** Thrown by create-only writes when the file already exists. */
export class GithubConflictError extends GithubError {}

function config() {
  const token  = import.meta.env.GITHUB_TOKEN;
  const owner  = import.meta.env.GITHUB_OWNER;
  const repo   = import.meta.env.GITHUB_REPO;
  const branch = import.meta.env.GITHUB_BRANCH;
  if (!token || !owner || !repo || !branch) {
    throw new GithubError('GitHub environment variables are not configured.', 500);
  }
  return { token, owner, repo, branch };
}

function headers(json = false): Record<string, string> {
  return {
    Authorization: `Bearer ${config().token}`,
    Accept: 'application/vnd.github+json',
    ...(json && { 'Content-Type': 'application/json' }),
  };
}

function contentsUrl(path: string): string {
  const { owner, repo } = config();
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encoded}`;
}

async function fail(res: Response, what: string): Promise<never> {
  const err = await res.json().catch(() => ({}));
  throw new GithubError(`${what}: ${err.message ?? res.statusText}`, res.status);
}

/** Returns the file (utf8 text + sha), or null if it doesn't exist. */
export async function getFile(path: string): Promise<{ sha: string; text: string } | null> {
  const res = await fetch(`${contentsUrl(path)}?ref=${config().branch}`, { headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) return fail(res, `GitHub read failed for "${path}"`);
  const data = await res.json();
  return { sha: data.sha, text: Buffer.from(data.content ?? '', 'base64').toString('utf8') };
}

export async function fileExists(path: string): Promise<boolean> {
  return (await getFile(path)) !== null;
}

interface WriteOptions {
  message?: string;
  isBase64?: boolean;
  /** 'create' fails with GithubConflictError if the file exists. 'upsert' overwrites. */
  mode?: 'create' | 'upsert';
}

export async function writeFile(path: string, content: string, opts: WriteOptions = {}) {
  const { message, isBase64 = false, mode = 'upsert' } = opts;
  const filename = path.split('/').pop();

  const existing = await getFile(path);
  if (existing && mode === 'create') {
    throw new GithubConflictError(`"${path}" already exists.`, 409);
  }

  const res = await fetch(contentsUrl(path), {
    method: 'PUT',
    headers: headers(true),
    body: JSON.stringify({
      message: message ?? `${existing ? 'Update' : 'Add'}: ${filename}`,
      content: isBase64 ? content : Buffer.from(content, 'utf8').toString('base64'),
      branch:  config().branch,
      ...(existing && { sha: existing.sha }),
    }),
  });

  // 422 = GitHub rejected a no-sha PUT because the file appeared meanwhile (race)
  if (res.status === 422 && mode === 'create') {
    throw new GithubConflictError(`"${path}" already exists.`, 409);
  }
  if (!res.ok) return fail(res, `GitHub write failed for "${path}"`);
  return res.json();
}

export async function deleteFile(path: string): Promise<void> {
  const existing = await getFile(path);
  if (!existing) return;
  const res = await fetch(contentsUrl(path), {
    method: 'DELETE',
    headers: headers(true),
    body: JSON.stringify({
      message: `Delete: ${path.split('/').pop()}`,
      sha: existing.sha,
      branch: config().branch,
    }),
  });
  if (!res.ok) await fail(res, `GitHub delete failed for "${path}"`);
}

/** All file paths in the repo under a prefix, via one Trees API call. */
export async function listPaths(prefix: string): Promise<string[]> {
  const { owner, repo, branch } = config();
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: headers() },
  );
  if (!res.ok) return fail(res, 'GitHub tree read failed');
  const data = await res.json();
  return (data.tree ?? [])
    .filter((f: { type: string; path: string }) => f.type === 'blob' && f.path.startsWith(prefix))
    .map((f: { path: string }) => f.path);
}