// src/scripts/adminFormHelpers.js
// Shared form-building utilities for the admin recipe form.

export function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function makeIngRow(count = '', item = '') {
  const row = document.createElement('div');
  row.className = 'ing-row';
  row.innerHTML = `
    <input type="text" class="admin-input ing-count" placeholder="60g (⅔ cup)" value="${count}" />
    <input type="text" class="admin-input ing-item" placeholder="ingredient name" value="${item}" />
    <div class="ing-controls" style="display:flex;gap:var(--space-1);">
      <button type="button" class="admin-btn admin-btn--ghost ing-up" aria-label="Move up">↑</button>
      <button type="button" class="admin-btn admin-btn--ghost ing-dn" aria-label="Move down">↓</button>
      <button type="button" class="admin-btn admin-btn--ghost ing-remove" aria-label="Remove">✕</button>
    </div>
  `;
  row.querySelector('.ing-remove').addEventListener('click', () => row.remove());
  row.querySelector('.ing-up').addEventListener('click', () => {
    const prev = row.previousElementSibling;
    if (prev) row.parentNode.insertBefore(row, prev);
  });
  row.querySelector('.ing-dn').addEventListener('click', () => {
    const next = row.nextElementSibling;
    if (next) row.parentNode.insertBefore(next, row);
  });
  return row;
}

export function makeNoteEntry(value = '') {
  const entry = document.createElement('div');
  entry.className = 'note-entry';
  entry.innerHTML = `
    <input type="text" class="admin-input note-input"
      placeholder="Tip, variation, storage info…"
      value="${value.replace(/"/g, '&quot;')}" />
    <button type="button" class="admin-btn admin-btn--ghost note-remove"
      aria-label="Remove note">✕</button>
  `;
  entry.querySelector('.note-remove').addEventListener('click', () => entry.remove());
  return entry;
}

export function renumberVariants() {
  document.querySelectorAll('.variant-block').forEach((b, i) => {
    b.querySelector('.variant-head-label').textContent = `Variant ${i + 1}`;
  });
}

export function makeVariantBlock(index) {
  const block = document.createElement('div');
  block.className = 'variant-block';
  block.innerHTML = `
    <div class="variant-head">
      <span class="variant-head-label">Variant ${index + 1}</span>
      <button type="button" class="admin-btn admin-btn--danger variant-remove-btn">Remove</button>
    </div>
    <div class="variant-meta">
      <div class="admin-field admin-field--no-margin">
        <label class="admin-label">Label</label>
        <input type="text" class="admin-input variant-label" placeholder="8×8 Pan" />
      </div>
      <div class="admin-field admin-field--no-margin">
        <label class="admin-label">Yield</label>
        <input type="text" class="admin-input variant-yield" placeholder="16 brownies" />
      </div>
    </div>
    <div class="variant-ing-headers">
      <span class="admin-label">Amount</span>
      <span class="admin-label">Ingredient</span>
    </div>
    <div class="variant-ing-list"></div>
    <button type="button" class="admin-btn admin-btn--ghost variant-add-ing-btn"
      style="margin-top:var(--space-2);">+ Add Ingredient</button>
  `;
  block.querySelector('.variant-remove-btn').addEventListener('click', () => {
    block.remove();
    renumberVariants();
  });
  block.querySelector('.variant-add-ing-btn').addEventListener('click', () => {
    block.querySelector('.variant-ing-list').appendChild(makeIngRow());
  });
  block.querySelector('.variant-ing-list').appendChild(makeIngRow());
  return block;
}

export function makeIngredientGroupBlock() {
  const block = document.createElement('div');
  block.className = 'ing-group-block';
  block.innerHTML = `
    <div class="ing-group-head">
      <input type="text" class="admin-input ing-group-name"
        placeholder="Group name (e.g. For the Sauce)" />
      <button type="button" class="admin-btn admin-btn--danger ing-group-remove"
        aria-label="Remove Group">✕</button>
    </div>
    <div class="ing-col-headers">
      <span class="admin-label">Amount</span>
      <span class="admin-label">Ingredient</span>
    </div>
    <div class="ing-group-list"></div>
    <button type="button" class="admin-btn admin-btn--ghost ing-group-add-btn"
      style="margin-top:var(--space-2);">+ Add Ingredient</button>
  `;
  block.querySelector('.ing-group-remove').addEventListener('click', () => block.remove());
  block.querySelector('.ing-group-add-btn').addEventListener('click', () => {
    block.querySelector('.ing-group-list').appendChild(makeIngRow());
  });
  block.querySelector('.ing-group-list').appendChild(makeIngRow());
  return block;
}

export function renumberSteps() {
  document.querySelectorAll('.step-block').forEach((b, i) => {
    b.querySelector('.step-num').textContent = i + 1;
  });
}

export function makeStepBlock(index) {
  const block = document.createElement('div');
  block.className = 'step-block';
  block.innerHTML = `
    <span class="step-num">${index + 1}</span>
    <div class="step-fields">
      <input type="text" class="admin-input step-title-input"
        placeholder="Step title (e.g. Brown the butter)" />
      <textarea class="admin-textarea step-body-input" rows="3"
        placeholder="Step instructions..."></textarea>
    </div>
    <div class="step-controls">
      <button type="button" class="admin-btn admin-btn--ghost step-up-btn" aria-label="Move step up">↑</button>
      <button type="button" class="admin-btn admin-btn--ghost step-dn-btn" aria-label="Move step down">↓</button>
      <button type="button" class="admin-btn admin-btn--ghost step-rm-btn" aria-label="Remove step">✕</button>
    </div>
  `;
  block.querySelector('.step-up-btn').addEventListener('click', () => {
    const prev = block.previousElementSibling;
    if (prev) block.parentNode.insertBefore(block, prev);
    renumberSteps();
  });
  block.querySelector('.step-dn-btn').addEventListener('click', () => {
    const next = block.nextElementSibling;
    if (next) block.parentNode.insertBefore(next, block);
    renumberSteps();
  });
  block.querySelector('.step-rm-btn').addEventListener('click', () => {
    block.remove();
    renumberSteps();
  });
  return block;
}

export function addChip(container, value, type) {
  const chip = document.createElement('span');
  chip.className = 'admin-chip' + (type === 'dietary' ? ' admin-chip--dietary' : '');
  chip.dataset.value = value;
  chip.innerHTML = `${value}<button type="button" class="admin-chip__remove"
    aria-label="Remove ${value}">✕</button>`;
  chip.querySelector('.admin-chip__remove').addEventListener('click', () => chip.remove());
  container.appendChild(chip);
}