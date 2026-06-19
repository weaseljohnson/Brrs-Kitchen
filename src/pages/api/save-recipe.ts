import yaml from 'js-yaml';

// ── CATEGORY → CONTENT FOLDER MAP ──
// Add new categories here as the site grows.
const CATEGORY_FOLDERS = {
  'Desserts': 'desserts',
  'Entrees':  'entrees',
  'Sides':    'sides',
  'Drinks':   'drinks',
  'Snacks':   'snacks',
  'Basics':   'basics',
};

// ── VALIDATION ──
function validate(payload) {
  const errors = [];
  if (!payload.title?.trim())    errors.push('Title is required.');
  if (!payload.slug?.trim())     errors.push('Slug is required.');
  if (!payload.category?.trim()) errors.push('Category is required.');
  if (!CATEGORY_FOLDERS[payload.category]) {
    errors.push(`Unknown category: "${payload.category}". Add it to CATEGORY_FOLDERS in save-recipe.js.`);
  }
  if (!payload.directions?.length) {
    errors.push('At least one direction step is required.');
  }
  return errors;
}

// ── MARKDOWN / FRONTMATTER BUILDER ──
function buildMarkdown(payload) {
  const fm = {};

  // Required fields
  fm.title    = payload.title;
  fm.category = payload.category;

  // Optional metadata
  if (payload.pubDate)  fm.pubDate  = payload.pubDate;
  if (payload.prepTime) fm.prepTime = payload.prepTime;
  if (payload.cookTime) fm.cookTime = payload.cookTime;
  if (payload.intro)    fm.intro    = payload.intro;
  if (payload.tags?.length)    fm.tags    = payload.tags;
  if (payload.dietary?.length) fm.dietary = payload.dietary;

  if (payload.image?.ext) {
    fm.image = `/images/recipes/${payload.slug}.${payload.image.ext}`;
  }

  if (payload.credit?.name && payload.credit?.url) {
    fm.credit = { name: payload.credit.name, url: payload.credit.url };
  }

  if (payload.hasNotes) fm.hasNotes = true;

  // Ingredients — pan variants vs. single pan
  if (payload.panVariants?.length) {
    fm.panVariants = payload.panVariants.map(v => ({
      id:    v.id,
      label: v.label,
      yield: v.yield,
      ingredients: v.ingredients.map(ing => {
        const obj = {};
        if (ing.count) obj.count = ing.count;
        obj.item = ing.item;
        return obj;
      }),
    }));
  } else {
    if (payload.yield)               fm.yield       = payload.yield;
    if (payload.ingredients?.length) fm.ingredients = payload.ingredients.map(ing => {
      const obj = {};
      if (ing.count) obj.count = ing.count;
      obj.item = ing.item;
      return obj;
    });
  }

  // Directions
  if (payload.directions?.length) {
    fm.directions = payload.directions.map(s => ({
      title: s.title,
      body:  s.body,
    }));
  }

  // Serialize frontmatter — lineWidth: -1 disables line wrapping
  const yamlStr = yaml.dump(fm, { lineWidth: -1 });

  // MD body is only used when hasNotes is true
  const body = (payload.hasNotes && payload.notes) ? payload.notes.trim() : '';

  return `---\n${yamlStr}---\n${body ? '\n' + body + '\n' : ''}`;
}

// ── GITHUB FILE WRITER ──
// Handles both create and update (fetches SHA for existing files).
async function githubWrite(path, content, isBase64 = false) {
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = process.env;

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
  const authHeader = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept:        'application/vnd.github+json',
  };

  // Encode content unless it's already base64 (image data)
  const encodedContent = isBase64
    ? content
    : Buffer.from(content, 'utf8').toString('base64');

  // Check for an existing file — required to get its SHA for updates
  let sha;
  const checkRes = await fetch(url, { headers: authHeader });
  if (checkRes.ok) {
    const existing = await checkRes.json();
    sha = existing.sha;
  }

  const filename = path.split('/').pop();
  const body = {
    message: sha ? `Update: ${filename}` : `Add: ${filename}`,
    content: encodedContent,
    branch:  GITHUB_BRANCH,
    ...(sha && { sha }),
  };

  const writeRes = await fetch(url, {
    method:  'PUT',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!writeRes.ok) {
    const err = await writeRes.json().catch(() => ({}));
    throw new Error(`GitHub write failed for "${path}": ${err.message ?? writeRes.statusText}`);
  }

  return writeRes.json();
}

// ── MAIN HANDLER ──
// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed.' });
//   }

//   // 2a — Validate
//   const payload = req.body;
//   const errors  = validate(payload);
//   if (errors.length) {
//     return res.status(400).json({ errors });
//   }

//   try {
//     // 2b — Build the markdown file string
//     const mdContent = buildMarkdown(payload);

//     // 2c — Commit .md file to GitHub
//     const folder = CATEGORY_FOLDERS[payload.category];
//     const mdPath = `content/recipes/${folder}/${payload.slug}.md`;
//     await githubWrite(mdPath, mdContent);

//     // 2d — Commit image to GitHub (if one was uploaded)
//     if (payload.image?.data) {
//       const imgPath = `public/images/recipes/${payload.slug}.${payload.image.ext}`;
//       await githubWrite(imgPath, payload.image.data, true);
//     }

//     // 2e — Success
//     return res.status(200).json({ ok: true, slug: payload.slug });

//   } catch (err) {
//     console.error('[save-recipe]', err);
//     return res.status(500).json({ error: err.message ?? 'Internal server error.' });
//   }
// }

// ── REPLACE THE MAIN HANDLER AT THE BOTTOM OF YOUR src/pages/api/save-recipe.ts ──

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Extract the JSON body using standard Web Request APIs
    const payload = await request.json();
    
    // Validate the payload
    const errors = validate(payload);
    if (errors.length) {
      return new Response(JSON.stringify({ errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build the markdown file string
    const mdContent = buildMarkdown(payload);

    // Commit .md file to GitHub
    const folder = CATEGORY_FOLDERS[payload.category as CategoryKey];
    const mdPath = `content/recipes/${folder}/${payload.slug}.md`;
    await githubWrite(mdPath, mdContent);

    // Commit image to GitHub (if one was uploaded)
    if (payload.image?.data && payload.image?.ext) {
      const imgPath = `public/images/recipes/${payload.slug}.${payload.image.ext}`;
      await githubWrite(imgPath, payload.image.data, true);
    }

    // Return native Web Response wrapper instead of res.status().json()
    return new Response(JSON.stringify({ ok: true, slug: payload.slug }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[save-recipe]', err);
    return new Response(JSON.stringify({ error: err.message ?? 'Internal server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};