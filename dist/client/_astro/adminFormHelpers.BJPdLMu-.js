function o(t){return t.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/['’]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function i(t="",e=""){const n=document.createElement("div");return n.className="ing-row",n.innerHTML=`
    <input type="text" class="admin-input ing-count" placeholder="60g (⅔ cup)" value="${t}" />
    <input type="text" class="admin-input ing-item" placeholder="ingredient name" value="${e}" />
    <div class="ing-controls" style="display:flex;gap:var(--space-1);">
      <button type="button" class="admin-btn admin-btn--ghost ing-up" aria-label="Move up">↑</button>
      <button type="button" class="admin-btn admin-btn--ghost ing-dn" aria-label="Move down">↓</button>
      <button type="button" class="admin-btn admin-btn--ghost ing-remove" aria-label="Remove">✕</button>
    </div>
  `,n.querySelector(".ing-remove").addEventListener("click",()=>n.remove()),n.querySelector(".ing-up").addEventListener("click",()=>{const a=n.previousElementSibling;a&&n.parentNode.insertBefore(n,a)}),n.querySelector(".ing-dn").addEventListener("click",()=>{const a=n.nextElementSibling;a&&n.parentNode.insertBefore(a,n)}),n}function s(t=""){const e=document.createElement("div");return e.className="note-entry",e.innerHTML=`
    <input type="text" class="admin-input note-input"
      placeholder="Tip, variation, storage info…"
      value="${t.replace(/"/g,"&quot;")}" />
    <button type="button" class="admin-btn admin-btn--ghost note-remove"
      aria-label="Remove note">✕</button>
  `,e.querySelector(".note-remove").addEventListener("click",()=>e.remove()),e}function l(){document.querySelectorAll(".variant-block").forEach((t,e)=>{t.querySelector(".variant-head-label").textContent=`Variant ${e+1}`})}function d(t){const e=document.createElement("div");return e.className="variant-block",e.innerHTML=`
    <div class="variant-head">
      <span class="variant-head-label">Variant ${t+1}</span>
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
  `,e.querySelector(".variant-remove-btn").addEventListener("click",()=>{e.remove(),l()}),e.querySelector(".variant-add-ing-btn").addEventListener("click",()=>{e.querySelector(".variant-ing-list").appendChild(i())}),e.querySelector(".variant-ing-list").appendChild(i()),e}function c(){const t=document.createElement("div");return t.className="ing-group-block",t.innerHTML=`
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
  `,t.querySelector(".ing-group-remove").addEventListener("click",()=>t.remove()),t.querySelector(".ing-group-add-btn").addEventListener("click",()=>{t.querySelector(".ing-group-list").appendChild(i())}),t.querySelector(".ing-group-list").appendChild(i()),t}function r(){document.querySelectorAll(".step-block").forEach((t,e)=>{t.querySelector(".step-num").textContent=e+1})}function p(t){const e=document.createElement("div");return e.className="step-block",e.innerHTML=`
    <span class="step-num">${t+1}</span>
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
  `,e.querySelector(".step-up-btn").addEventListener("click",()=>{const n=e.previousElementSibling;n&&e.parentNode.insertBefore(e,n),r()}),e.querySelector(".step-dn-btn").addEventListener("click",()=>{const n=e.nextElementSibling;n&&e.parentNode.insertBefore(n,e),r()}),e.querySelector(".step-rm-btn").addEventListener("click",()=>{e.remove(),r()}),e}function u(t,e,n){const a=document.createElement("span");a.className="admin-chip"+(n==="dietary"?" admin-chip--dietary":""),a.dataset.value=e,a.innerHTML=`${e}<button type="button" class="admin-chip__remove"
    aria-label="Remove ${e}">✕</button>`,a.querySelector(".admin-chip__remove").addEventListener("click",()=>a.remove()),t.appendChild(a)}export{u as a,c as b,s as c,p as d,d as e,i as m,l as r,o as s};
