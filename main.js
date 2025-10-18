// Mobile menu toggle
const menuBtn = document.getElementById('menuBtn');
const html = document.documentElement;
if (menuBtn) menuBtn.addEventListener('click', ()=> html.classList.toggle('mobile-open'));

// Year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();


// --- Paste your YouTube links (any format: watch/shorts/embed, with params ok)
const YT_LINKS = [
  "https://www.youtube.com/watch?v=DSOBzN4tfIw",
  "https://www.youtube.com/watch?v=EhmfmRJRN0c",
  "https://www.youtube.com/watch?v=GvHz5BWP2Y8",
  "https://www.youtube.com/watch?v=LimWZURVHug",
  "https://www.youtube.com/watch?v=YRWRrYaBh-k",
  "https://www.youtube.com/watch?v=5nLOnH0ZzVw",
  "https://www.youtube.com/watch?v=nKOyi2avhVk",
  "https://www.youtube.com/shorts/4KhKKPb5D7w",
  "https://www.youtube.com/watch?v=a2MyRDtAcGk",
  "https://www.youtube.com/watch?v=TPkZhVFTpVU",
  "https://www.youtube.com/watch?v=3QEEMviSfgw",
  "https://www.youtube.com/watch?v=CNZOAn4ksWw",
  "https://www.youtube.com/watch?v=tVVAoeGAEC8",
  "https://www.youtube.com/watch?v=050nJxYTcXw",
  "https://www.youtube.com/shorts/8kiIYdwNboE",
  "https://www.youtube.com/watch?v=zI04WuxRZCE",
  "https://www.youtube.com/watch?v=cVPbolVwb9Y",
  "https://www.youtube.com/watch?v=AVQSyVJOfh8",
  "https://www.youtube.com/watch?v=aVkosFcATyk",
  "https://www.youtube.com/watch?v=v61kovOBoCk",
  "https://www.youtube.com/watch?v=goFiTdr09qI",
  "https://www.youtube.com/watch?v=vshXjjAlJE8&list=RDvshXjjAlJE8&start_radio=1",
  "https://www.youtube.com/watch?v=ydPrS3Z_erU",
  "https://www.youtube.com/watch?v=4VpVaw68I4s",
  "https://www.youtube.com/watch?v=n6_GZhRodHw&list=RDn6_GZhRodHw&start_radio=1",
  "https://www.youtube.com/watch?v=8PCnKdXJFaE&list=RD8PCnKdXJFaE&start_radio=1",
  "https://www.youtube.com/watch?v=tf2U_fnDao4"
];

/***** 2) Robust ID extraction + dedupe *****/
function idFromUrl(u){
  try{
    const url = new URL(u.trim());
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
    if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2];
    if (url.searchParams.has("v")) return url.searchParams.get("v");
    const m = url.pathname.match(/\/embed\/([A-Za-z0-9_-]{5,})/);
    return m ? m[1] : null;
  }catch{ return null; }
}
const YT_IDS = [...new Set(YT_LINKS.map(idFromUrl).filter(Boolean))]; // 26 from your list

/***** 3) Render ALL cards immediately (non-blocking) *****/
const escapeHTML = s => s.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
function cardHTML(id, title="Loading…"){
  const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  const safe = escapeHTML(title);
  return `
    <div class="video-card" data-id="${id}">
      <button class="video-thumb" data-yt="${id}" aria-label="Play: ${safe}">
        <img loading="lazy" src="${thumb}" alt="${safe}">
        <span class="play-badge">▶ Play</span>
      </button>
      <div class="video-meta">${safe}</div>
    </div>
  `;
}

function renderVideoGallery(){
  const grid = document.getElementById("videoGrid");
  if (!grid) return;
  grid.innerHTML = YT_IDS.map(id => cardHTML(id)).join("");
  console.log(`Videos -> links: ${YT_LINKS.length}, unique IDs: ${YT_IDS.length}`);
  // now fill titles asynchronously (doesn't block rendering)
  YT_IDS.forEach(async (id)=>{
    const title = await getTitleSafe(id);
    const meta = grid.querySelector(`.video-card[data-id="${id}"] .video-meta`);
    if (meta) meta.textContent = title;
  });
}

/***** 4) Safe title fetch (never throws; caches) *****/
async function getTitleSafe(id){
  const key = "ytTitle:"+id;
  try{
    const cached = localStorage.getItem(key);
    if (cached) return cached;
    const r = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
    if (!r.ok) return "YouTube video";
    const data = await r.json();
    const title = data.title || "YouTube video";
    localStorage.setItem(key, title);
    return title;
  }catch{ return "YouTube video"; }
}

/***** 5) Click → swap thumbnail to iframe *****/
document.addEventListener("click", e => {
  const btn = e.target.closest(".video-thumb");
  if (!btn) return;
  const id = btn.dataset.yt;
  const wrap = document.createElement("div");
  wrap.className = "video-thumb";
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.title = "YouTube video player";
  iframe.style = "position:absolute;inset:0;width:100%;height:100%";
  wrap.appendChild(iframe);
  btn.replaceWith(wrap);
});

document.addEventListener("DOMContentLoaded", renderVideoGallery);


// ==== Lightbox for .gallery images ====
(function(){
  const imgs = Array.from(document.querySelectorAll('.gallery img'));
  if (!imgs.length) return;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <button class="close" aria-label="Close">✕</button>
    <div class="nav">
      <button class="prev" aria-label="Previous">‹</button>
      <button class="next" aria-label="Next">›</button>
    </div>
    <img alt="">
    <div class="caption"></div>
  `;
  document.body.appendChild(lb);

  let i = 0;
  const imgEl = lb.querySelector('img');
  const capEl = lb.querySelector('.caption');

  function show(k){
    i = (k + imgs.length) % imgs.length;
    const src = imgs[i].dataset.full || imgs[i].src;
    imgEl.src = src;
    imgEl.alt = imgs[i].alt || '';
    capEl.textContent = imgs[i].alt || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close(){ lb.classList.remove('open'); document.body.style.overflow = ''; }

  imgs.forEach((im, idx)=> im.addEventListener('click', ()=> show(idx)));
  lb.querySelector('.close').addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  lb.querySelector('.prev').addEventListener('click', ()=> show(i-1));
  lb.querySelector('.next').addEventListener('click', ()=> show(i+1));
  document.addEventListener('keydown', e=>{
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft')  show(i-1);
    if (e.key === 'ArrowRight') show(i+1);
  });
})();
// ==== End of lightbox code ====