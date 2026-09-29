import{_}from"./preload-helper.CVfkMyKi.js";const a=document.getElementById("search-page-input"),r=document.getElementById("search-status"),i=document.getElementById("search-results");let n=null;async function p(){if(!n)try{n=await _(()=>import("/pagefind/pagefind.js"),[]),await n.init()}catch{n=null}}async function d(t){if(!t.trim()){r.textContent="",i.innerHTML="";return}if(await p(),!n){r.textContent="Search unavailable — run a production build to enable it.";return}r.textContent="Searching…";const s=await n.search(t);if(s.results.length===0){r.textContent=`No results for "${t}"`,i.innerHTML="";return}r.textContent=`${s.results.length} result${s.results.length===1?"":"s"} for "${t}"`;const m=await Promise.all(s.results.map(e=>e.data()));i.innerHTML=m.map(e=>{const c=e.meta?.image??"",o=e.meta?.category??"",h=e.meta?.intro??e.excerpt??"",g=c?`<img src="${c}" alt="" class="result-card__img" loading="lazy" />`:'<div class="result-card__img-placeholder" aria-hidden="true"></div>';return`
        <li>
          <a href="${e.url}" class="result-card">
            ${g}
            <div class="result-card__body">
              ${o?`<span class="result-card__category">${o}</span>`:""}
              <h3 class="result-card__title">${e.meta?.title??"Untitled"}</h3>
              <p class="result-card__intro">${h}</p>
            </div>
          </a>
        </li>
      `}).join("")}const f=new URLSearchParams(window.location.search),l=f.get("q")??"";l&&(a.value=l,d(l));let u;a.addEventListener("input",()=>{clearTimeout(u),u=setTimeout(()=>d(a.value),250)});a.addEventListener("input",()=>{const t=new URL(window.location.href);a.value.trim()?t.searchParams.set("q",a.value.trim()):t.searchParams.delete("q"),history.replaceState(null,"",t.toString())});a.focus();
